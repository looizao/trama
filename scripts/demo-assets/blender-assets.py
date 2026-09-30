# SPDX-License-Identifier: GPL-3.0-or-later
# Blender/MPFB API integration. Generated core mesh derivatives retain CC0-1.0.
"""Create repeatable fictional portraits and interchange assets locally."""
import addon_utils
import bmesh
import bpy
import importlib
import json
import hashlib
import math
import random
from pathlib import Path
import sys
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / '.scratch/private'
OUT = PRIVATE/'demo-assets'
OUT.mkdir(parents=True,exist_ok=True)
repo = PRIVATE/'blender-resources/extensions/trama'
repo.mkdir(parents=True,exist_ok=True)
link = repo/'mpfb'
if not link.exists():
    link.symlink_to(PRIVATE/'tools/mpfb2/src/mpfb',target_is_directory=True)
bpy.ops.preferences.extension_repo_add(name='Trama Local',use_custom_directory=True,
                                      custom_directory=str(repo),type='LOCAL')
r = next(r for r in bpy.context.preferences.extensions.repos if r.directory==str(repo))
module = 'bl_ext.'+r.module+'.mpfb'
addon_utils.enable(module,default_set=True)
HumanService = importlib.import_module(module+'.services.humanservice').HumanService
TargetService = importlib.import_module(module+'.services.targetservice').TargetService
LocationService = importlib.import_module(module+'.services.locationservice').LocationService
AssetService = importlib.import_module(module+'.services.assetservice').AssetService
prefs = bpy.context.preferences.addons[module].preferences
prefs.mpfb_second_root = str(PRIVATE/'source-assets/makehuman-system')
LocationService.update_second_root()


def material(name,color,roughness=.5):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color,1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color,1)
    p.inputs['Roughness'].default_value = roughness
    return m


def aim(obj,at):
    obj.rotation_euler = (Vector(at)-obj.location).to_track_quat('-Z','Y').to_euler()


def setup_studio():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 32
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 768
    scene.render.resolution_y = 896
    scene.render.resolution_percentage = 100
    scene.world.color = (.18,.18,.18)
    scene.view_settings.view_transform = 'AgX'
    for name,location,power,size in [('Key',(-.7,-.9,1.2),100,1),('Fill',(.9,-.5,.4),55,1.2),('Rim',(0,.6,.8),95,.8)]:
        bpy.ops.object.light_add(type='AREA',location=location)
        lamp = bpy.context.object
        lamp.name = name
        lamp.data.energy = power
        lamp.data.shape = 'DISK'
        lamp.data.size = size
        aim(lamp,(0,0,0))
    bpy.ops.object.camera_add(location=(0,-1.6,.06))
    camera = bpy.context.object
    camera.data.lens = 70
    aim(camera,(0,0,0))
    scene.camera = camera
    return scene,camera


