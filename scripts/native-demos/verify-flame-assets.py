#!/usr/bin/env python3
"""Verify actual Open model outputs, same inputs and rejection before publication."""
import argparse
import datetime
import hashlib
import io
import json
import os
from pathlib import Path
import shutil
import struct
import subprocess
import sys
import uuid
import numpy as np
from PIL import Image,ImageDraw
from flame import MODEL_SHA, VERSION
ROOT=Path(__file__).resolve().parents[2]
runtime=ROOT/'.scratch/private/runtime';log=ROOT/'.scratch/execution-log/assets'
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


parser=argparse.ArgumentParser();parser.add_argument('--texture-version',choices=['six-photo-projection-v2']);args=parser.parse_args();suffix='-photo-texture' if args.texture_version else ''
imports=json.loads((runtime/'demo-asset-imports.json').read_text());runs=json.loads((runtime/'native-demo-imports.json').read_text());summary=[]
for name,entries in runs.items():
    job=entries['flame:'+VERSION+(':'+args.texture_version if args.texture_version else '')]['jobId'];client=imports['cases'][name]['clientId'];directory=runtime/'processing'/client/job
    result=json.loads((directory/'result.json').read_text());assert result['candidate']=='flame' and result['fit']['basisVersion']==VERSION
    assert result['targetBasisCheck']['passed'] and result['targetBasisCheck']['maximumErrorMetres']<=.00001
    assert result['nativeShape']['modelSha256']==MODEL_SHA and result['nativeShape']['vertices']==5023 and result['nativeShape']['triangles']==9976
    assert all('blender' not in str(stage['command']).lower() for stage in result['resources'])
    assert result['fit']['pairedLandmarks']>=16 and any(result['fit']['signedParameters'].values())
    old=runtime/'processing'/client/entries['blender-mpfb']['jobId'];prior=json.loads((old/'fit.json').read_text())
    hashes={r['view']:r['sourceSha256'] for r in result['fit']['views']}
    assert hashes=={r['view']:r['sourceSha256'] for r in prior['views']} and len(hashes)==6
    files=[directory/'head.glb',*sorted((directory/'hair').glob('*.glb')),*sorted((directory/'beard').glob('*.glb'))];assert len(files)==17
    checks=[]
    for file in files:
        check=inspect_glb(file);data=file.read_bytes();size=struct.unpack_from('<I',data,12)[0];doc=json.loads(data[20:20+size]);attribution=doc['asset']['extras']
        assert attribution['model']=='FLAME 2023 Open' and attribution['citation'].endswith('10.1145/3130800.3130813') and 'licenseUrl' in attribution and attribution['modifications']
        check['embeddedAttribution']=attribution;checks.append(check)
    for view in hashes:
        with Image.open(directory/'fitted-renders'/(view+'.png')) as image:assert image.size==(768,896);image.verify()
    summary.append({'fictionalCase':name,'jobId':job,'sharedInputSha256':hashes,'sameSixPhotosAsMPFB':True,'actualResult':result,'glbChecks':checks})
    if name=='alex-ramos':
        rejection_source=directory;sheet=Image.new('RGB',(1152,970),'#e2e8ea');draw=ImageDraw.Draw(sheet)
        draw.text((10,4),'2026-09-30 | FLAME 2023 Open | actual fitted template renders | synthetic input | hidden surfaces inferred',fill='#172d25')
        draw.text((10,19),'Max Planck / Li, Bolkart, Black, Li & Romero (2017), DOI 10.1145/3130800.3130813 | CC-BY-4.0 + model terms',fill='#172d25')
        for i,view in enumerate(['front','left-three-quarter','right-three-quarter','left-profile','right-profile','back']):
            x,y=(i%3)*384,40+(i//3)*463;image=Image.open(directory/'fitted-renders'/(view+'.png'));image.thumbnail((384,448));sheet.paste(image,(x,y));draw.text((x+10,y+446),view,fill='#172d25')
        sheet.save(log/('flame-six-fitted-renders'+suffix+'.png'))
fixture=ROOT/'.scratch/private/native-demos'/('flame-basis-rejection-'+str(uuid.uuid4()));fixture.mkdir(mode=0o700)
for name in ['manifest.json','fit.json']:shutil.copyfile(rejection_source/name,fixture/name)
with np.load(rejection_source/'basis.npz') as original:basis={key:original[key].copy() for key in original.files}
basis['xyz'][0,0]+=.02;np.savez_compressed(fixture/'basis.npz',**basis)
with (fixture/'export.log').open('w') as output:rejected=subprocess.run([sys.executable,str(ROOT/'scripts/native-demos/flame.py'),'export',str(fixture)],stdout=output,stderr=subprocess.STDOUT,timeout=30)
rejection=json.loads((fixture/'target-basis-check.json').read_text());assert rejected.returncode!=0 and not rejection['passed'] and rejection['maximumErrorMetres']>.019 and not (fixture/'head.glb').exists()
report={'date':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Actual accepted FLAME 2023 Open identity fitting on three fictional cases. No fictional case morph parameters or ground-truth geometry supplied. Neutral rig/expression, first 20 identity components, same six photo inputs. Likeness and professional review remain pending.','corruptedBasisRejection':{'nativeCheck':rejection,'exitCode':rejected.returncode,'headPublished':False},'results':summary}
(log/('flame-output-verification'+suffix+'.json')).write_text(json.dumps(report,indent=2)+'\n');print('PASS actual 51 GLBs, full embedded attribution, 18 renders, same six source hashes, native shape checks and 20 mm corruption rejection.')
