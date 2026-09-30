# SPDX-License-Identifier: GPL-3.0-or-later
"""MPFB neutral basis, bounded target application and fitted asset exports."""
import sys, json, math, gzip, importlib.util
from pathlib import Path
import bpy
import numpy as np
from mathutils import Vector, kdtree
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('trama_assets',ROOT/'scripts/demo-assets/blender-assets.py')
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
args=sys.argv[sys.argv.index('--')+1:]
phase,directory=args[0],Path(args[1]);directory.mkdir(parents=True,exist_ok=True)
settings=json.loads((directory/'manifest.json').read_text())['settings']
scene,camera=a.setup_studio();scene.cycles.samples=8
scene.render.resolution_x=768;scene.render.resolution_y=896
PARAMS=['head/head-scale-horiz','head/head-scale-vert','head/head-scale-depth',
'nose/nose-scale-horiz','nose/nose-scale-vert','nose/nose-scale-depth',
'chin/chin-width','chin/chin-height','chin/chin-prominent',
'mouth/mouth-scale-horiz','mouth/mouth-scale-vert','mouth/mouth-scale-depth']
# Only actual MPFB targets are used. Paired signed weights remain in [-0.8,0.8].
PARAMS=[p for p in PARAMS if all((a.PRIVATE/'tools/mpfb2/src/mpfb/data/targets'/f'{p}-{sign}.target.gz').exists() for sign in ['incr','decr'])]
fit=json.loads((directory/'fit.json').read_text()) if phase=='export' else {'targets':{}}
head,eyes,human,origin_z,markers=a.create_head(neutral=True,fit_targets=fit['targets'])
views=[('front',0),('left-three-quarter',45),('right-three-quarter',-45),('left-profile',90),('right-profile',-90),('back',180)]
matrices={};render_dir=directory/('neutral-renders' if phase=='prepare' else 'fitted-renders');render_dir.mkdir(exist_ok=True)
for view,deg in views:
    angle=math.radians(deg);radius=settings.get('cameraDistance',1.6)
    camera.data.lens=settings.get('focalLength',70)
    camera.location=(radius*math.sin(angle),-radius*math.cos(angle),settings.get('cameraHeight',.04));a.aim(camera,(0,0,.025))
    bpy.context.view_layer.update()
    projection=camera.calc_matrix_camera(bpy.context.evaluated_depsgraph_get(),x=768,y=896,scale_x=1,scale_y=1)
    matrices[view]=np.array(projection@camera.matrix_world.inverted()).tolist()
    scene.render.filepath=str(render_dir/(view+'.png'));bpy.ops.render.render(write_still=True)
(directory/'cameras.json').write_text(json.dumps(matrices))
if phase=='prepare':
    mask=human.modifiers.get('Hide helpers');mask.show_viewport=False;bpy.context.view_layer.update()
    full=human.evaluated_get(bpy.context.evaluated_depsgraph_get()).data
    tree=kdtree.KDTree(len(full.vertices))
    for v in full.vertices:tree.insert(v.co,v.index)
    tree.balance()
    xyz=np.array([list(v.co) for v in head.data.vertices]);mapping=[]
    for v in head.data.vertices:
        _,idx,distance=tree.find(v.co+Vector((0,0,origin_z)));mapping.append(idx if distance<1e-5 else -1)
    head.data.calc_loop_triangles();tri=np.array([list(t.vertices) for t in head.data.loop_triangles])
    deltas=[];names=[]
    for p in PARAMS:
        for sign in ['decr','incr']:
            name=f'{p}-{sign}.target.gz';values=np.zeros((len(full.vertices),3))
            with gzip.open(a.PRIVATE/'tools/mpfb2/src/mpfb/data/targets'/name,'rt') as f:
                for line in f:
                    if line.strip() and not line.startswith('#'):
                        row=line.split();values[int(row[0])]=[float(x) for x in row[1:4]]
            # Core targets use decimetres, Y up, face +Z. MPFB's actual target
            # loader rotates X,Y,Z to X,-Z,Y and applies scale_factor=0.1.
            # The optimizer must predict that same native deformation.
            converted=values[:,[0,2,1]]*np.array([.1,-.1,.1])
            crown=mapping[int(np.argmax(xyz[:,2]))]
            if crown<0:raise RuntimeError('Native crown correspondence is required')
            delta=np.array([converted[i] if i>=0 else np.zeros(3) for i in mapping])
            delta[np.array(mapping)>=0,2]-=converted[crown,2]
            deltas.append(delta);names.append(name)
    np.savez_compressed(directory/'basis.npz',xyz=xyz,tri=tri,deltas=np.array(deltas),names=np.array(names),params=np.array(PARAMS),mapping=np.array(mapping),basisVersion=np.array('mpfb-metre-z-up-v2'))
    a.export([head,eyes],directory/'neutral.glb')