def create_head(profile=None, *, neutral=False, fit_targets=None):
    macro = TargetService.get_default_macro_info_dict()
    if not neutral:
        macro.update(gender=1.0,age=.32,weight=.47,muscle=.55)
    if profile:
        macro.update(profile['macro'])
    h = HumanService.create_human(macro_detail_dict=macro)
    if profile:
        for target,value in profile['targets'].items():
            TargetService.load_target(h,str(PRIVATE/'tools/mpfb2/src/mpfb/data/targets'/target),weight=value)
        skin_path=AssetService.find_asset_absolute_path(profile['skin']+'.mhmat',asset_subdir='skins')
        HumanService.set_character_skin(skin_path,h,skin_type='GAMEENGINE')
    for target,value in (fit_targets or {}).items():
        TargetService.load_target(h,str(PRIVATE/'tools/mpfb2/src/mpfb/data/targets'/target),weight=value)
    helper_groups = json.loads((PRIVATE/'tools/mpfb2/src/mpfb/data/mesh_metadata/basemesh_vertex_groups.json').read_text())
    mask = h.modifiers.get('Hide helpers')
    mask.show_viewport = False
    bpy.context.view_layer.update()
    full = h.evaluated_get(bpy.context.evaluated_depsgraph_get()).data
    markers = {}
    for name in ['joint-mouth','joint-jaw','joint-l-eye','joint-neck']:
        indices = helper_groups[name]
        indices = [i for pair in indices for i in range(pair[0],pair[1]+1)] if indices and isinstance(indices[0],list) else indices
        markers[name] = sum((full.vertices[i].co for i in indices),Vector())/len(indices)
    lip_indices = importlib.import_module(module+'.entities.socketobject').BASEMESH_EXTRA_GROUPS['lips']
    lip_points = [full.vertices[i].co for i in lip_indices]
    markers['lips'] = sum(lip_points,Vector())/len(lip_points)
    mask.show_viewport = True
    bpy.context.view_layer.update()
    eyes_path = AssetService.find_asset_absolute_path('low-poly.mhclo', asset_subdir='eyes')
    eyes = HumanService.add_mhclo_asset(eyes_path,h,asset_type='Eyes',material_type='GAMEENGINE',subdiv_levels=1)
    # Evaluate the visible body mask and macro shape before trimming below the neck.
    deps = bpy.context.evaluated_depsgraph_get()
    mesh = bpy.data.meshes.new_from_object(h.evaluated_get(deps),depsgraph=deps)
    head = bpy.data.objects.new('Fictional neutral head',mesh)
    bpy.context.collection.objects.link(head)
    top = max(v.co.z for v in mesh.vertices)
    bm = bmesh.new()
    bm.from_mesh(mesh)
    cut = top-.36
    result = bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),
                                  plane_co=(0,0,cut),plane_no=(0,0,1),clear_inner=True)
    boundary = [e for e in result['geom_cut'] if isinstance(e,bmesh.types.BMEdge) and e.is_boundary]
    if boundary:
        bmesh.ops.holes_fill(bm,edges=boundary,sides=0)
    # Common interchange coordinates: metres, Z up, forward -Y, crown +0.18 m.
    origin_z = top-.18
    for marker in markers.values():
        marker.z -= origin_z
    print('MARKERS', {name:list(v) for name,v in markers.items()},flush=True)
    for v in bm.verts:
        v.co.z -= origin_z
    bm.to_mesh(mesh)
    bm.free()
    eyes_mesh = bpy.data.meshes.new_from_object(eyes.evaluated_get(deps),depsgraph=deps)
    eyes_copy = bpy.data.objects.new('Eyes',eyes_mesh)
    bpy.context.collection.objects.link(eyes_copy)
    for v in eyes_mesh.vertices:
        v.co.z -= origin_z
    bpy.data.objects.remove(eyes,do_unlink=True)
    h.hide_render = True
    if not profile:
        skin = material('Neutral mannequin clay',(.48,.31,.22),.55)
        head.data.materials.clear()
        head.data.materials.append(skin)
    for p in head.data.polygons:
        p.use_smooth = True
    return head,eyes_copy,h,origin_z,markers


def export(objects,path):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True)


def bake_asset(source,name,origin_z):
    deps = bpy.context.evaluated_depsgraph_get()
    mesh = bpy.data.meshes.new_from_object(source.evaluated_get(deps),depsgraph=deps)
    obj = bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(obj)
    for vertex in mesh.vertices:
        vertex.co.z -= origin_z
    bpy.data.objects.remove(source,do_unlink=True)
    return obj


def create_coils(head):
    rng=random.Random(419)
    vertices,faces=[],[]
    for poly in head.data.polygons:
        x,y,z=poly.center
        minimum=.105 if y<-.055 else (.062 if abs(x)>.065 else .04)
        if z<minimum or poly.normal.z<-.25:
            continue
        pv=[head.data.vertices[i].co for i in poly.vertices]
        triangles=[(pv[0],pv[i],pv[i+1]) for i in range(1,len(pv)-1)]
        areas=[(b-a).cross(c-a).length/2 for a,b,c in triangles]
        for _ in range(max(1,round(poly.area*65000))):
            ta,tb,tc=rng.choices(triangles,weights=areas,k=1)[0]
            a,b=rng.random(),rng.random()
            if a+b>1:a,b=1-a,1-b
            point=ta*(1-a-b)+tb*a+tc*b
            normal=poly.normal.normalized()
            tangent=normal.cross(Vector((0,1,0)))
            if tangent.length<.1:tangent=normal.cross(Vector((1,0,0)))
            tangent.normalize()
            cross=normal.cross(tangent).normalized()
            phase=rng.uniform(0,2*math.pi)
            length=rng.uniform(.032,.050)
            curl_radius=rng.uniform(.002,.004)
            base=len(vertices)
            for step in range(15):
                u=step/14
                angle=phase+u*math.pi*6
                center=point+normal*(.002+length*u)+curl_radius*(tangent*math.cos(angle)+cross*math.sin(angle))
                for q in range(4):
                    ring=q*math.pi/2
                    vertices.append(center+.00065*(tangent*math.cos(ring)+cross*math.sin(ring)))
                if step:
                    for q in range(4):
                        prev=base+(step-1)*4
                        now=base+step*4
                        faces.append((prev+q,prev+(q+1)%4,now+(q+1)%4,now+q))
    mesh=bpy.data.meshes.new('Rounded coils')
    mesh.from_pydata(vertices,[],faces)
    mesh.update()
    obj=bpy.data.objects.new('rounded-coils',mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material('Deep brown coils',(.028,.014,.009),.8))
    for p in mesh.polygons:p.use_smooth=True
    return obj


