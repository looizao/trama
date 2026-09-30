#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Validate and publish original staged assets without replacing retained assets."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import struct
import sys
import numpy as np
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'scripts/native-demos'))
from flame import read_shared_glb
os.umask(0o077)
staging=ROOT/'.scratch/private/catalog-expansion'
destination=ROOT/'.scratch/private/demo-assets'
report=json.loads((ROOT/'.scratch/execution-log/assets/catalog-expansion-creation.json').read_text())
assert report['hairCount']==40 and report['beardCount']==20 and not report['representativeOnly']
checked=[]
for kind in ['hair','beard']:
    styles=json.loads((staging/(kind+'-catalog.json')).read_text())
    for style in styles:
        assert style['license']=='CC0-1.0' and style['recipe']['version']=='trama-surface-styles-v1'
        path=staging/style['glb'];raw=path.read_bytes()
        assert struct.unpack('<4sII',raw[:12])==(b'glTF',2,len(raw))
        assert hashlib.sha256(raw).hexdigest()==style['sha256']
        meshes=read_shared_glb(path,staging/'textures')
        assert sum(len(m['xyz']) for m in meshes)==style['vertices'] and sum(len(m['tri']) for m in meshes)==style['triangles']
        for mesh in meshes:
            assert len(mesh['xyz']) and len(mesh['tri']) and np.isfinite(mesh['xyz']).all()
            assert mesh['tri'].min()>=0 and mesh['tri'].max()<len(mesh['xyz'])
        for view in style['views']:
            picture=staging/view['render']
            assert hashlib.sha256(picture.read_bytes()).hexdigest()==view['sha256']
            with Image.open(picture) as im: im.verify()
        checked.append(style)
    catalog=destination/(kind+'-catalog.json')
    existing=json.loads(catalog.read_text())
    ids={s['id']:s for s in existing}
    for style in styles:
        if style['id'] in ids:
            assert ids[style['id']].get('sha256')==style['sha256'],'Published geometry is immutable; create a new version instead'
        for relative in [style['glb'],style['render'],*[v['render'] for v in style['views']]]:
            target=destination/relative;target.parent.mkdir(parents=True,exist_ok=True)
            data=(staging/relative).read_bytes()
            if target.exists(): assert target.read_bytes()==data,'Refusing to overwrite an earlier retained asset'
            else:
                tmp=target.with_suffix(target.suffix+'.tmp');tmp.write_bytes(data);tmp.replace(target)
        if style['id'] not in ids: existing.append(style)
    for style in existing:
        if not style.get('recipe'): style['deprecated']=True
    tmp=catalog.with_suffix('.tmp');tmp.write_text(json.dumps(existing,indent=2)+'\n');tmp.replace(catalog)
for start in range(0,len(checked),8):
    items=checked[start:start+8]
    sheet=Image.new('RGB',(1024,60+len(items)*230),'#e2e8ea');draw=ImageDraw.Draw(sheet)
    draw.text((12,12),'Actual original 3D mannequin renders / professional acceptance pending',fill='#17313d',font_size=18)
    for row,style in enumerate(items):
        draw.text((12,65+row*230),style['label']+' / '+str(style['lengthMm'])+'mm / '+style['coverage'],fill='#17313d',font_size=17)
        for col,view in enumerate(style['views']):
            im=Image.open(staging/view['render']);im.thumbnail((210,200));sheet.paste(im,(12+col*250,90+row*230))
    sheet.save(ROOT/'.scratch/execution-log/assets'/f'catalog-mannequin-set-{start//8+1:02}.png')
evidence={'version':report['version'],'date':report['date'],'checks':'60 actual GLB containers, decoded finite geometry and valid topology, exact recorded mesh counts and SHA256; 240 real decoded four-angle renders. Original catalog files preserved; legacy entries retained for saved histories.',
          'hairCount':40,'beardCount':20,'originalHairCount':11,'originalBeardCount':5,'nativeCompatibility':'pending','browserReopen':'pending','professionalAcceptance':'pending',
          'assets':[{k:s[k] for k in ['id','kind','vertices','triangles','sha256','bytes','license','creator','recipe']} for s in checked]}
(ROOT/'.scratch/execution-log/assets/catalog-publication-verification.json').write_text(json.dumps(evidence,indent=2)+'\n')
print('VALIDATED_AND_PUBLISHED',len(checked),'real style meshes; 240 mannequin renders; historical geometry preserved')
