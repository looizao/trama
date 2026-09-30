#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Fit a retained native target basis to image-plane landmarks, using no depth."""
import argparse, json, hashlib, time, os, sys
from pathlib import Path
interfaces=[line.split(':',1)[0].strip() for line in Path('/proc/self/net/dev').read_text().splitlines() if ':' in line]
if any(interface!='lo' for interface in interfaces):
    os.execvp('unshare',['unshare','--user','--map-root-user','--net','--',sys.executable,str(Path(__file__).resolve()),*sys.argv[1:]])
import numpy as np
import mediapipe as mp
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[2]
parser=argparse.ArgumentParser();parser.add_argument('directory',type=Path);args=parser.parse_args();d=args.directory
manifest=json.loads((d/'manifest.json').read_text());prior='Standalone MakeHuman' if manifest.get('candidate')=='makehuman' else 'MPFB';basis=np.load(d/'basis.npz');cameras=json.loads((d/'cameras.json').read_text())
model=ROOT/'.scratch/private/models/mediapipe/face_landmarker.task'
indices=[1,4,6,33,133,263,362,61,291,13,14,152,234,454,93,323,172,397,105,334]
observations=[];points=[];observed=[];neutral_semantic=[];view_groups=[]
xyz,tri=basis['xyz'],basis['tri'];vertices=xyz[tri];e1=vertices[:,1]-vertices[:,0];e2=vertices[:,2]-vertices[:,0]
def project(points,matrix):
    p=np.column_stack([points,np.ones(len(points))])@matrix.T
    return np.column_stack([(p[:,0]/p[:,3]+1)/2,(1-p[:,1]/p[:,3])/2])
def correspondence(point,matrix):
    inv=np.linalg.inv(matrix);xy=np.array([point[0]*2-1,1-point[1]*2])
    near=inv@np.array([*xy,-1,1]);near=near[:3]/near[3]
    far=inv@np.array([*xy,1,1]);far=far[:3]/far[3];ray=(far-near);ray/=np.linalg.norm(ray)
    h=np.cross(ray,e2);det=np.einsum('ij,ij->i',e1,h);good=np.abs(det)>1e-8
    f=np.where(good,1/np.where(good,det,1),0);s=near-vertices[:,0]
    u=f*np.einsum('ij,ij->i',s,h);q=np.cross(s,e1);v=f*(q@ray);t=f*np.einsum('ij,ij->i',e2,q)
    good &= (u>=0)&(v>=0)&(u+v<=1)&(t>0)
    hits=np.flatnonzero(good)
    if not len(hits):return None
    face=tri[hits[np.argmin(t[hits])]]
    projected=project(xyz[face],matrix);return int(face[np.argmin(np.linalg.norm(projected-point,axis=1))])