else:
    # Compare the optimizer's predicted vertices with native MPFB application,
    # rather than asserting correctness from duplicated conversion arithmetic.
    basis=np.load(directory/'basis.npz')
    predicted=basis['xyz'].copy()
    for name,value in fit['targets'].items():
        index=np.flatnonzero(basis['names']==name)
        if len(index)!=1:raise RuntimeError('Unknown fitted native target')
        predicted+=basis['deltas'][index[0]]*value
    mask=human.modifiers.get('Hide helpers');mask.show_viewport=False;bpy.context.view_layer.update()
    applied=human.evaluated_get(bpy.context.evaluated_depsgraph_get()).data
    mapping=basis['mapping'];valid=mapping>=0
    actual=np.array([list(applied.vertices[i].co) for i in mapping[valid]])-np.array([0,0,origin_z])
    error=np.linalg.norm(predicted[valid]-actual,axis=1)
    check={'basisVersion':str(basis['basisVersion']),'mappedVertices':int(valid.sum()),'maximumErrorMetres':float(error.max()),'meanErrorMetres':float(error.mean()),'toleranceMetres':.00001,'passed':bool(error.max()<=.00001),'measurement':'Optimization-basis prediction compared against actual MPFB-evaluated target application and actual crown recentering. Artificial neck cap vertices are excluded.'}
    (directory/'target-basis-check.json').write_text(json.dumps(check,indent=2)+'\n')
    if not check['passed']:raise RuntimeError('Native applied geometry differs from fitting basis')
    mask.show_viewport=True;bpy.context.view_layer.update()
    a.export([head,eyes],directory/'head.glb')
    human.hide_viewport=True
    (directory/'hair').mkdir(exist_ok=True);(directory/'beard').mkdir(exist_ok=True)
    hair=json.loads((a.OUT/'hair-catalog.json').read_text())
    for style in hair:
        identifier=style['id']
        if identifier=='rounded-coils':obj=a.create_coils(head)
        else:
            source=a.HumanService.add_mhclo_asset(a.AssetService.find_asset_absolute_path(identifier+'.mhclo',asset_subdir='hair'),human,asset_type='Hair',material_type='GAMEENGINE',subdiv_levels=1)
            obj=a.bake_asset(source,identifier,origin_z)
        a.export([obj],directory/'hair'/(identifier+'.glb'));bpy.data.objects.remove(obj,do_unlink=True)
    for identifier,length in {'stubble':.0017,'full':.012,'goatee':.009,'moustache':.007,'chinstrap':.006}.items():
        obj=a.create_beard(head,markers,identifier,length);a.export([obj],directory/'beard'/(identifier+'.glb'));bpy.data.objects.remove(obj,do_unlink=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(directory/'fitted-head.blend'))
    print('NATIVE_EXPORT_COMPLETE',json.dumps({'headVertices':len(head.data.vertices),'hair':len(hair),'beard':5}),flush=True)
