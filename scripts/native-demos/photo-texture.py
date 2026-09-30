#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Evaluate actual six-photo projection on fitted geometry, without skin invention."""
import hashlib
import json
import time
import numpy as np
from PIL import Image
from geometry import export, render, normals


def evaluate(directory, meshes, matrices, manifest, fit, smooth=True):
    started=time.monotonic()
    output=directory/'photo-texture';output.mkdir(exist_ok=True)
    width,height=768,896
    atlas=Image.new('RGB',(width*4,height*2),(184,155,136))
    skin=meshes[0];xyz,tri=skin['xyz'],skin['tri'];faces=xyz[tri]
    centers=faces.mean(1)
    normal=np.cross(faces[:,1]-faces[:,0],faces[:,2]-faces[:,0]);normal/=np.maximum(np.linalg.norm(normal,axis=1,keepdims=True),1e-12)
    best=np.zeros(len(tri));chosen=np.full(len(tri),-1)
    projections=[];records=[]
    inputs={i['view']:i for i in manifest['inputs']}
    for index,(view,matrix) in enumerate(matrices.items()):
        source=directory/inputs[view]['path']
        image=Image.open(source).convert('RGB').resize((width,height),Image.Resampling.LANCZOS)
        atlas.paste(image,((index%4)*width,(index//4)*height))
        matrix=np.asarray(matrix)
        depth=render(output/(view+'-neutral-depth.png'),meshes,matrix)
        p=np.column_stack([xyz,np.ones(len(xyz))])@matrix.T
        screen=np.column_stack([(p[:,0]/p[:,3]+1)*width/2,(1-p[:,1]/p[:,3])*height/2])
        center=np.column_stack([centers,np.ones(len(centers))])@matrix.T
        pixels=np.column_stack([(center[:,0]/center[:,3]+1)*width/2,(1-center[:,1]/center[:,3])*height/2])
        integer=np.floor(pixels).astype(int)
        inside=(integer[:,0]>=0)&(integer[:,0]<width)&(integer[:,1]>=0)&(integer[:,1]<height)&(center[:,3]>0)
        clipped=np.clip(integer,[0,0],[width-1,height-1])
        # Native geometry occlusion only. Photo hair/beard occlusion cannot be
        # resolved by template depth and is explicitly retained as a limitation.
        visible=inside&(np.abs(center[:,2]/center[:,3]-depth[clipped[:,1],clipped[:,0]])<.0002)
        # Camera position is the null space of the projection's x, y and homogeneous-w rows.
        _,_,vh=np.linalg.svd(matrix[[0,1,3]]);camera=vh[-1,:3]/vh[-1,3]
        toward=camera-centers;toward/=np.maximum(np.linalg.norm(toward,axis=1,keepdims=True),1e-12)
        score=np.maximum(np.einsum('ij,ij->i',normal,toward),0)
        translation=np.asarray(fit.get('framingTranslations',{}).get(view,[0,0]))*[width,height]
        shifted=screen-translation
        in_frame=((shifted[tri]>=0)&(shifted[tri]<[width,height])).all(axis=(1,2))
        take=visible&in_frame&(score>.20)&(score>best)
        best[take]=score[take];chosen[take]=index
        projections.append(shifted)
        records.append({'view':view,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'nativeVisibleCandidateTriangles':int((visible&in_frame&(score>.20)).sum()),'framingTranslationPixels':(-translation).tolist(),'framingLandmarksAvailable':view in fit.get('framingTranslations',{})})
    texture=output/'authorized-photo-atlas.png';atlas.save(texture)
    # Independent triangle UV islands preserve native vertex positions exactly.
    # Uncovered surfaces use an explicitly neutral atlas patch, never an image
    # generation fill or a claim of observed skin beneath the existing hair.
    uv=np.full((len(tri),3,2),[(3.5*width)/(width*4),(1.5*height)/(height*2)])
    for index,screen in enumerate(projections):
        mask=chosen==index
        uv[mask]=(screen[tri[mask]]+[(index%4)*width,(index//4)*height])/[width*4,height*2]
        records[index]['assignedTriangles']=int(mask.sum())
    textured=dict(skin,xyz=faces.reshape(-1,3),tri=np.arange(len(tri)*3).reshape(-1,3),uv=uv.reshape(-1,2),texture=str(texture))
    if smooth:textured['normals']=normals(xyz,tri)[tri].reshape(-1,3)
    export(output/'head.glb',[textured,*meshes[1:]])
    for view,matrix in matrices.items():render(output/(view+'.png'),[textured,*meshes[1:]],np.asarray(matrix))
    report={'version':'six-photo-projection-v2' if smooth else 'six-photo-projection-v1','geometry':'Same fitted or inferred FLAME triangles; source photograph colors do not establish observed geometry.','method':'Per-triangle best facing view, native-template depth visibility, retained landmark framing translations, independent UV islands and actual six-image atlas. Uncovered triangles retain a neutral patch.','assignedTriangles':int((chosen>=0).sum()),'neutralTriangles':int((chosen<0).sum()),'totalSkinTriangles':len(tri),'atlasPixels':list(atlas.size),'smoothNativeNormalsPreserved':smooth,'sourceViews':records,'textureLicense':'No FLAME texture model, weights or third-party texture pack. Only this client authorized source images; dependent private derivative, erased with any source. Model attribution and original image provenance remain applicable.','limitations':['Native head depth cannot remove original photo hair, beard, shadows or background colors. This diagnostic may bake existing styles into skin and is unsuitable as a clean hairstyle-change base.','Per-triangle view changes can produce seams; source lighting is retained and rendered lighting can double shade it.','Camera assumptions and fitted landmark framing are approximate. Missing profile/back facial landmarks limit alignment; colors on inferred hidden anatomy are not observed skin.','Neutral material remains the default editable proposal head. This separate experiment evaluates failure modes, not a successful reconstruction of bald scalp or bare jaw.'],'seconds':round(time.monotonic()-started,3)}
    (directory/'photo-texture-report.json').write_text(json.dumps(report,indent=2)+'\n')
    return report
