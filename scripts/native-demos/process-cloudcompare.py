#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Actual CloudCompare conversion, sampling, distances and known-transform ICP."""
import copy
import ctypes
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import signal
import struct
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
interfaces = [line.split(':', 1)[0].strip() for line in Path('/proc/self/net/dev').read_text().splitlines() if ':' in line]
if __name__ == '__main__' and any(i != 'lo' for i in interfaces):
    os.execvp('unshare', ['unshare', '--user', '--map-root-user', '--net', '--', sys.executable, str(Path(__file__).resolve()), *sys.argv[1:]])
os.umask(0o077)
import numpy as np
from PIL import Image, ImageDraw
from flame import read_shared_glb
from geometry import export, render, camera

VERSION = 'cloudcompare-native-upstream-v2'
VIEWS = [('front', 0), ('left-three-quarter', 45), ('right-three-quarter', -45), ('left-profile', 90), ('right-profile', -90), ('back', 180)]

def write_ply(path, xyz, tri=None):
    with path.open('w') as f:
        f.write('ply\nformat ascii 1.0\nelement vertex ' + str(len(xyz)) + '\nproperty float x\nproperty float y\nproperty float z\n')
        if tri is not None:
            f.write('element face ' + str(len(tri)) + '\nproperty list uchar int vertex_indices\n')
        f.write('end_header\n')
        np.savetxt(f, xyz, fmt='%.12g')
        if tri is not None:
            np.savetxt(f, np.column_stack([np.full(len(tri), 3), tri]), fmt='%d')

def read_ply(path):
    raw = path.read_bytes(); header, body = raw.split(b'end_header\n', 1)
    lines = header.decode('ascii').splitlines()+['end_header']
    assert lines[0] == 'ply' and lines[1] in ['format ascii 1.0', 'format binary_little_endian 1.0']
    end = lines.index('end_header')
    count = faces = 0
    properties = []
    types = []
    in_vertex = False
    for line in lines[2:end]:
        if line.startswith('element '):
            in_vertex = line.startswith('element vertex ')
            if in_vertex: count = int(line.split()[-1])
            elif line.startswith('element face '): faces = int(line.split()[-1])
        elif line.startswith('property ') and in_vertex:
            properties.append(line.split()[-1])
            types.append(line.split()[1])
    if lines[1] == 'format ascii 1.0':
        rows = body.decode().splitlines()
        values = np.array([[float(v) for v in line.split()] for line in rows[:count]])
        tri = np.array([[int(v) for v in line.split()][1:] for line in rows[count:count+faces]], dtype=np.int64).reshape(-1, 3)
    else:
        dtypes = {'float': '<f4', 'double': '<f8', 'uchar': 'u1', 'char': 'i1', 'int': '<i4', 'uint': '<u4'}
        dtype = np.dtype([(name, dtypes[kind]) for name, kind in zip(properties, types)])
        native_values = np.frombuffer(body, dtype=dtype, count=count)
        values = np.column_stack([native_values[name] for name in properties])
        face_dtype = np.dtype([('size', 'u1'), ('indices', '<i4', (3,))])
        assert not faces or 'property list uchar int vertex_indices' in lines
        native_faces = np.frombuffer(body, dtype=face_dtype, count=faces, offset=dtype.itemsize*count)
        assert np.all(native_faces['size']==3) and len(body)==dtype.itemsize*count+face_dtype.itemsize*faces
        tri = native_faces['indices'].astype(np.int64)
    assert len(values) == count and values.shape[1] == len(properties) and np.isfinite(values).all()
    xyz = values[:, [properties.index(axis) for axis in ['x', 'y', 'z']]]
    scalars = {name: values[:, n] for n, name in enumerate(properties) if name not in ['x', 'y', 'z', 'nx', 'ny', 'nz', 'red', 'green', 'blue', 'alpha']}
    return xyz, tri, scalars

def stamp(path, provenance):
    data = path.read_bytes(); position = data.index(b'\n', data.index(b'\n')+1)+1
    payload = json.dumps(provenance, separators=(',', ':'), ensure_ascii=True).encode('ascii')
    comments = b''.join(b'comment Trama provenance part ' + f'{n//160:04d} '.encode() + payload[n:n+160] + b'\n' for n in range(0, len(payload), 160))
    path.write_bytes(data[:position]+comments+data[position:])

