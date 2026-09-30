#!/usr/bin/env python3
"""Verify real private projected GLBs, exact geometry/normals and input atlases."""
import hashlib
import io
import json
from pathlib import Path
import struct
import numpy as np
from PIL import Image

root=Path(__file__).resolve().parents[2];runtime=root/'.scratch/private/runtime'
imports=json.loads((runtime/'demo-asset-imports.json').read_text());runs=json.loads((runtime/'native-demo-imports.json').read_text())

def glb(path):
    data=path.read_bytes();magic,version,size=struct.unpack_from('<III',data)
    assert magic==0x46546c67 and version==2 and size==len(data)
    n=struct.unpack_from('<I',data,12)[0];doc=json.loads(data[20:20+n]);binary=data[28+n:]
    def accessor(i):
        a=doc['accessors'][i];v=doc['bufferViews'][a['bufferView']];assert 'byteStride' not in v
        count={'VEC2':2,'VEC3':3,'SCALAR':1}[a['type']]
        value=np.frombuffer(binary,dtype={5125:'<u4',5126:'<f4'}[a['componentType']],count=a['count']*count,offset=v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(-1,count)
        assert np.isfinite(value).all();return value
    meshes=[]
    for m in doc['meshes']:
        for p in m['primitives']:
            a={name:accessor(i) for name,i in p['attributes'].items()};a['indices']=accessor(p['indices']).reshape(-1,3)
            assert a['indices'].max()<len(a['POSITION']);assert np.allclose(np.linalg.norm(a['NORMAL'],axis=1),1,atol=.0001)
            meshes.append(a)
    return doc,meshes,binary

results=[]
for case,entries in runs.items():
    job=entries['flame:flame-2023-open-neutral-rig-v4:six-photo-projection-v2']['jobId'];directory=runtime/'processing'/imports['cases'][case]['clientId']/job
    report=json.loads((directory/'photo-texture-report.json').read_text());manifest=json.loads((directory/'manifest.json').read_text());fit=json.loads((directory/'fit.json').read_text())
    assert report['version']=='six-photo-projection-v2' and report['smoothNativeNormalsPreserved']
    original,neutral,_=glb(directory/'head.glb');textured,appearance,binary=glb(directory/'photo-texture/head.glb')
    assert len(neutral)==len(appearance) and textured['asset']['extras']==original['asset']['extras']
    assert np.array_equal(appearance[0]['POSITION'],neutral[0]['POSITION'][neutral[0]['indices']].reshape(-1,3))
    assert np.array_equal(appearance[0]['NORMAL'],neutral[0]['NORMAL'][neutral[0]['indices']].reshape(-1,3))
    for key in ['POSITION','NORMAL','indices']:
        for a,b in zip(neutral[1:],appearance[1:]):assert np.array_equal(a[key],b[key])
    uv=appearance[0]['TEXCOORD_0'];assert (uv>=0).all() and (uv<=1).all()
    assert report['assignedTriangles']+report['neutralTriangles']==report['totalSkinTriangles']==len(neutral[0]['indices'])
    assert sum(v['assignedTriangles'] for v in report['sourceViews'])==report['assignedTriangles']
    atlaspath=directory/'photo-texture/authorized-photo-atlas.png';atlas=Image.open(atlaspath);atlas.load();assert atlas.size==(3072,1792)
    for index,view in enumerate(report['sourceViews']):
        source=directory/next(i['path'] for i in manifest['inputs'] if i['view']==view['view'])
        assert hashlib.sha256(source.read_bytes()).hexdigest()==view['sourceSha256']==next(v['sourceSha256'] for v in fit['views'] if v['view']==view['view'])
        expected=Image.open(source).convert('RGB').resize((768,896),Image.Resampling.LANCZOS)
        actual=atlas.crop(((index%4)*768,(index//4)*896,(index%4+1)*768,(index//4+1)*896))
        assert np.array_equal(np.asarray(actual),np.asarray(expected))
        image=Image.open(directory/'photo-texture'/(view['view']+'.png'));image.load();assert image.size==(768,896)
    assert len(textured['images'])==1
    v=textured['bufferViews'][textured['images'][0]['bufferView']];embedded=binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]
    assert embedded==atlaspath.read_bytes();Image.open(io.BytesIO(embedded)).verify()
    results.append({'fictionalCase':case,'runId':job,'report':report,'headBytes':(directory/'photo-texture/head.glb').stat().st_size,'nativeTrianglesAndSmoothNormalsExact':True,'nativeEyesUnchanged':True,'actualSixSourceTilesExact':True,'embeddedAtlasExact':True,'modelAttributionExact':True})
out={'scope':'Actual six-source-photo texture evaluation on three fictional FLAME fits. Geometry and smooth normals unchanged; projection coverage is not observed skin, likeness or clean scalp reconstruction. Existing hair/beard, seams and lighting failures remain. Professional acceptance pending.','results':results}
(root/'.scratch/execution-log/assets/flame-photo-texture-verification.json').write_text(json.dumps(out,indent=2)+'\n')
print('PASS all three actual native photo texture GLBs, exact triangles/normals/eyes/attribution, 18 exact source atlas tiles, 18 decoded renders and embedded atlas bytes.')