def hair_catalog(human,origin_z,scene,camera,head):
    definitions = [
        ('short01','Short swept layers','short','straight','low'),
        ('short02','Short textured crop','short','straight','low'),
        ('short03','Short parted curtains','short','straight','moderate'),
        ('short04','Slicked back crop','short','straight','moderate'),
        ('bob01','Asymmetric bob','medium','straight','moderate'),
        ('bob02','Chin length fringe bob','medium','straight','moderate'),
        ('long01','Long loose lengths','long','straight','high'),
        ('braid01','Long braid','long','straight','moderate'),
        ('ponytail01','Tied ponytail','long','straight','moderate'),
        ('afro01','Close coily crop','short','coily','low'),
    ]
    source_meta = json.loads((PRIVATE/'source-assets/makehuman-system/packs/makehuman_system_assets.json').read_text())
    entries = []
    directory = OUT/'hair'
    directory.mkdir(exist_ok=True)
    for name,label,length,texture,maintenance in definitions:
        metadata = source_meta[name]
        if metadata['license'] != 'CC0':
            raise RuntimeError(f'Unapproved asset license: {name}')
        path = AssetService.find_asset_absolute_path(name+'.mhclo',asset_subdir='hair')
        source = HumanService.add_mhclo_asset(path,human,asset_type='Hair',material_type='GAMEENGINE',subdiv_levels=1)
        obj = bake_asset(source,name,origin_z)
        glb = directory/(name+'.glb')
        export([obj],glb)
        # Same mannequin, studio, camera and resolution for all catalog tiles.
        camera.location = (.65,-1.5,.1)
        aim(camera,(0,0,.015))
        scene.render.filepath = str(directory/(name+'.png'))
        bpy.ops.render.render(write_still=True)
        entries.append({'id':name,'kind':'hair','label':label,'length':length,'texture':texture,
                        'maintenance':maintenance,'creator':metadata['author'],'license':'CC0-1.0',
                        'sourceUrl':'https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html',
                        'sourceFile':str(Path(path).relative_to(PRIVATE)),
                        'sourceSha256':hashlib.sha256(Path(path).read_bytes()).hexdigest(),
                        'modifications':['MPFB fitting to shared mannequin','Evaluated subdivision','Normalized metre coordinates','Exported GLB'],
                        'glb':str(glb.relative_to(OUT)),'render':'hair/'+name+'.png',
                        'vertices':len(obj.data.vertices),'polygons':len(obj.data.polygons),
                        'bytes':glb.stat().st_size,'professionalAcceptance':'pending',
                        'compatibility':{'BlenderExport':'passed','browserLoad':'pending','candidateRoutes':'pending'}})
        bpy.data.objects.remove(obj,do_unlink=True)
        print('CATALOG',name,glb.stat().st_size,flush=True)
    obj=create_coils(head)
    glb=directory/'rounded-coils.glb'
    export([obj],glb)
    scene.render.filepath=str(directory/'rounded-coils.png')
    bpy.ops.render.render(write_still=True)
    entries.append({'id':'rounded-coils','kind':'hair','label':'Rounded natural coils','length':'medium','texture':'coily',
                    'maintenance':'moderate','creator':'Trama procedural asset generator','license':'CC0-1.0',
                    'sourceUrl':'local:scripts/demo-assets/blender-assets.py','sourceDependency':'CC0 MakeHuman scalp topology',
                    'modifications':['Deterministic solid helical strand generation'],
                    'glb':'hair/rounded-coils.glb','render':'hair/rounded-coils.png',
                    'vertices':len(obj.data.vertices),'polygons':len(obj.data.polygons),'bytes':glb.stat().st_size,
                    'professionalAcceptance':'pending','compatibility':{'BlenderExport':'passed','browserLoad':'pending','candidateRoutes':'pending'}})
    bpy.data.objects.remove(obj,do_unlink=True)
    (OUT/'hair-catalog.json').write_text(json.dumps(entries,indent=2)+'\n')


