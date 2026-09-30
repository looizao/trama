#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""CPU supporting-component processing of an explicitly identified fitted head.

No raw-photo reconstruction, fallback head, model weights or remote processing.
The registration arm uses a declared synthetic rigid transform, never a scan.
"""
import copy
import hashlib
import json
import os
from pathlib import Path
import shutil
import struct
import sys

ROOT = Path(__file__).resolve().parents[2]
interfaces = [line.split(':', 1)[0].strip() for line in Path('/proc/self/net/dev').read_text().splitlines() if ':' in line]
if __name__ == '__main__' and any(interface != 'lo' for interface in interfaces):
    os.execvp('unshare', ['unshare', '--user', '--map-root-user', '--net', '--', sys.executable, str(Path(__file__).resolve()), *sys.argv[1:]])
os.umask(0o077)
import numpy as np
import open3d as o3d
from PIL import Image, ImageDraw
from geometry import export, render, camera
# This original GLB reader imports no FLAME model, reference implementation or weights.
from flame import read_shared_glb

VERSION = 'open3d-cpu-upstream-v5'
VIEWS = [('front', 0), ('left-three-quarter', 45), ('right-three-quarter', -45), ('left-profile', 90), ('right-profile', -90), ('back', 180)]


def native_mesh(mesh):
    return o3d.geometry.TriangleMesh(o3d.utility.Vector3dVector(mesh['xyz']), o3d.utility.Vector3iVector(mesh['tri']))


def distances(scene_mesh, points):
    tensor = o3d.t.geometry.TriangleMesh.from_legacy(scene_mesh)
    scene = o3d.t.geometry.RaycastingScene(nthreads=4)
    scene.add_triangles(tensor)
    return scene.compute_distance(o3d.core.Tensor(np.asarray(points, dtype=np.float32))).numpy().astype(float)


def main(directory):
    assert o3d.__version__ == '0.20.0' and not o3d._build_config['BUILD_CUDA_MODULE']
    o3d.utility.set_max_threads(4); o3d.utility.random.seed(419)
    manifest = json.loads((directory / 'manifest.json').read_text()); source = manifest['upstream']; settings = manifest['component']
    assert source['runId'] == settings['sourceRunId'] and source['candidate'] in ['blender-mpfb', 'makehuman', 'flame', 'open3d', 'meshlab']
    upstream = directory / source['path']
    assert upstream.resolve().is_relative_to(directory)
    for relative, digest in source['sha256'].items():
        path = (upstream / relative).resolve()
        assert path.is_relative_to(upstream) and hashlib.sha256(path.read_bytes()).hexdigest() == digest
    assert .25 <= settings['triangleRatio'] <= 1 and .001 <= settings['voxelSize'] <= .01 and 2000 <= settings['samplePoints'] <= 50000
    cache = directory / 'textures'; cache.mkdir(exist_ok=True)
    meshes = read_shared_glb(upstream / 'head.glb', cache)
    index = next(i for i, mesh in enumerate(meshes) if any(s in mesh['name'].lower() for s in ['skin', 'head', 'template']))
    original = native_mesh(meshes[index]); mesh = copy.deepcopy(original)
    before = {'vertices': len(mesh.vertices), 'triangles': len(mesh.triangles)}
    # Preserve intentionally separate coincident vertices at neck-cap and material-normal seams.
    # Welding them changes shading even when geometry deviation is very small.
    mesh.remove_duplicated_triangles().remove_degenerate_triangles().remove_unreferenced_vertices()
    target = max(100, int(len(mesh.triangles) * settings['triangleRatio']))
    if settings['triangleRatio'] < 1: mesh = mesh.simplify_quadric_decimation(target, boundary_weight=10)
    mesh.compute_vertex_normals()
    xyz = np.asarray(mesh.vertices); tri = np.asarray(mesh.triangles)
    assert len(tri) > 100 and np.isfinite(xyz).all() and np.isfinite(np.asarray(mesh.vertex_normals)).all()
    assert tri.min() >= 0 and tri.max() < len(xyz)
    d1 = distances(mesh, original.vertices); d2 = distances(original, mesh.vertices)
    # These are retained mesh-to-surface deviations, not distances to a real person.
    deviation = {'upstreamVerticesToProcessedSurface': {'meanMetres': float(d1.mean()), 'rmsMetres': float(np.sqrt(np.mean(d1*d1))), 'maximumMetres': float(d1.max())},
                 'processedVerticesToUpstreamSurface': {'meanMetres': float(d2.mean()), 'rmsMetres': float(np.sqrt(np.mean(d2*d2))), 'maximumMetres': float(d2.max())}}
    cloud = original.sample_points_uniformly(settings['samplePoints']); voxel = cloud.voxel_down_sample(settings['voxelSize'])
    clean, retained = voxel.remove_statistical_outlier(nb_neighbors=20, std_ratio=2)
    assert len(clean.points) >= 100
    clean.estimate_normals(o3d.geometry.KDTreeSearchParamHybrid(radius=settings['voxelSize']*4, max_nn=30))
    rigid = np.eye(4); rigid[:3,:3] = clean.get_rotation_matrix_from_xyz((0, 0, np.deg2rad(8))); rigid[:3,3] = [.005, -.003, .004]
    moved = copy.deepcopy(clean).transform(rigid)
    iterations = []
    def record_iteration(values):
        iterations.append({'iteration': int(values['iteration_index'].item()), 'fitness': float(values['fitness'].item()), 'inlierRmseMetres': float(values['inlier_rmse'].item()), 'transformation': values['transformation'].numpy().tolist()})
    source_tensor = o3d.t.geometry.PointCloud.from_legacy(moved, dtype=o3d.core.Dtype.Float64)
    target_tensor = o3d.t.geometry.PointCloud.from_legacy(clean, dtype=o3d.core.Dtype.Float64)
    fit = o3d.t.pipelines.registration.icp(source_tensor, target_tensor, .02, o3d.core.Tensor(np.eye(4), dtype=o3d.core.Dtype.Float64), o3d.t.pipelines.registration.TransformationEstimationPointToPlane(), o3d.t.pipelines.registration.ICPConvergenceCriteria(max_iteration=80), callback_after_iteration=record_iteration)
    transform = fit.transformation.numpy()
    assert np.isfinite(transform).all() and fit.fitness > .95 and len(iterations) > 0
    recovered = transform @ rigid
    recovered_error = np.linalg.norm(np.asarray(clean.points) @ recovered[:3,:3].T + recovered[:3,3] - np.asarray(clean.points), axis=1)
    raw = (upstream / 'head.glb').read_bytes(); size = struct.unpack_from('<I', raw, 12)[0]; doc = json.loads(raw[20:20+size])
    provenance = {'upstreamCandidate': source['candidate'], 'upstreamRunId': source['runId'], 'sourceHeadSha256': source['sha256']['head.glb'], 'upstreamProvenance': doc['asset'].get('extras', {}),
                  'component': 'Open3D CPU 0.20.0 / MIT', 'componentLicenseUrl': 'https://github.com/isl-org/Open3D/blob/v0.20.0/LICENSE', 'componentModifications': 'Native mesh cleanup, bounded quadric decimation and normals; original eye geometry/materials and adapted shared style meshes retained.', 'geometry': source['geometry'], 'professionalReview': 'pending'}
    o3d.io.write_point_cloud(str(directory / 'upstream-sampled.ply'), cloud, compressed=True)
    o3d.io.write_point_cloud(str(directory / 'processed-points.ply'), clean, compressed=True)
    o3d.io.write_triangle_mesh(str(directory / 'processed-skin.ply'), mesh, compressed=True)
    for filename in ['upstream-sampled.ply','processed-points.ply','processed-skin.ply']:
        path=directory/filename; data=path.read_bytes(); position=data.index(b'\n',data.index(b'\n')+1)+1
        # RPly has a bounded line buffer. Retain the full ASCII JSON in short
        # ordered comment lines, preserving compatibility with native readers.
        payload=json.dumps(provenance,separators=(',',':'),ensure_ascii=True).encode('ascii')
        comments=b''.join(b'comment Trama provenance part '+f'{n//160:04d} '.encode()+payload[n:n+160]+b'\n' for n in range(0,len(payload),160))
        path.write_bytes(data[:position]+comments+data[position:])
    output = copy.deepcopy(meshes); output[index]['xyz'] = xyz.copy(); output[index]['tri'] = tri.copy(); output[index].pop('uv', None); output[index].pop('texture', None)
    # Current fitted skin is clay, never a client texture; refuse to discard a future textured skin.
    assert 'texture' not in meshes[index], 'Textured skin needs an explicit UV-preserving route; no silent material loss'
    output[0]['provenance'] = provenance
    export(directory / 'head.glb', output)
    for kind in ['hair','beard']:
        (directory / kind).mkdir(exist_ok=True)
        for path in sorted((upstream / kind).glob('*.glb')): shutil.copyfile(path, directory / kind / path.name)
    renders = directory / 'fitted-renders'; renders.mkdir(exist_ok=True)
    for view, yaw in VIEWS:
        print('OPEN3D_RENDER', view, flush=True); render(renders / (view+'.png'), output, camera(yaw, manifest['settings']))
    report = {'candidate': 'open3d', 'version': o3d.__version__, 'processingVersion': VERSION, 'upstream': {'runId': source['runId'], 'candidate': source['candidate'], 'headSha256': source['sha256']['head.glb']}, 'settings': settings,
              'geometry': source['geometry'], 'mesh': {'before': before, 'after': {'vertices': len(xyz), 'triangles': len(tri)}, 'triangleTarget': target, 'preservesCoincidentNormalSeams': True, 'deviation': deviation},
              'pointProcessing': {'sampled': len(cloud.points), 'voxelized': len(voxel.points), 'retainedAfterOutlierFilter': len(clean.points), 'role': 'Supporting diagnostic point cloud, not a new photo reconstruction. Anatomy removed by the outlier filter is not removed from the retained head.'},
              'alignment': {'input': 'Same upstream mesh sampled once, copied and transformed by an explicitly known synthetic rigid transform. No independent measured scan used.', 'knownTransform': rigid.tolist(), 'recoveredTransform': transform.tolist(), 'actualIterations': len(iterations), 'iterations': iterations, 'method': 'Open3D CPU Tensor point-to-plane ICP with native iteration callback', 'fitness': fit.fitness, 'inlierRmseMetres': fit.inlier_rmse, 'maximumIterations': 80, 'recoveredPointMaximumErrorMetres': float(recovered_error.max()), 'recoveredPointRmsErrorMetres': float(np.sqrt(np.mean(recovered_error**2)))},
              'styleCompatibility': {'method': 'Copy the same independent upstream fitted styles, preserving exact geometry, textures and license metadata. Decimation deviation is measured for clipping review; attachments are not relabeled as new client observations.', 'styles': [{'path': rel, 'sha256': digest} for rel,digest in source['sha256'].items() if rel!='head.glb']},
              'provenance': provenance, 'limitations': ['Open3D is a supporting geometry processor requiring the identified native fitting route.', 'No independent scan or observed head geometry is available in this six-photo synthetic arm. Mesh agreement and transform recovery do not establish real-client likeness.', 'Quadric decimation may erase fine facial detail or alter style clipping; professional inspection and future direct editing remain pending.', 'The sampled/filtered cloud is a diagnostic output only. Hidden surfaces inherit upstream template inference.', 'Full refinement and expected-result journey remain pending common workflow tasks.']}
    (directory / 'component-report.json').write_text(json.dumps(report, indent=2)+'\n')
    picture = Image.new('RGB', (1250,760), '#eef2f4'); draw = ImageDraw.Draw(picture)
    draw.text((24,20), 'Open3D 0.20.0 CPU / actual fitted-mesh processing / '+source['candidate'], fill='#17313d', font_size=26)
    draw.text((24,65), 'Synthetic input. Mesh deviation is against upstream fitted geometry, not a real-person scan.', fill='#17313d', font_size=19)
    left = Image.open(renders/'front.png').convert('RGB').resize((480,560));picture.paste(left,(20,110))
    lines = [f"Triangles: {before['triangles']} -> {len(tri)}", f"Vertices: {before['vertices']} -> {len(xyz)}", f"Upstream -> processed: mean {d1.mean()*1000:.4f} mm", f"Upstream -> processed: max {d1.max()*1000:.4f} mm", f"Sampled: {len(cloud.points)} / voxel: {len(voxel.points)}", f"After statistical outlier filter: {len(clean.points)}", f"Known synthetic rotation: 8 deg / translation 5,-3,4 mm", f"ICP fitness: {fit.fitness:.6f} / {len(iterations)} actual iterations", f"Recovered-point max error: {recovered_error.max()*1000:.6f} mm", 'Hair and beard: same independent upstream GLBs', 'No raw-photo reconstruction attributed to Open3D', 'Professional likeness and style acceptance pending']
    for n,line in enumerate(lines): draw.text((530,130+n*41),line,fill='#17313d',font_size=19)
    draw.text((24,710), 'Retained source-run and all six original photos remain live dependencies. Removing them purges this copy.', fill='#17313d', font_size=18)
    picture.save(directory / 'component-evaluation.png')
    print('OPEN3D_PROCESSING', json.dumps({'trianglesBefore':before['triangles'],'trianglesAfter':len(tri),'maximumDeviationMetres':float(d1.max()),'registrationFitness':fit.fitness}), flush=True)


if __name__ == '__main__': main(Path(sys.argv[1]).resolve())
