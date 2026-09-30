# SPDX-License-Identifier: GPL-3.0-or-later
"""Behavioral GLB interchange checks inside offline Blender, not app flow proof."""
import bpy
import hashlib
import json
import math
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
ASSETS=ROOT/'.scratch/private/demo-assets'
RESULT=ROOT/'.scratch/private/assets-work/interchange-results.json'

def clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

def load(path):
    before=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(path))
    objects=list(set(bpy.data.objects)-before)
    meshes=[o for o in objects if o.type=='MESH']
    assert meshes,('no mesh',path)
    for obj in meshes:
        assert len(obj.data.polygons)>0
        assert all(math.isfinite(c) for v in obj.data.vertices for c in v.co)
        assert all(abs(c)<2 for v in obj.data.vertices for c in v.co),('unexpected units',path)
        assert len(obj.data.materials)>0,('missing materials',path)
    return objects

def fingerprint(objects):
    return hashlib.sha256(json.dumps([[list(v.co) for v in o.data.vertices] for o in objects if o.type=='MESH']).encode()).hexdigest()

entries=[]
for kind in ['hair','beard']:
    for asset in json.loads((ASSETS/(kind+'-catalog.json')).read_text()):
        clear()
        path=ASSETS/asset['glb']
        objects=load(path)
        entries.append({'id':asset['id'],'kind':kind,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
                        'bytes':path.stat().st_size,'meshCount':sum(o.type=='MESH' for o in objects),
                        'import':'passed','finiteGeometryAndMetres':'passed','materials':'passed'})
clear()
head=load(ASSETS/'neutral-head.glb')
hair=load(ASSETS/'hair/short02.glb')
beard=load(ASSETS/'beard/goatee.glb')
original_hair=fingerprint(hair)
for o in beard:bpy.data.objects.remove(o,do_unlink=True)
full=load(ASSETS/'beard/full.glb')
assert fingerprint(hair)==original_hair,'beard selection changed hair'
for o in full:bpy.data.objects.remove(o,do_unlink=True)
assert fingerprint(hair)==original_hair,'clean-shaven changed retained current hair'
beard=load(ASSETS/'beard/goatee.glb')
bpy.context.scene['assetVerificationSelection']=json.dumps({'hair':'short02','beard':'goatee','keepCurrentHair':True})
path=ASSETS/'interchange-selection-check.blend'
bpy.ops.wm.save_as_mainfile(filepath=str(path))
bpy.ops.wm.open_mainfile(filepath=str(path))
selection=json.loads(bpy.context.scene['assetVerificationSelection'])
assert selection=={'hair':'short02','beard':'goatee','keepCurrentHair':True}
assert fingerprint([o for o in bpy.data.objects if o.name.startswith('short02')])==original_hair
meshes=[o for o in bpy.data.objects if o.type=='MESH']
assert len(meshes)==4,[(o.name,o.type) for o in bpy.data.objects]
result={'scope':'Asset-level Blender interoperability. App selection persistence and other candidate routes are not verified by this check.',
        'assets':entries,'independentHairBeard':'passed','keepCurrentHair':'passed','cleanShaven':'passed',
        'saveReopen':'passed','retainedMeshCount':len(meshes),'sourceScene':str(path.relative_to(ROOT))}
RESULT.write_text(json.dumps(result,indent=2)+'\n')
print('INTERCHANGE_VERIFIED',len(entries),flush=True)
