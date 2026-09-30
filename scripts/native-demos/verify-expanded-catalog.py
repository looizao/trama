#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Decode actual new catalog exports, inspect fitted attachment and retain renders."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import struct
import numpy as np
from PIL import Image, ImageDraw
from flame import read_shared_glb
from geometry import camera, render

ROOT=Path(__file__).resolve().parents[2]
runtime=ROOT/'.scratch/private/runtime';log=ROOT/'.scratch/execution-log/assets'
os.umask(0o077)
p=argparse.ArgumentParser();p.add_argument('candidate',choices=['blender-mpfb','makehuman','flame','open3d','meshlab','cloudcompare']);p.add_argument('--upstream',choices=['blender-mpfb','makehuman','flame'],default='makehuman');a=p.parse_args()
version='trama-surface-styles-v1'
suffix=('-'+a.upstream) if a.candidate in ['open3d','meshlab','cloudcompare'] else ''
filename=(a.candidate+suffix+'-populated-results'+('-makehuman-visible-lips-v2' if a.upstream=='makehuman' else '')+'-'+version+'.json') if suffix else a.candidate+'-populated-'+version+'.json'
jobs=json.loads((log/filename).read_text())['results']
imports=json.loads((runtime/'demo-asset-imports.json').read_text())
expected={kind:{s['id'] for s in json.loads((ROOT/'.scratch/private/catalog-expansion'/(kind+'-catalog.json')).read_text())} for kind in ['hair','beard']}
records=[]
for job in jobs:
    cid=imports['cases'][job['fictionalCase']]['clientId'];directory=runtime/'processing'/cid/job['jobId']
    result=json.loads((directory/'result.json').read_text())
    assert job['status']=='completed' and result['catalog']['version']==version
    cache=directory/'catalog-verification-textures';cache.mkdir(exist_ok=True)
    checks=[]
    for kind in ['hair','beard']:
        assert expected[kind] <= set(result[kind])
        for identifier,path in result[kind].items():
            assert path==kind+'/'+identifier+'.glb'
            file=directory/path;raw=file.read_bytes()
            assert struct.unpack('<4sII',raw[:12])==(b'glTF',2,len(raw))
            size=struct.unpack('<I',raw[12:16])[0];doc=json.loads(raw[20:20+size]);off=20+size
            length=struct.unpack('<I',raw[off:off+4])[0];binary=raw[off+8:off+8+length]
            for mesh in doc['meshes']:
                for primitive in mesh['primitives']:
                    acc=doc['accessors'][primitive['attributes']['NORMAL']];view=doc['bufferViews'][acc['bufferView']]
                    normal=np.frombuffer(binary,dtype='<f4',count=acc['count']*3,offset=view.get('byteOffset',0)+acc.get('byteOffset',0)).reshape(-1,3)
                    assert np.isfinite(normal).all() and np.allclose(np.linalg.norm(normal,axis=1),1,atol=.0001)
            meshes=read_shared_glb(file,cache)
            for mesh in meshes:
                xyz,tri=mesh['xyz'],mesh['tri']
                assert len(xyz) and len(tri) and np.isfinite(xyz).all() and np.abs(xyz).max()<3
                assert tri.min()>=0 and tri.max()<len(xyz)
            checks.append({'kind':kind,'id':identifier,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'vertices':sum(len(m['xyz']) for m in meshes),'triangles':sum(len(m['tri']) for m in meshes)})
    head=read_shared_glb(directory/'head.glb',cache)
    combo=head+read_shared_glb(directory/'hair/trama-quiff-wavy.glb',cache)+read_shared_glb(directory/'beard/trama-short-boxed.glb',cache)
    pictures=[]
    for view,yaw in [('front',0),('three-quarter',45),('profile',90),('back',180)]:
        path=directory/('catalog-verification-'+view+'.png');render(path,combo,camera(yaw,{'focalLength':70,'cameraDistance':1.6,'cameraHeight':.04}))
        with Image.open(path) as im: im.verify()
        pictures.append({'view':view,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
    sheet=Image.new('RGB',(1024,590),'#e2e8ea');draw=ImageDraw.Draw(sheet)
    draw.text((12,12),a.candidate+' / '+job['fictionalCase']+' / actual fitted head and expanded style meshes',fill='#17313d',font_size=18)
    draw.text((12,40),'Synthetic inputs / fitted and inferred geometry / professional acceptance pending',fill='#17313d',font_size=17)
    for index,picture in enumerate(pictures):
        im=Image.open(directory/('catalog-verification-'+picture['view']+'.png'));im.thumbnail((250,490));sheet.paste(im,(index*256,85));draw.text((index*256+10,560),picture['view'],fill='#17313d',font_size=17)
    evidence=a.candidate+suffix+'-catalog-'+job['fictionalCase']+'.png';sheet.save(log/evidence)
    records.append({'fictionalCase':job['fictionalCase'],'jobId':job['jobId'],'catalog':result['catalog'],'nativeElapsedMs':result['elapsedMs'],'retainedBytesAtProcessing':result['retainedBytes'],'decodedStyleMeshes':checks,'actualRepresentativeRenders':pictures,'picture':evidence,'fitInputScope':'Same authorized six labeled synthetic photos; geometry fitted or inferred, not measured.'})
    print('ACTUAL_CATALOG_COMPATIBILITY',a.candidate,job['fictionalCase'],len(checks),'decoded native style GLBs and four native views',flush=True)
evidence={'date':datetime.now(timezone.utc).isoformat(),'candidate':a.candidate,'upstream':a.upstream if suffix else None,'version':version,'checks':'Actual GLB headers, finite positions, bounded metre scale, unit normals, indexed triangles, all 40 new hair and 20 new beard IDs plus preserved legacy assets. Four actual render angles per case. Browser persistence and professional clipping review remain separate checks.','results':records}
(log/(a.candidate+suffix+'-expanded-catalog-verification.json')).write_text(json.dumps(evidence,indent=2)+'\n')
