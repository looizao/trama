#!/usr/bin/env python3
"""Inspect actual standalone outputs and compare authorized input snapshots."""
import argparse
import datetime
import hashlib
import io
import json
import os
import shutil
import subprocess
import sys
import uuid
from pathlib import Path
import struct

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
runtime = ROOT / '.scratch/private/runtime'
log = ROOT / '.scratch/execution-log/assets'
imports = json.loads((runtime / 'demo-asset-imports.json').read_text())
runs = json.loads((runtime / 'native-demo-imports.json').read_text())


def inspect_glb(path):
    data = path.read_bytes()
    magic, version, length = struct.unpack_from('<III', data)
    assert magic == 0x46546c67 and version == 2 and length == len(data)
    size, kind = struct.unpack_from('<II', data, 12); assert kind == 0x4e4f534a
    doc = json.loads(data[20:20 + size]); offset = 20 + size
    binary_size, kind = struct.unpack_from('<II', data, offset); assert kind == 0x004e4942
    binary = data[offset + 8:offset + 8 + binary_size]

    def accessor(index):
        a = doc['accessors'][index]; view = doc['bufferViews'][a['bufferView']]
        assert 'byteStride' not in view
        components = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3}[a['type']]
        dtype = {5125: '<u4', 5126: '<f4'}[a['componentType']]
        begin = view.get('byteOffset', 0) + a.get('byteOffset', 0)
        end = begin + a['count'] * components * 4
        assert end <= view.get('byteOffset', 0) + view['byteLength'] <= len(binary)
        array = np.frombuffer(binary, dtype=dtype, count=a['count'] * components, offset=begin).reshape(-1, components)
        assert np.isfinite(array).all()
        if 'min' in a:
            assert np.allclose(array.min(0), a['min'], atol=1e-6) and np.allclose(array.max(0), a['max'], atol=1e-6)
        return array

    vertices = triangles = 0; bounds = []
    for mesh in doc['meshes']:
        for primitive in mesh['primitives']:
            xyz = accessor(primitive['attributes']['POSITION'])
            normal = accessor(primitive['attributes']['NORMAL'])
            assert len(normal) == len(xyz) and np.allclose(np.linalg.norm(normal, axis=1), 1, atol=.0001)
            indices = accessor(primitive['indices']); assert indices.max() < len(xyz) and len(indices) % 3 == 0
            assert np.abs(xyz).max() < 3, 'Interchange scale outside head/style range in metres'
            if 'TEXCOORD_0' in primitive['attributes']:
                assert len(accessor(primitive['attributes']['TEXCOORD_0'])) == len(xyz)
            vertices += len(xyz); triangles += len(indices) // 3
            bounds.append({'min': xyz.min(0).tolist(), 'max': xyz.max(0).tolist()})
    for image in doc.get('images', []):
        view = doc['bufferViews'][image['bufferView']]; begin = view.get('byteOffset', 0)
        with Image.open(io.BytesIO(binary[begin:begin + view['byteLength']])) as texture:
            texture.verify()
    return {'path': path.name, 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data),
            'vertices': vertices, 'triangles': triangles, 'boundsMetres': bounds,
            'embeddedTextures': len(doc.get('images', [])), 'checks': 'GLB lengths, bounds, finite positions/UVs, unit normals, valid triangle indices and actual decoded embedded images passed.'}