def create_beard(head,markers,kind,length):
    """Sample visible lower-face surface into reusable solid strand geometry."""
    mouth_z = markers['lips'].z
    rng = random.Random(7301)
    vertices,faces = [],[]
    def covered(point,normal):
        x,y,z=point
        relative_z=z-mouth_z
        upper=.025-abs(x)*.30
        if not (-.038<relative_z<upper and y<-.015 and normal.y<.25):return False
        if abs(x)<.029 and -.012<relative_z<.006:return False
        if kind=='moustache' and not (abs(x)<.033 and .004<relative_z<.016):return False
        if kind=='goatee' and not (abs(x)<.033 and (relative_z<-.012 or relative_z>.006)):return False
        if kind=='chinstrap' and not (relative_z<-.025 and abs(x)>.013):return False
        return True
    for poly in head.data.polygons:
        # Front lower face, excluding lips and neck. The source topology itself
        # provides the surface, rather than an ellipsoid masking the jaw.
        pv = [head.data.vertices[i].co for i in poly.vertices]
        if len(pv)<3:
            continue
        if not any(covered(v,poly.normal) for v in [poly.center,*pv]):continue
        triangles=[(pv[0],pv[i],pv[i+1]) for i in range(1,len(pv)-1)]
        areas=[(b-a).cross(c-a).length/2 for a,b,c in triangles]
        count = max(1,round(poly.area*3000000))
        for _ in range(count):
            ta,tb,tc=rng.choices(triangles,weights=areas,k=1)[0]
            a,b = rng.random(),rng.random()
            if a+b>1:
                a,b = 1-a,1-b
            point = ta*(1-a-b)+tb*a+tc*b
            if not covered(point,poly.normal):continue
            n = poly.normal.normalized()
            tangent = n.cross(Vector((0,0,1)))
            if tangent.length<.01:
                tangent = n.cross(Vector((0,1,0)))
            tangent.normalize()
            cross = n.cross(tangent).normalized()
            radius = .00016 if length<.004 else .00025
            start = point+n*.0002
            end = start+n*(length*rng.uniform(.75,1.15))+Vector((0,0,-length*.45))
            base = len(vertices)
            for q in range(3):
                angle = 2*math.pi*q/3
                vertices.append(start+radius*(tangent*math.cos(angle)+cross*math.sin(angle)))
            vertices.append(end)
            faces.extend([(base,base+1,base+3),(base+1,base+2,base+3),(base+2,base,base+3)])
    if not faces:
        raise RuntimeError('Beard surface filter produced no geometry')
    mesh = bpy.data.meshes.new(kind)
    mesh.from_pydata(vertices,[],faces)
    mesh.update()
    obj = bpy.data.objects.new(kind,mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material('Dark chestnut beard',(.045,.025,.015),.85))
    return obj


