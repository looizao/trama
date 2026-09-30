#!/usr/bin/env python3
"""Check retained real candidate work without recreating erased demo material."""
import argparse
import hashlib
import io
import json
from pathlib import Path
import struct
from datetime import datetime, timezone
from PIL import Image
from local_demo_http import LocalDemoAPI

parser=argparse.ArgumentParser()
parser.add_argument('candidate',choices=['blender-mpfb','makehuman','flame','open3d','meshlab','cloudcompare'])
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
checkpoints=root/'.scratch/private/runtime/full-journey-checkpoints.json'
if not checkpoints.is_file():parser.error('Complete the real browser workflow first. This verifier never populates or restores deleted work.')
checkpoint=json.loads(checkpoints.read_text()).get(args.candidate,{})
if not all(k in checkpoint for k in ['alexRun','alexAlternative','alexProposal','alexConsultation']):
    parser.error('Missing retained browser run, alternative, proposal or synthetic consultation.')
api=LocalDemoAPI();check=api.expect
base='/clients/a0b730e5-490f-488d-ae16-4f3812ee044f'
options=check(200,api.request(base+'/demo-options'),'retained explored options')
alternative=next(o for o in options if o['id']==checkpoint['alexAlternative'])
proposal=next(o for o in options if o['id']==checkpoint['alexProposal'])
state=proposal['state']
assert state['candidate']==args.candidate and state['modelRunId']==checkpoint['alexRun']
assert proposal['parentId']==alternative['id'] and proposal['revision']==alternative['revision']+1
assert alternative['state']['hairId']=='keep-current' and alternative['state']['beardId']=='clean-shaven'
assert state['hairId'] not in ['keep-current','none'] and state['beardId'] not in ['keep-current','clean-shaven']
assert state['refinement']['version']=='style-mesh-v2' and len(state['refinement']['strokes'])>=1
jobs=check(200,api.request(base+'/demo-jobs'),'actual retained native job')
job=next(j for j in jobs if j['id']==checkpoint['alexRun'])
assert job['status']=='completed' and job['candidate']==args.candidate
assert job['kind']==('fit' if args.candidate in ['blender-mpfb','makehuman','flame'] else 'process')
required={'front','left-three-quarter','right-three-quarter','left-profile','right-profile','back'}
assert required<=set(state['photoViews'])
artifactbase=base+'/demo-jobs/'+job['id']+'/artifacts/'
retained=[]
for kind,asset in [('head','model'),('hair',state['hairId']),('beard',state['beardId']),('hair',state['currentHairId']),('beard',state['currentBeardId'])]:
    if asset in ['none','clean-shaven']:continue
    path=artifactbase+kind+'/'+asset
    data=check(200,api.request(path),'real native GLB '+kind+'/'+asset)
    magic,version,size=struct.unpack('<4sII',data[:12]);assert magic==b'glTF' and version==2 and size==len(data)
    jsonlength,chunk=struct.unpack('<II',data[12:20]);assert chunk==0x4e4f534a
    model=json.loads(data[20:20+jsonlength]);assert model.get('meshes')
    check(401,api.request(path,anonymous=True),'anonymous native GLB denied')
    retained.append({'kind':kind,'asset':asset,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'meshCount':len(model['meshes'])})
pictures=[]
for option in [alternative,proposal]:
    data=check(200,api.request(option['previewUrl'].removeprefix('/api')),'real retained browser proposal render')
    image=Image.open(io.BytesIO(data));image.load();assert image.format=='JPEG' and image.width==400
    pictures.append({'optionId':option['id'],'pixels':image.size,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
expected=check(200,api.request(base+'/expected-results'),'persisted expected-result journey')
selection=next(s for s in expected if s['consultationId']==checkpoint['alexConsultation'])
assert selection['optionId']==proposal['id'] and selection['version']>=1
assert selection['history'][0]['agreementMethod']=='synthetic-demonstration'
check(401,api.request(base+'/expected-results',anonymous=True),'anonymous expected-result journey denied')
workspace=check(200,api.request(base+'/demo-workspace'),'persisted independent workspace')
assert workspace['state']['modelRunId']==state['modelRunId'] and workspace['state']['refinement']==state['refinement']
check(409,api.request(base+'/demo-workspace',{'version':max(0,workspace['version']-1),'state':state},'PUT'),'stale workspace cannot overwrite saved work')
check(400,api.request(base+'/demo-refinements',{'state':state,'request':'shorter hair; invent an exact future haircut'}),'unsupported mixed request is atomic')
assert api.request(base+'/demo-workspace')[1]==workspace
check(404,api.request(artifactbase+'hair/unknown-style'),'unlisted native style denied')
if job['kind']=='fit':
    check(400,api.request(base+'/demo-jobs',{'candidate':args.candidate,'kind':'fit','photoSetId':state['photoSetId'],'photoViews':{'front':state['photoViews']['front']},'minimumWidth':512,'native':{'focalLength':0,'cameraDistance':1.6,'cameraHeight':.04,'fitRounds':4}}),'invalid focal length rejected before processing')
evidence={'date':datetime.now(timezone.utc).isoformat(),'candidate':args.candidate,'scope':'Actual retained six-photo native processing, separate current/proposed meshes, written and direct browser edits, immutable alternative/revision pictures, simulated expected result and persistence. Synthetic inputs do not establish real likeness or actual haircut outcomes. Professional assessment and final route selection pending.','runId':job['id'],'nativeKind':job['kind'],'geometry':job['result'].get('geometry'),'settings':job['settings'],'nativeSeconds':job['result']['elapsedMs']/1000,'nativeOutputBytes':job['result']['retainedBytes'],'artifactsChecked':retained,'browserPictures':pictures,'options':[{'id':o['id'],'parentId':o['parentId'],'revision':o['revision'],'hair':o['state']['hairId'],'beard':o['state']['beardId']} for o in [alternative,proposal]],'refinement':state['refinement'],'consultationId':selection['consultationId'],'selectionVersion':selection['version'],'syntheticAgreement':True,'workspaceVersion':workspace['version'],'failureChecks':['anonymous native assets and expected history denied','unlisted style denied','stale workspace rejected','unsupported mixed refinement rejected atomically'],'privacyEvidence':'Live source erasure, withdrawal, cancellation and transitive component erasure are separately retained in tasks 01, 06, 07b, 12a, 13a, 14a and 17.'}
path=root/'.scratch/execution-log/assets'/f'{args.candidate}-journey-verification.json'
path.write_text(json.dumps(evidence,indent=2)+'\n')
print('PASS actual saved candidate journey, native GLBs, browser renders, simulated expected result, persistence and failure checks.')
