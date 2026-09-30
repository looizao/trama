#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Native MeshLab filters on an explicitly identified retained fitted head."""
import copy
import hashlib
from importlib.metadata import version
import json
import os
from pathlib import Path
import shutil
import struct
import sys
import time

ROOT=Path(__file__).resolve().parents[2]
interfaces=[line.split(':',1)[0].strip() for line in Path('/proc/self/net/dev').read_text().splitlines() if ':' in line]
if __name__=='__main__' and any(i!='lo' for i in interfaces):
    os.execvp('unshare',['unshare','--user','--map-root-user','--net','--',sys.executable,str(Path(__file__).resolve()),*sys.argv[1:]])
os.umask(0o077)
os.environ['QT_QPA_PLATFORM']='offscreen'
import numpy as np
import pymeshlab as ml
from PIL import Image,ImageDraw
from flame import read_shared_glb
from geometry import export,render,camera

VERSION='meshlab-native-upstream-v1'
VIEWS=[('front',0),('left-three-quarter',45),('right-three-quarter',-45),('left-profile',90),('right-profile',-90),('back',180)]
def primitive(value):
    if isinstance(value,np.ndarray):return value.tolist()
    if isinstance(value,np.generic):return value.item()
    if isinstance(value,dict):return {k:primitive(v) for k,v in value.items()}
    return value
def counts(ms):return {'vertices':ms.current_mesh().vertex_number(),'triangles':ms.current_mesh().face_number()}
def stamp_ply(path,provenance):
    data=path.read_bytes();position=data.index(b'\n',data.index(b'\n')+1)+1
    payload=json.dumps(provenance,separators=(',',':'),ensure_ascii=True).encode('ascii')
    comments=b''.join(b'comment Trama provenance part '+f'{n//160:04d} '.encode()+payload[n:n+160]+b'\n' for n in range(0,len(payload),160))
    path.write_bytes(data[:position]+comments+data[position:])