def beard_catalog(head,markers,scene,camera):
    entries = []
    directory = OUT/'beard'
    directory.mkdir(exist_ok=True)
    for kind,label,length in [('stubble','Even short stubble',.0017),('full','Short full beard',.012),
                              ('goatee','Connected goatee',.009),('moustache','Natural moustache',.007),
                              ('chinstrap','Defined chinstrap',.006)]:
        obj = create_beard(head,markers,kind,length)
        path = directory/(kind+'.glb')
        export([obj],path)
        camera.location=(.65,-1.5,.1)
        aim(camera,(0,0,.015))
        scene.render.filepath=str(directory/(kind+'.png'))
        bpy.ops.render.render(write_still=True)
        entries.append({'id':kind,'kind':'beard','label':label,'lengthMm':length*1000,
                        'texture':'straight','maintenance':'moderate','creator':'Trama procedural asset generator',
                        'license':'CC0-1.0','sourceUrl':'local:scripts/demo-assets/blender-assets.py',
                        'sourceDependency':'CC0 MakeHuman/MPFB visible lower-face topology',
                        'modifications':['Deterministic face-surface strand generation'],
                        'glb':'beard/'+kind+'.glb','render':'beard/'+kind+'.png',
                        'vertices':len(obj.data.vertices),'polygons':len(obj.data.polygons),'bytes':path.stat().st_size,
                        'professionalAcceptance':'pending','compatibility':{'BlenderExport':'passed','browserLoad':'pending','candidateRoutes':'pending'}})
        bpy.data.objects.remove(obj,do_unlink=True)
    (OUT/'beard-catalog.json').write_text(json.dumps(entries,indent=2)+'\n')


def fictional_cases():
    views=[('front',0,.04),('left-three-quarter',45,.04),('right-three-quarter',-45,.04),
           ('left-profile',90,.04),('right-profile',-90,.04),('back',180,.04),
           ('crown',0,1.25),('under-chin',0,-.8)]
    profiles=json.loads((ROOT/'scripts/demo-assets/cases.json').read_text())
    for profile in profiles:
        scene,camera=setup_studio()
        head,eyes,human,origin_z,markers=create_head(profile)
        directory=OUT/'clients'/profile['id']
        directory.mkdir(parents=True,exist_ok=True)
        export([head,eyes],directory/'ground-truth-synthetic-head.glb')
        for role,styles in [('baseline',profile['current']),('expected',profile['proposal']),('simulated-follow-up',profile['proposal'])]:
            accessories=[]
            if styles['hair']=='rounded-coils':
                accessories.append(create_coils(head))
            else:
                source=HumanService.add_mhclo_asset(AssetService.find_asset_absolute_path(styles['hair']+'.mhclo',asset_subdir='hair'),
                                                    human,asset_type='Hair',material_type='GAMEENGINE',subdiv_levels=1)
                accessories.append(bake_asset(source,styles['hair'],origin_z))
            if styles['beard']!='clean-shaven':
                lengths={'stubble':.0017,'full':.012,'goatee':.009,'moustache':.007,'chinstrap':.006}
                accessories.append(create_beard(head,markers,styles['beard'],lengths[styles['beard']]))
            role_directory=directory/role
            role_directory.mkdir(exist_ok=True)
            export([head,eyes,*accessories],role_directory/'scene.glb')
            for view,degrees,height in views:
                angle=math.radians(degrees)
                camera.location=(1.6*math.sin(angle),-1.6*math.cos(angle),height)
                aim(camera,(0,0,.025))
                scene.render.filepath=str(role_directory/(view+'.png'))
                bpy.ops.render.render(write_still=True)
            for obj in accessories:
                bpy.data.objects.remove(obj,do_unlink=True)
        profile['inputNotice']='Synthetic 3D-rendered fictional identity, not a photograph of a real person.'
        profile['followUpNotice']='Simulated rendered follow-up, not an actual haircut outcome.'
        profile['geometryNotice']='Ground-truth synthetic geometry is retained for diagnostics only. It must not be fed into reconstruction candidates or used as evidence of real-person accuracy.'
        (directory/'case.json').write_text(json.dumps(profile,indent=2)+'\n')
        print('FICTIONAL_CASE',profile['id'],flush=True)


def main():
    if '--clients-only' in sys.argv:
        fictional_cases()
    else:
        scene,camera = setup_studio()
        head,eyes,human,origin_z,markers = create_head()
        export([head,eyes],OUT/'neutral-head.glb')
        scene.render.filepath = str(OUT/'neutral-head-front.png')
        bpy.ops.render.render(write_still=True)
        bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'neutral-head.blend'))
        if '--beard-only' not in sys.argv:
            hair_catalog(human,origin_z,scene,camera,head)
        beard_catalog(head,markers,scene,camera)
        print(json.dumps({'phase':'neutral mannequin intermediate','vertices':len(head.data.vertices),
                          'polygons':len(head.data.polygons),'synthetic':True,
                          'limitations':['Browser and cross-route compatibility pending']}))


if __name__ == '__main__':
    main()