landmarker=mp.tasks.vision.FaceLandmarker.create_from_model_path(str(model))
for item in manifest['inputs']:
    view=item['view'];path=d/item['path'];target=landmarker.detect(mp.Image.create_from_file(str(path)))
    neutral=landmarker.detect(mp.Image.create_from_file(str(d/'neutral-renders'/(view+'.png'))))
    record={'view':view,'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'targetFaces':len(target.face_landmarks),'neutralFaces':len(neutral.face_landmarks),'matchedLandmarks':0,'depthUsed':False}
    overlay=Image.open(path).convert('RGB');draw=ImageDraw.Draw(overlay)
    if len(target.face_landmarks)==1 and len(neutral.face_landmarks)==1:
        matrix=np.array(cameras[view]);group=[]
        for i in indices:
            n=neutral.face_landmarks[0][i];vtx=correspondence(np.array([n.x,n.y]),matrix)
            if vtx is None:continue
            t=target.face_landmarks[0][i];group.append(len(points));points.append(vtx);observed.append([t.x,t.y]);neutral_semantic.append([n.x,n.y]);view_groups.append(matrix)
            x,y=t.x*overlay.width,t.y*overlay.height;draw.ellipse((x-3,y-3,x+3,y+3),fill='#37edab');draw.text((x+3,y),str(i),fill='white')
        record['matchedLandmarks']=len(group)
    else:record['limitation']='No unique paired face detection. Back or profile coverage cannot be inferred from missing facial landmarks.'
    overlay.save(d/(view+'-landmarks.png'));observations.append(record)
landmarker.close()
(d/'observations.json').write_text(json.dumps(observations,indent=2))
if len(points)<16 or sum(x['matchedLandmarks']>=8 for x in observations)<2:
    raise SystemExit('Insufficient paired landmarks in two views. Retained images and detection evidence; fitting failed honestly.')
points=np.array(points);observed=np.array(observed);matrices=np.array(view_groups);deltas=basis['deltas'][:,points];base=xyz[points]
# The neutral ray mapping has a finite vertex discretization offset. Preserve it
# rather than fitting mesh vertices to different semantic points on the model.
neutral_projected=np.stack([project(base[i:i+1],m)[0] for i,m in enumerate(matrices)])
semantic_offset=np.array(neutral_semantic)-neutral_projected
# Bounded nonlinear coordinate descent; no synthetic client profile is read.
n=len(basis['params']);weights=np.zeros(n);trace=[];evaluations=0
regularization=.00008

def projected(w):
    coords=base.copy()
    for i,value in enumerate(w):coords+=deltas[2*i+(1 if value>=0 else 0)]*abs(value)
    if 'frameHeights' in basis:
        heights=basis['frameHeights'].copy()
        for i,value in enumerate(w):heights+=basis['frameDeltas'][2*i+(1 if value>=0 else 0)]*abs(value)
        coords[:,2]-=(heights.max()-basis['frameHeights'].max())*basis['frameMask'][points]
    p=np.einsum('ijk,ik->ij',matrices,np.column_stack([coords,np.ones(len(coords))]))
    return np.column_stack([(p[:,0]/p[:,3]+1)/2,(1-p[:,1]/p[:,3])/2])
# Remove only per-view framing translations. Focal length and yaw remain the
# explicitly declared camera assumptions, not recovered calibration.
view_names=[]
for record in observations:view_names += [record['view']]*record['matchedLandmarks']
view_names=np.array(view_names)
def residual(w):
    pred=projected(w)+semantic_offset;r=pred-observed
    for view in set(view_names):
        mask=view_names==view;r[mask]-=np.clip(np.mean(r[mask],axis=0),-.06,.06)
    return r

def loss(w):
    global evaluations;evaluations+=1
    r=residual(w);return float(np.mean(np.minimum(r*r,.03**2))+regularization*np.mean(w*w))
started=time.monotonic();initial=loss(weights);best=initial
rounds=int(manifest['settings'].get('fitRounds',4));steps=[.4,.2,.1,.05,.025,.0125][:rounds]
for iteration,step in enumerate(steps):
    accepted=0
    for i in range(n):
        chosen=weights.copy()
        for offset in [-step,step]:
            trial=weights.copy();trial[i]=np.clip(trial[i]+offset,-.8,.8);score=loss(trial)
            if score<best:best=score;chosen=trial;accepted+=1
        weights=chosen
    trace.append({'iteration':iteration+1,'step':step,'loss':best,'acceptedChanges':accepted});print('FIT_ITERATION',json.dumps(trace[-1]),flush=True)
targets={}
for i,w in enumerate(weights):
    if abs(w)>1e-8:targets[str(basis['names'][2*i+(1 if w>=0 else 0)])]=float(abs(w))
result={'targets':targets,'signedParameters':dict(zip(basis['params'].tolist(),weights.tolist())),'initialLoss':initial,'finalLoss':best,'iterations':trace,'evaluations':evaluations,'seconds':time.monotonic()-started,'pairedLandmarks':len(points),'views':observations,'lossDefinition':'Capped image-plane squared error after per-view framing translation, plus bounded target regularization. Neutral mesh correspondence offsets are held fixed. This is not 3D surface error or likeness.', 'framingTranslations':{view:np.clip(np.mean((projected(weights)+semantic_offset-observed)[view_names==view],axis=0),-.06,.06).tolist() for view in set(view_names)},'meanLandmarkErrorPixels':float(np.mean(np.linalg.norm(residual(weights)*np.array([768,896]),axis=1))),'geometry':prior+' prior fitted to detected 2D photo landmarks. Entire surface is fitted or inferred, not measured 3D geometry. Hidden scalp, back and occluded face retain that prior.','limitations':['Photo landmark detector was trained primarily on front-facing real camera images; synthetic detection is not real-person accuracy evidence.','No unique facial landmarks on the back; hairstyle obscures scalp and silhouette.','Camera yaw, focal length, distance and height are assumptions supplied with this experiment.','Only framing translation is removed per view; landmark correspondence and shape prior can limit likeness.','No texture likeness or inferred demographic labels. Professional likeness review pending.']}
result['basisVersion']=str(basis['basisVersion']) if 'basisVersion' in basis else 'unversioned'
(d/'fit.json').write_text(json.dumps(result,indent=2)+'\n')
print('FIT_COMPLETE',json.dumps({k:result[k] for k in ['pairedLandmarks','meanLandmarkErrorPixels','evaluations','seconds']}),flush=True)