def main(directory):
    manifest = json.loads((directory/'manifest.json').read_text()); source = manifest['upstream']; settings = manifest['component']
    assert source['runId'] == settings['sourceRunId'] and 2000 <= settings['samplePoints'] <= 50000
    iterations = settings.get('icpIterations') or 80; overlap = settings.get('icpOverlap') or 100
    assert 10 <= iterations <= 200 and 50 <= overlap <= 100
    upstream = (directory/source['path']).resolve(); assert upstream.is_relative_to(directory)
    for relative, digest in source['sha256'].items():
        path = (upstream/relative).resolve(); assert path.is_relative_to(upstream) and hashlib.sha256(path.read_bytes()).hexdigest() == digest
    binary = ROOT/'.scratch/private/native-demos/cloudcompare/bin/CloudCompare'
    software = json.loads((ROOT/'.scratch/execution-log/assets/cloudcompare-provenance.json').read_text())['software']
    assert hashlib.sha256(binary.read_bytes()).hexdigest() == software['binarySha256']
    env = dict(os.environ, QT_QPA_PLATFORM='offscreen', QT_PLUGIN_PATH='/usr/lib/qt/plugins', LD_LIBRARY_PATH=str(ROOT/'.scratch/private/native-demos/cloudcompare-qt/usr/lib'), OMP_NUM_THREADS='4')
    native = directory/'cloudcompare-native'; native.mkdir(exist_ok=True)
    env.update(XDG_CONFIG_HOME=str(native/'config'), XDG_DATA_HOME=str(native/'data'), XDG_CACHE_HOME=str(native/'cache'), XDG_DATA_DIRS=str(ROOT/'.scratch/private/native-demos/cloudcompare/share'))
    commands = []; stage_parent = os.getpid()
    def protect():
        if ctypes.CDLL(None).prctl(1, signal.SIGKILL) != 0: os._exit(125)
        if os.getppid() != stage_parent: os.kill(os.getpid(), signal.SIGKILL)
    def cli(label, arguments, working=None):
        command = [str(binary), '-SILENT', '-AUTO_SAVE', 'OFF', '-NO_TIMESTAMP', '-C_EXPORT_FMT', 'PLY', '-M_EXPORT_FMT', 'PLY', '-PLY_EXPORT_FMT', 'BINARY_LE'] + arguments
        started = time.monotonic()
        result = subprocess.run(command, cwd=working or native, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, preexec_fn=protect)
        (native/(label+'.log')).write_text(result.stdout)
        commands.append({'stage': label, 'command': command, 'seconds': round(time.monotonic()-started, 6), 'exitCode': result.returncode})
        print('CLOUDCOMPARE_STAGE', json.dumps(commands[-1]), flush=True)
        assert result.returncode == 0, 'Actual CloudCompare '+label+' failed; inspect retained native log'
        return result.stdout
    cache = directory/'textures'; cache.mkdir(exist_ok=True)
    meshes = read_shared_glb(upstream/'head.glb', cache)
    index = next(i for i, m in enumerate(meshes) if any(s in m['name'].lower() for s in ['skin', 'head', 'template']))
    skin = meshes[index]; assert 'texture' not in skin, 'Textured skin needs explicit UV-preserving conversion'
    original = {'vertices': len(skin['xyz']), 'triangles': len(skin['tri'])}
    input_mesh = native/'upstream.ply'; write_ply(input_mesh, skin['xyz'], skin['tri'])
    # Native export and random surface sampling are retained as actual outputs.
    # Sampling randomness is explicitly recorded, with no fabricated seed claim.
    sampled = directory/'upstream-sampled.ply'; converted = directory/'processed-skin.ply'
    cli('sample-convert-distance', ['-O', str(input_mesh), '-SAVE_MESHES', 'FILE', str(converted), '-SAMPLE_MESH', 'POINTS', str(settings['samplePoints']), '-C2M_DIST', '-UNSIGNED', '-MAX_TCOUNT', '4', '-SAVE_CLOUDS', 'FILE', str(sampled)])
    xyz, tri, _ = read_ply(converted)
    assert xyz.shape == skin['xyz'].shape and np.array_equal(tri, skin['tri']) and np.allclose(xyz, skin['xyz'], atol=1e-7), 'Native conversion changed order/topology/coordinates'
    points, _, surface_distances = read_ply(sampled)
    surface = next(v for k, v in surface_distances.items() if 'distance' in k.lower())
    # Known synthetic rigid perturbation of the actual native skin vertices,
    # compared to the same vertices. This is not a second capture or a scan.
    angle = np.deg2rad(8)
    rotation = np.array([[np.cos(angle), -np.sin(angle), 0], [np.sin(angle), np.cos(angle), 0], [0, 0, 1]])
    shift = np.array([.005, -.003, .004]); disturbed = xyz@rotation.T + shift
    write_ply(native/'known-transform.ply', disturbed); write_ply(native/'reference.ply', xyz)
    moved = native/'aligned.ply'; reference = native/'reference-export.ply'
    icp_log = cli('icp', ['-O', str(native/'known-transform.ply'), '-O', str(native/'reference.ply'), '-ICP', '-MAX_TCOUNT', '4', '-ITER', str(iterations), '-OVERLAP', str(overlap), '-RANDOM_SAMPLING_LIMIT', '50000', '-C2C_DIST', '-MAX_TCOUNT', '4', '-SAVE_CLOUDS', 'FILE', str(moved)+' '+str(reference)])
    aligned, _, point_distances = read_ply(moved)
    distance = next(v for k, v in point_distances.items() if 'distance' in k.lower())
    matrix_path = native/'known-transform_REGISTRATION_MATRIX.txt'; matrix = np.loadtxt(matrix_path)
    trace = (native/'registration_trace_log.csv').read_text().splitlines()[1:]
    history = []
    for line in trace:
        n, rms, count = line.strip().rstrip(';').split(';')
        history.append({'iteration': int(n), 'inlierRmseMetres': float(rms), 'pointCount': int(count), 'fitness': int(count)/len(xyz)})
    assert history and matrix.shape == (4, 4) and aligned.shape == xyz.shape
    final_rms = float(re.findall(r'RMS: ([0-9.eE+-]+)', icp_log)[-1])
    final_count = int(re.findall(r'Number of points used for final step: (\d+)', icp_log)[-1])
    recovery = np.linalg.norm(aligned-xyz, axis=1)
    matrix_error = np.abs((disturbed@matrix[:3, :3].T+matrix[:3, 3])-aligned).max()
    assert matrix_error < .00001, 'Actual matrix disagrees with native transformed output'
    comparison = None
    if source.get('reference'):
        ref = source['reference']; assert ref['runId'] == settings['referenceRunId'] and ref['runId'] != source['runId']
        ref_dir = (directory/ref['path']).resolve(); assert ref_dir.is_relative_to(directory)
        for relative, digest in ref['sha256'].items():
            path = (ref_dir/relative).resolve(); assert path.is_relative_to(ref_dir) and hashlib.sha256(path.read_bytes()).hexdigest() == digest
        ref_meshes = read_shared_glb(ref_dir/'head.glb', cache)
        ref_skin = next(m for m in ref_meshes if any(s in m['name'].lower() for s in ['skin', 'head', 'template']))
        cross = native/'cross-route'; cross.mkdir(exist_ok=True)
        data_path = cross/'compared-vertices.ply'; ref_path = cross/'reference-skin.ply'
        write_ply(data_path, xyz); write_ply(ref_path, ref_skin['xyz'], ref_skin['tri'])
        before_path = directory/'comparison-before.ply'; after_path = directory/'comparison-aligned.ply'
        # Native distance fields before and after registration to a DIFFERENT
        # identified fitting route. Neither fit is measured ground truth.
        cli('cross-route-distance-before', ['-O', str(data_path), '-O', str(ref_path), '-C2M_DIST', '-UNSIGNED', '-MAX_TCOUNT', '4', '-SAVE_CLOUDS', 'FILE', str(before_path)], working=cross)
        cross_log = cli('cross-route-alignment', ['-O', str(data_path), '-O', str(ref_path), '-ICP', '-MAX_TCOUNT', '4', '-ITER', str(iterations), '-OVERLAP', str(overlap), '-RANDOM_SAMPLING_LIMIT', '50000', '-C2M_DIST', '-UNSIGNED', '-MAX_TCOUNT', '4', '-SAVE_CLOUDS', 'FILE', str(after_path)], working=cross)
        before_xyz, _, before_sf = read_ply(before_path); after_xyz, _, after_sf = read_ply(after_path)
        before_d = next(v for k,v in before_sf.items() if 'distance' in k.lower()); after_d = next(v for k,v in after_sf.items() if 'distance' in k.lower())
        cross_matrix = np.loadtxt(cross/'compared-vertices_REGISTRATION_MATRIX.txt')
        assert before_xyz.shape == after_xyz.shape == xyz.shape
        assert np.abs(xyz@cross_matrix[:3,:3].T+cross_matrix[:3,3]-after_xyz).max() < .00001
        def distances(values): return {'count':len(values),'meanMetres':float(values.mean()),'rmsMetres':float(np.sqrt(np.mean(values**2))),'maximumMetres':float(values.max())}
        comparison = {'referenceRunId': ref['runId'], 'referenceCandidate': ref['candidate'], 'referenceHeadSha256': ref['sha256']['head.glb'], 'scope':'Actual native CloudCompare rigid registration and unsigned vertex-to-mesh distances between two fitted heads from the same six synthetic photos. No independently observed geometry or real-client accuracy.', 'beforeAlignment':distances(before_d),'afterAlignment':distances(after_d),'nativeMatrix':cross_matrix.tolist(),'nativeFinalRmsMetres':float(re.findall(r'RMS: ([0-9.eE+-]+)',cross_log)[-1]),'nativeTrace':(cross/'registration_trace_log.csv').read_text(),'previewEffect':'Evaluation only. Cross-route alignment does not change the retained source preview or its styles.','surfaceCoverage':'Distances include the cropped fitted skin and neck surfaces. Different templates and inferred hidden surfaces can dominate disagreement.'}
    raw = (upstream/'head.glb').read_bytes(); size = struct.unpack_from('<I', raw, 12)[0]; doc = json.loads(raw[20:20+size])
    provenance = {'upstreamCandidate': source['candidate'], 'upstreamRunId': source['runId'], 'sourceHeadSha256': source['sha256']['head.glb'], 'upstreamProvenance': doc['asset'].get('extras', {}), 'component': 'CloudCompare 2.13.2 native CLI / GPL-3.0-or-later combined build', 'componentLicenseUrl': software['licenseUrl'], 'componentModifications': 'Native mesh conversion, surface sampling, unsigned cloud-to-mesh distances, known synthetic transform ICP and cloud-to-cloud distances. Existing ICP Release trace enabled at 12 significant digits. Returned preview uses actual converted upstream skin, with original eyes/materials and all independent styles.', 'geometry': source['geometry'], 'professionalReview': 'pending'}
    if comparison:
        ref_raw=(ref_dir/'head.glb').read_bytes();ref_size=struct.unpack_from('<I',ref_raw,12)[0]
        provenance['comparisonReference']={'runId':ref['runId'],'candidate':ref['candidate'],'headSha256':ref['sha256']['head.glb'],'upstreamProvenance':json.loads(ref_raw[20:20+ref_size])['asset'].get('extras',{}),'changeNotice':'Native CloudCompare rigid registration and distances, with transformed diagnostic clouds only. The source preview and independent styles are unchanged.'}
    processed_points = directory/'processed-points.ply'; shutil.copyfile(moved, processed_points)
    for file in [sampled, converted, processed_points]: stamp(file, provenance)
    if comparison:
        for file in [before_path,after_path]:stamp(file,provenance)
    # Use the candidate's own reader, including the chunked provenance comments.
    reopened = native/'reopened.ply'
    cli('native-reopen', ['-O', str(converted), '-SAVE_MESHES', 'FILE', str(reopened)])
    reopened_xyz, reopened_tri, _ = read_ply(reopened)
    assert np.array_equal(reopened_tri, tri) and np.allclose(reopened_xyz, xyz, atol=1e-7)
    output = copy.deepcopy(meshes); output[index]['xyz'] = xyz; output[index]['tri'] = tri; output[0]['provenance'] = provenance
    export(directory/'head.glb', output)
    for kind in ['hair', 'beard']:
        (directory/kind).mkdir(exist_ok=True)
        for path in sorted((upstream/kind).glob('*.glb')): shutil.copyfile(path, directory/kind/path.name)
    renders = directory/'fitted-renders'; renders.mkdir(exist_ok=True)
    for view, yaw in VIEWS:
        print('CLOUDCOMPARE_RENDER', view, flush=True); render(renders/(view+'.png'), output, camera(yaw, manifest['settings']))
    conversion_error = float(np.linalg.norm(xyz-skin['xyz'], axis=1).max())
    deviation = {'meanMetres': float(np.linalg.norm(xyz-skin['xyz'], axis=1).mean()), 'maximumMetres': conversion_error}
    report = {'candidate': 'cloudcompare', 'version': '2.13.2', 'processingVersion': VERSION, 'upstream': {'runId': source['runId'], 'candidate': source['candidate'], 'headSha256': source['sha256']['head.glb']}, 'settings': settings, 'geometry': source['geometry'], 'mesh': {'before': original, 'after': {'vertices': len(xyz), 'triangles': len(tri)}, 'triangleTarget': len(tri), 'deviation': {'upstreamVerticesToProcessedSurface': deviation, 'processedVerticesToUpstreamSurface': deviation}}, 'conversion': {'nativeWriter': 'CloudCompare PLY', 'nativeReader': 'CloudCompare PLY', 'reopenedCounts': original, 'maximumCoordinateErrorMetres': conversion_error, 'fullLicenseProvenanceEmbedded': True}, 'commands': commands, 'distanceSamples': {'nativeSurfaceSampling': {'requested': settings['samplePoints'], 'actual': len(points), 'randomSeed': 'CloudCompare internal random sampling has no seed control in this pinned CLI; outputs retained for reproducibility, sample coordinates may vary on rerun.'}, 'sampledCloudToConvertedMesh': {'count': len(surface), 'meanMetres': float(surface.mean()), 'maximumMetres': float(surface.max())}, 'alignedVerticesToOriginalVertices': {'count': len(distance), 'meanMetres': float(distance.mean()), 'maximumMetres': float(distance.max())}}, 'alignment': {'input': 'Known synthetic 8 degree Z rotation and 5,-3,4 mm translation of the same fitted skin vertices. Reference is the same geometry, not a second scan or measured client.', 'fitness': final_count/len(xyz), 'fitnessMeaning': 'Native final point count divided by input vertex count, not independent surface coverage.', 'inlierRmseMetres': final_rms, 'maximumIterations': iterations, 'actualIterations': max(0, len(history)-1), 'traceStates': len(history), 'iterations': history, 'recoveredPointMaximumErrorMetres': float(recovery.max()), 'knownTransform': {'rotation': rotation.tolist(), 'translationMetres': shift.tolist()}, 'nativeRecoveredTransform': matrix.tolist(), 'nativeMatrixOutputMaximumErrorMetres': float(matrix_error)}, 'styleCompatibility': {'method': 'Exact unchanged upstream style GLBs and actual native converted skin; no new fitting or anatomy inferred.', 'styles': [{'path': r, 'sha256': h} for r, h in source['sha256'].items() if r != 'head.glb']}, 'provenance': provenance, 'limitations': ['CloudCompare is a supporting alignment/evaluation/conversion tool dependent on the named fitted route. It does not reconstruct a head from six photos.', 'The returned preview remains the converted upstream fit. ICP evaluates a known perturbation of that same geometry; no head correction or real client accuracy is inferred.', 'Reported preview deviation is coordinate conversion error with identical topology, not a Hausdorff surface error or observed likeness measurement.', 'Native surface samples are random and retained. Internal seed control is unavailable; compare distances/statistics rather than byte-identical samples.', 'ICP can stop before the configured limit on increasing RMS or exact convergence. The trace includes the initial and stopping evaluation states; actualIterations is their count minus one.', 'Style quality, missing surfaces, clipping and professional acceptance remain properties of the upstream fit and catalog. Full refinements/expected-result journeys remain pending common workflow tasks.']}
    (directory/'component-report.json').write_text(json.dumps(report, indent=2)+'\n')
    if comparison:
        report['comparison']=comparison
        (directory/'component-report.json').write_text(json.dumps(report,indent=2)+'\n')
    picture = Image.new('RGB', (1250, 760), '#eef2f4'); draw = ImageDraw.Draw(picture)
    draw.text((24, 20), 'CloudCompare 2.13.2 / actual native CLI / '+source['candidate'], fill='#17313d', font_size=25)
    draw.text((24, 65), 'Synthetic same-geometry diagnostic. No independent scan or six-photo reconstruction.', fill='#17313d', font_size=19)
    picture.paste(Image.open(renders/'front.png').convert('RGB').resize((480, 560)), (20, 110))
    lines = ['Actual native surface samples: '+str(len(points)), 'ICP trace states / updates: '+str(len(history))+' / '+str(len(history)-1), f'Native final RMS: {final_rms*1000:.6f} mm', f'Known-point recovery max: {recovery.max()*1000:.6f} mm', f'Native C2C max: {distance.max()*1000:.6f} mm', f'Native C2M max: {surface.max()*1000:.6f} mm', f'Conversion coordinate max: {conversion_error*1000:.6f} mm', 'Native PLY -> native reader: passed', 'Same independent hair and beard GLBs retained', 'Professional likeness and style review pending']
    for n, line in enumerate(lines): draw.text((530, 135+n*44), line, fill='#17313d', font_size=18)
    draw.text((24, 710), 'The upstream experiment and its six original photos remain live dependencies.', fill='#17313d', font_size=18)
    picture.save(directory/'component-evaluation.png')

if __name__ == '__main__': main(Path(sys.argv[1]).resolve())