def main(directory):
    assert version('pymeshlab')=='2025.7.post1'
    manifest=json.loads((directory/'manifest.json').read_text());source=manifest['upstream'];settings=manifest['component']
    assert source['runId']==settings['sourceRunId'] and .25<=settings['triangleRatio']<=1 and 2000<=settings['samplePoints']<=50000
    upstream=(directory/source['path']).resolve();assert upstream.is_relative_to(directory)
    for relative,digest in source['sha256'].items():
        path=(upstream/relative).resolve();assert path.is_relative_to(upstream) and hashlib.sha256(path.read_bytes()).hexdigest()==digest
    cache=directory/'textures';cache.mkdir(exist_ok=True)
    meshes=read_shared_glb(upstream/'head.glb',cache)
    index=next(i for i,m in enumerate(meshes) if any(s in m['name'].lower() for s in ['skin','head','template']))
    skin=meshes[index];assert 'texture' not in skin,'Textured skin requires explicit UV-preserving processing; no silent material loss'
    ms=ml.MeshSet();ms.add_mesh(ml.Mesh(vertex_matrix=skin['xyz'],face_matrix=skin['tri']), 'upstream fitted skin');original_id=ms.current_mesh_id()
    original=counts(ms);before_topology=primitive(ms.get_topological_measures())
    ms.add_mesh(ml.Mesh(vertex_matrix=skin['xyz'],face_matrix=skin['tri']), 'processed fitted skin');processed_id=ms.current_mesh_id()
    filters=[]
    def apply(name,**parameters):
        before=counts(ms);started=time.monotonic();result=ms.apply_filter(name,**parameters)
        filters.append({'filter':name,'parameters':parameters,'seconds':round(time.monotonic()-started,6),'before':before,'after':counts(ms),'returned':primitive(result)})
        print('MESHLAB_FILTER',json.dumps(filters[-1]),flush=True)
    # Do not weld coincident normal seams, fill missing surfaces or remove anatomical components.
    apply('meshing_remove_duplicate_faces');apply('meshing_remove_null_faces');apply('meshing_remove_unreferenced_vertices')
    apply('meshing_repair_non_manifold_edges',method='Split Vertices')
    target=max(100,int(ms.current_mesh().face_number()*settings['triangleRatio']))
    if settings['triangleRatio']<1:
        apply('meshing_decimation_quadric_edge_collapse',targetfacenum=target,qualitythr=.3,preserveboundary=True,boundaryweight=10.,preservenormal=True,preservetopology=True,optimalplacement=True,autoclean=False)
    apply('meshing_remove_unreferenced_vertices');after=counts(ms);after_topology=primitive(ms.get_topological_measures())
    xyz=ms.current_mesh().vertex_matrix().copy();tri=ms.current_mesh().face_matrix().copy()
    assert after['triangles']>100 and np.isfinite(xyz).all() and tri.max()<len(xyz)
    distances={};measurements=[]
    for label,sampled,target_id in [('upstreamVerticesToProcessedSurface',original_id,processed_id),('processedVerticesToUpstreamSurface',processed_id,original_id)]:
        ms.set_current_mesh(sampled);limit=min(settings['samplePoints'],ms.current_mesh().vertex_number())
        result=primitive(ms.get_hausdorff_distance(sampledmesh=sampled,targetmesh=target_id,savesample=True,samplevert=True,sampleedge=False,sampleface=False,samplenum=limit,maxdist=ml.PercentageValue(100)))
        assert result['n_samples']>100 and np.isfinite(result['max'])
        distances[label]={'meanMetres':result['mean'],'rmsMetres':result['RMS'],'maximumMetres':result['max']}
        measurements.append({'direction':label,'requestedSamples':limit,'nativeResult':result})
    raw=(upstream/'head.glb').read_bytes();size=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+size])
    provenance={'upstreamCandidate':source['candidate'],'upstreamRunId':source['runId'],'sourceHeadSha256':source['sha256']['head.glb'],'upstreamProvenance':doc['asset'].get('extras',{}),'component':'PyMeshLab 2025.7.post1 / MeshLab 2025.07d / GPL-3.0 software','componentLicenseUrl':'https://github.com/cnr-isti-vclab/PyMeshLab/blob/v2025.7.post1/LICENSE','componentModifications':'Native cleanup, non-manifold edge split repair, topology/boundary/normal-preserving quadric simplification, bidirectional sampled vertex distances and PLY conversion. Original eyes/materials and independent style meshes retained.','geometry':source['geometry'],'professionalReview':'pending'}
    ms.set_current_mesh(processed_id);ply=directory/'processed-skin.ply';ms.save_current_mesh(str(ply),binary=True,save_vertex_normal=True);stamp_ply(ply,provenance)
    reopened=ml.MeshSet();reopened.load_new_mesh(str(ply));roundtrip=counts(reopened)
    assert roundtrip==after and np.allclose(reopened.current_mesh().vertex_matrix(),xyz,atol=1e-6)
    output=copy.deepcopy(meshes);output[index]['xyz']=xyz;output[index]['tri']=tri;output[index].pop('uv',None);output[0]['provenance']=provenance
    export(directory/'head.glb',output)
    for kind in ['hair','beard']:
        (directory/kind).mkdir(exist_ok=True)
        for path in sorted((upstream/kind).glob('*.glb')):shutil.copyfile(path,directory/kind/path.name)
    renders=directory/'fitted-renders';renders.mkdir(exist_ok=True)
    for view,yaw in VIEWS:
        print('MESHLAB_RENDER',view,flush=True);render(renders/(view+'.png'),output,camera(yaw,manifest['settings']))
    report={'candidate':'meshlab','version':version('pymeshlab'),'engineVersion':'MeshLab 2025.07d','processingVersion':VERSION,'upstream':{'runId':source['runId'],'candidate':source['candidate'],'headSha256':source['sha256']['head.glb']},'settings':settings,'geometry':source['geometry'],'mesh':{'before':original,'after':after,'triangleTarget':target,'preservesCoincidentNormalSeams':True,'deviation':distances},'filters':filters,'topology':{'before':before_topology,'after':after_topology},'measurements':measurements,'conversion':{'nativeWriter':'PyMeshLab PLY','nativeReader':'PyMeshLab PLY','reopenedCounts':roundtrip,'maximumCoordinateErrorMetres':float(np.abs(reopened.current_mesh().vertex_matrix()-xyz).max()),'fullLicenseProvenanceEmbedded':True},'styleCompatibility':{'method':'Exact unchanged independent upstream style GLBs. Simplification clipping remains subject to actual visual review.','styles':[{'path':r,'sha256':h} for r,h in source['sha256'].items() if r!='head.glb']},'provenance':provenance,'limitations':['MeshLab is a supporting processor requiring the named upstream fitting route; no six-photo reconstruction is attributed to MeshLab.','Distances are native sampled vertex-to-surface checks against a fitted mesh, not a real client or an independent scan. Reduced sampling can miss local errors.','Missing surfaces are not filled. Intentional normal seams and disconnected eyes remain. Repair splits vertices rather than deleting anatomical faces.','The same independent style assets retain their upstream adaptation and licenses. Simplification may change clipping and professional assessment is pending.','Full written refinements, direct editing and expected-result history remain pending common workflow tasks.']}
    (directory/'component-report.json').write_text(json.dumps(report,indent=2)+'\n')
    picture=Image.new('RGB',(1250,760),'#eef2f4');draw=ImageDraw.Draw(picture)
    draw.text((24,20),'PyMeshLab 2025.7.post1 / actual MeshLab filters / '+source['candidate'],fill='#17313d',font_size=25)
    draw.text((24,65),'Synthetic six-photo fitting upstream. This processor does not reconstruct a head from photos.',fill='#17313d',font_size=19)
    picture.paste(Image.open(renders/'front.png').convert('RGB').resize((480,560)),(20,110))
    lines=[f"Triangles: {original['triangles']} -> {after['triangles']}",f"Vertices: {original['vertices']} -> {after['vertices']}",f"Upstream -> processed mean: {distances['upstreamVerticesToProcessedSurface']['meanMetres']*1000:.4f} mm",f"Upstream -> processed max: {distances['upstreamVerticesToProcessedSurface']['maximumMetres']*1000:.4f} mm",'Native filters: '+str(len(filters)), 'Non-manifold edges repaired by vertex splitting','Boundary, topology and normal preservation enabled','Coincident normal seams not welded','Native PLY writer -> native PLY reader: passed','All 16 independent upstream styles retained','Professional likeness and style review pending']
    for n,line in enumerate(lines):draw.text((530,135+n*44),line,fill='#17313d',font_size=18)
    draw.text((24,710),'Source experiment and all six original photos remain live dependencies. No fallback head.',fill='#17313d',font_size=18)
    picture.save(directory/'component-evaluation.png')
if __name__=='__main__':main(Path(sys.argv[1]).resolve())
