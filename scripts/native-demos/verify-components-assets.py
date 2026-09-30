#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Validate actual retained component meshes and unchanged upstream dependencies."""
import datetime,hashlib,io,json,struct
from pathlib import Path
import numpy as np
import open3d as o3d
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[2]
log=ROOT/'.scratch/execution-log/assets';runtime=ROOT/'.scratch/private/runtime'
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
        dtype = {5121:'u1',5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']]
        begin = view.get('byteOffset', 0) + a.get('byteOffset', 0)
        end = begin + a['count'] * components * np.dtype(dtype).itemsize
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

imports=json.loads((runtime/'demo-asset-imports.json').read_text());results=[]
sheet=Image.new('RGB',(1152,1040),'#e2e8ea');draw=ImageDraw.Draw(sheet)
draw.text((15,10),'Open3D CPU 0.20.0 | actual processing of three fitted upstream routes | synthetic inputs',fill='#17313d',font_size=22)
draw.text((15,42),'25% triangle reduction. Upper: upstream / lower: processed. Same local CPU renderer. No observed scan.',fill='#17313d',font_size=17)
from flame import read_shared_glb
from geometry import render,camera
for column,parent in enumerate(['blender-mpfb','makehuman','flame']):
 report=json.loads((log/f'open3d-{parent}-populated-results.json').read_text())
 for case in report['results']:
  client=imports['cases'][case['fictionalCase']]['clientId'];directory=runtime/'processing'/client/case['jobId']
  manifest=json.loads((directory/'manifest.json').read_text());component=json.loads((directory/'component-report.json').read_text())
  assert component['processingVersion']=='open3d-cpu-upstream-v5'
  assert component['alignment']['actualIterations']==len(component['alignment']['iterations'])>0
  assert len(manifest['inputs'])==6 and component['upstream']['candidate']==parent
  parent_dir=runtime/'processing'/client/component['upstream']['runId'];parent_manifest=json.loads((parent_dir/'manifest.json').read_text())
  current={i['view']:hashlib.sha256((directory/i['path']).read_bytes()).hexdigest() for i in manifest['inputs']}
  original={i['view']:hashlib.sha256((parent_dir/i['path']).read_bytes()).hexdigest() for i in parent_manifest['inputs']}
  assert current==original and len(current)==6
  files=[directory/'head.glb',*sorted((directory/'hair').glob('*.glb')),*sorted((directory/'beard').glob('*.glb'))];assert len(files)==17
  checks=[]
  for file in files:
   check=inspect_glb(file);rel=str(file.relative_to(directory))
   if rel!='head.glb':assert check['sha256']==manifest['upstream']['sha256'][rel]
   else:
    raw=file.read_bytes();size=struct.unpack_from('<I',raw,12)[0];extras=json.loads(raw[20:20+size])['asset']['extras']
    assert extras['upstreamRunId']==component['upstream']['runId'] and extras['sourceHeadSha256']==manifest['upstream']['sha256']['head.glb']
    if parent=='flame':assert extras['upstreamProvenance']['model']=='FLAME 2023 Open' and extras['upstreamProvenance']['licenseUrl']
    check['embeddedProvenance']=extras
   checks.append(check)
  for view in current:
   with Image.open(directory/'fitted-renders'/(view+'.png')) as image:assert image.size==(768,896);image.verify()
  assert component['mesh']['after']['triangles']<=component['mesh']['before']['triangles']
  assert component['mesh']['deviation']['upstreamVerticesToProcessedSurface']['maximumMetres']<.001
  assert component['alignment']['fitness']>.99 and component['alignment']['recoveredPointMaximumErrorMetres']<.00001
  for name in ['upstream-sampled.ply','processed-points.ply','processed-skin.ply']:
   header=(directory/name).read_bytes().split(b'end_header\n',1)[0]
   notices=[line.split(b' ',5)[5] for line in header.splitlines() if line.startswith(b'comment Trama provenance part ')]
   assert all(len(line)<256 for line in header.splitlines())
   assert json.loads(b''.join(notices))==component['provenance']
   if name=='processed-skin.ply':assert len(o3d.io.read_triangle_mesh(str(directory/name)).triangles)==component['mesh']['after']['triangles']
   else:assert len(o3d.io.read_point_cloud(str(directory/name)).points)>0
  results.append({'fictionalCase':case['fictionalCase'],'upstream':parent,'jobId':case['jobId'],'sameSixOriginalInputSha256':current,'allSixSameAsParent':True,'stylesExactlySameAsParent':True,'actualNativeComponent':component,'glbChecks':checks})
  if case['fictionalCase']=='alex-ramos':
   cache=directory/'verification-textures';cache.mkdir(exist_ok=True)
   raw_head=read_shared_glb(directory/'upstream/head.glb',cache)
   before=directory/'verification-upstream-front.png';render(before,raw_head,camera(0,manifest['settings']))
   for row,path in enumerate([before,directory/'fitted-renders/front.png']):
    image=Image.open(path);image.thumbnail((384,448));sheet.paste(image,(column*384,88+row*472))
    draw.text((column*384+10,88+row*472),parent+(' / upstream' if row==0 else ' / Open3D processed'),fill='#17313d',font_size=16)
sheet.save(log/'open3d-three-upstream-comparison.png')
report={'date':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Actual 153 GLB files and 54 native renders from nine supporting-component jobs. Three original fitted routes use the same six authorized synthetic images and independent shared style assets. No scan, denser capture, real-person reconstruction accuracy or professional acceptance claimed.','results':results}
(log/'open3d-output-verification.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS 153 actual GLBs, 54 renders, 27 actual PLY exports, native ICP iteration counts, nine same-six-photo snapshots, unchanged independent styles and retained provenance.')