parser=argparse.ArgumentParser()
parser.add_argument('--style-version',choices=['makehuman-visible-lips-v2'])
args=parser.parse_args()
suffix='-visible-lips' if args.style_version else ''
summary = []
for name, entries in runs.items():
    key='makehuman:makehuman-metre-z-up-v2'+(':'+args.style_version if args.style_version else '')
    job = entries[key]['jobId']; client = imports['cases'][name]['clientId']
    directory = runtime / 'processing' / client / job
    prior = runtime / 'processing' / client / entries['blender-mpfb']['jobId']
    result = json.loads((directory / 'result.json').read_text())
    assert result['candidate'] == 'makehuman' and result['fit']['basisVersion']=='makehuman-metre-z-up-v2'
    assert result['targetBasisCheck']['passed'] and result['targetBasisCheck']['maximumErrorMetres']<=.00001
    assert all('blender' not in str(stage['command']).lower() for stage in result['resources'])
    fit = result['fit']; prior_fit = json.loads((prior / 'fit.json').read_text())
    source_hashes = {record['view']: record['sourceSha256'] for record in fit['views']}
    assert source_hashes == {record['view']: record['sourceSha256'] for record in prior_fit['views']}
    assert len(source_hashes) == 6 and any(fit['targets'].values())
    files = [directory / 'head.glb', *sorted((directory / 'hair').glob('*.glb')), *sorted((directory / 'beard').glob('*.glb'))]
    assert len(files) == 17
    checks = [inspect_glb(file) for file in files]
    if args.style_version:
        attachment=json.loads((directory/'makehuman-style-attachment.json').read_text())
        assert attachment['version']==args.style_version==result['nativeShape']['styleAttachment']['version']
        assert len(attachment['nativeLipVertices'])==2 and len(set(attachment['nativeLipVertices']))==2
        with np.load(directory/'basis.npz') as basis:
            mapping=basis['mapping'][attachment['lipBasisVertices']]
        assert mapping[:,0].tolist()==mapping[:,1].tolist()==attachment['nativeLipVertices']
        for beard in checks[-5:]:
            for bounds in beard['boundsMetres']:
                assert bounds['max'][1]<attachment['mouthHeightMetres']+.030,'Beard must remain below upper visible lip coverage, not on nose'
                assert bounds['min'][1]>attachment['mouthHeightMetres']-.060,'Beard must remain attached to actual lower face'
        assert result['fit']['basisVersion']=='makehuman-metre-z-up-v2'
    for view in source_hashes:
        with Image.open(directory / 'fitted-renders' / (view + '.png')) as image:
            assert image.size == (768, 896); image.verify()
    summary.append({'fictionalCase': name, 'jobId': job, 'sharedInputSha256': source_hashes,
                    'sameSixPhotosAsMPFB': True, 'noBlenderProcessInCommands': True,
                    'actualResult': result, 'glbChecks': checks})
    if name == 'alex-ramos':
        rejection_source=directory
        sheet = Image.new('RGB', (1152, 954), '#e2e8ea'); draw = ImageDraw.Draw(sheet)
        draw.text((16, 8), '2026-09-30 | Actual standalone MakeHuman fitted-template renders | synthetic inputs | hidden surfaces inferred', fill='#172d25')
        for index, view in enumerate(['front', 'left-three-quarter', 'right-three-quarter', 'left-profile', 'right-profile', 'back']):
            x, y = (index % 3) * 384, 28 + (index // 3) * 463
            image = Image.open(directory / 'fitted-renders' / (view + '.png')); image.thumbnail((384, 448))
            sheet.paste(image, (x, y)); draw.text((x + 10, y + 446), view, fill='#172d25')
        sheet.save(log / ('makehuman-six-fitted-renders'+suffix+'.png'))
fixture=ROOT/'.scratch/private/native-demos'/('makehuman-basis-rejection-'+str(uuid.uuid4()));fixture.mkdir(mode=0o700)
for name in ['manifest.json','fit.json']:shutil.copyfile(rejection_source/name,fixture/name)
with np.load(rejection_source/'basis.npz') as original:basis={key:original[key].copy() for key in original.files}
i,j,_=basis['mapping'].T;valid=(i>=0)&(i==j)&(basis['xyz'][:,2]>-.18+1e-8);basis['xyz'][int(np.flatnonzero(valid)[0]),0]+=.02
np.savez_compressed(fixture/'basis.npz',**basis)
command=[str(ROOT/'.scratch/private/native-demos/python/bin/python'),str(ROOT/'scripts/native-demos/makehuman.py'),'export',str(fixture)]
with (fixture/'export.log').open('w') as output:rejected=subprocess.run(command,stdout=output,stderr=subprocess.STDOUT,timeout=30)
rejection=json.loads((fixture/'target-basis-check.json').read_text());assert rejected.returncode!=0 and not rejection['passed'] and rejection['maximumErrorMetres']>.019 and not (fixture/'head.glb').exists()
report = {'corruptedBasisRejection':{'injectedOffsetMetres':.02,'nativeCheck':rejection,'exitCode':rejected.returncode,'headPublished':False},'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'scope': 'Actual local MakeHuman head fitting and interchange verification on three fictional cases. No ground-truth geometry or fictional morph settings supplied to the fitter. Landmark agreement is not likeness or observed 3D accuracy.',
          'professionalAssessment': 'pending', 'results': summary}
(log / ('makehuman-output-verification'+suffix+'.json')).write_text(json.dumps(report, indent=2) + '\n')
print('PASS 51 actual GLBs, 18 native rendered pictures, all three shared six-photo hashes, finite interchange geometry, embedded textures and no Blender stage.')
