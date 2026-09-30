#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Real local supporting-component flow and transitive cancellation verification."""
import hashlib
import argparse
import json
from pathlib import Path
import sys
import time
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'scripts'))
from local_demo_http import LocalDemoAPI
p=argparse.ArgumentParser();p.add_argument('--candidate',choices=['open3d','meshlab'],default='open3d');candidate=p.parse_args().candidate
api=LocalDemoAPI();check=api.expect
cid='a0b730e5-490f-488d-ae16-4f3812ee044f';base='/clients/'+cid
summary=json.loads((ROOT/f'.scratch/execution-log/assets/{candidate}-makehuman-populated-results.json').read_text())
job_id=summary['results'][0]['jobId'];job=next(j for j in check(200,api.request(base+'/demo-jobs'),'retained actual processing') if j['id']==job_id)
assert job['status']=='completed' and job['kind']=='process'
paths=['head/model','evaluation/geometry','diagnostic/component','geometry/processed-skin']+(['geometry/sampled-cloud','geometry/filtered-cloud'] if candidate=='open3d' else [])+[kind+'/'+x for kind in ['hair','beard'] for x in job['result'][kind]]
loaded=0
for path in paths:
 artifact=check(200,api.request(base+'/demo-jobs/'+job_id+'/artifacts/'+path),'actual artifact '+path);loaded+=len(artifact)
 if path.startswith('geometry/'):
  assert artifact.startswith(b'ply\n') and b'comment Trama provenance ' in artifact.split(b'end_header\n',1)[0]
check(401,api.request(base+'/demo-jobs/'+job_id+'/artifacts/head/model',anonymous=True),'anonymous native head denied')
check(404,api.request(base+'/demo-jobs/'+job_id+'/artifacts/diagnostic/upstream/head.glb'),'private upstream path denied')
previous=check(200,api.request(base+'/demo-workspace'),'previous workspace');option=next(o for o in check(200,api.request(base+'/demo-options'),'persisted options') if o['state']['modelRunId']==job_id)
saved=check(200,api.request(base+'/demo-workspace',{'state':option['state'],'version':previous['version']},'PUT'),'save processed state')
assert check(200,api.request(base+'/demo-workspace'),'reopen processed state')['state']==saved['state']
if previous['state']:check(200,api.request(base+'/demo-workspace',{'state':previous['state'],'version':saved['version']},'PUT'),'restore previous technical workspace')
fixture=check(201,api.request('/clients',{'name':'Disposable synthetic '+candidate+' privacy fixture','notes':'Fictional copied synthetic photo workflow; no real-person data.'}),'disposable fictional client');fid=fixture['id'];fb='/clients/'+fid
fixture_runs=[]
def poll(run,timeout=100):
 deadline=time.monotonic()+timeout
 while time.monotonic()<deadline:
  current=next(j for j in api.request(fb+'/demo-jobs')[1] if j['id']==run)
  if current['status'] not in ['queued','running']:return current
  time.sleep(.15)
 raise RuntimeError('Actual job did not finish')
def queue_component(parent,snapshot,settings=None):
 payload={'candidate':candidate,'kind':'process','photoSetId':capture['id'],'photoViews':snapshot,'minimumWidth':512,'native':parent['settings']['native'],'component':{'sourceRunId':parent['id'],'triangleRatio':.75,'voxelSize':.003,'samplePoints':12000,**(settings or {})}}
 result=check(202,api.request(fb+'/demo-jobs',payload),'queue real native dependent processing');fixture_runs.append(result['id']);return result
try:
 link=check(201,api.request(fb+'/permission-link',{}),'fixture permission link')['path']
 notice=check(200,api.request(link,anonymous=True),'fixture current notice')
 check(200,api.request(link,{'name':fixture['name'],'acknowledged':True,'noticeVersion':notice['noticeVersion']},anonymous=True),'affirmative fictional fixture acknowledgement')
 capture=check(201,api.request(fb+'/photo-sets',{'title':'Authorized synthetic six-photo fixture'}),'fictional capture');snapshot={}
 for view,asset in job['photoViews'].items():
  if view not in ['front','left-three-quarter','right-three-quarter','left-profile','right-profile','back']:continue
  image=check(200,api.request('/assets/'+asset+'/content'),'fictional source '+view)
  boundary='trama-component-test';body=b''
  for name,value in {'photoSetId':capture['id'],'view':view,'expectedAssetId':''}.items():body+=f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode()
  body+=f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="synthetic.png"\r\nContent-Type: image/png\r\n\r\n'.encode()+image+f'\r\n--{boundary}--\r\n'.encode()
  snapshot[view]=check(201,api.request(fb+'/assets',body=body,content_type='multipart/form-data; boundary='+boundary),'synthetic view '+view)['id']
 parent=check(202,api.request(fb+'/demo-jobs',{'candidate':'makehuman','kind':'fit','photoSetId':capture['id'],'photoViews':snapshot,'minimumWidth':512,'native':{'focalLength':70,'cameraDistance':1.6,'cameraHeight':.04,'fitRounds':1}}),'actual disposable upstream fitting');fixture_runs.append(parent['id']);parent=poll(parent['id']);assert parent['status']=='completed'
 child=queue_component(parent,snapshot);child=poll(child['id']);assert child['status']=='completed'
 state={**option['state'],'modelRunId':child['id'],'photoSetId':capture['id'],'photoViews':snapshot,'native':parent['settings']['native'],'component':child['settings']['component']}
 check(201,api.request(fb+'/demo-options',{'title':'Disposable dependent option','state':state}),'real dependent saved option')
 check(200,api.request(fb+'/demo-workspace',{'state':state,'version':0},'PUT'),'dependent current workspace')
 # Two public API security failures, without fabricating processing results.
 wrong={**state['component'],'sourceRunId':job['id']}
 check(400,api.request(fb+'/demo-jobs',{'candidate':candidate,'kind':'process','photoSetId':capture['id'],'photoViews':snapshot,'minimumWidth':512,'component':wrong}),'cross-client upstream denied')
 check(404,api.request(fb+'/demo-jobs/'+job_id+'/artifacts/head/model'),'cross-client native output denied')
 # Deliberately corrupt only the disposable fixture head to exercise real native failure.
 parent_head=ROOT/'.scratch/private/runtime/processing'/fid/parent['id']/'head.glb'
 original_head=parent_head.read_bytes()
 try:
  parent_head.write_bytes(b'glTF'+b'\0'*20)
  failed=queue_component(parent,snapshot);failed=poll(failed['id'])
  assert failed['status']=='failed' and not failed['result'].get('head')
  check(404,api.request(fb+'/demo-jobs/'+failed['id']+'/artifacts/head/model'),'corrupt upstream produces no fallback head')
  failure_evidence=failed['result'].get('failure')
 finally:parent_head.write_bytes(original_head)
 running=queue_component(parent,snapshot,{'samplePoints':50000});run_dir=ROOT/'.scratch/private/runtime/processing'/fid/running['id'];deadline=time.monotonic()+10
 while time.monotonic()<deadline:
  native_log=run_dir/(candidate+'.log')
  if native_log.exists() and candidate.upper()+'_RENDER front' in native_log.read_text(errors='replace'):break
  time.sleep(.01)
 assert native_log.exists() and candidate.upper()+'_RENDER front' in native_log.read_text(errors='replace'),'Actual native component processing did not start'
 # Removing only the parent output must remove completed AND live children,
 # saved options and copies, without withdrawing permission or deleting photos.
 response=check(200,api.request(fb+'/demo-jobs/'+parent['id']+'/cancel',method='POST'),'remove upstream output while child native process is running')
 assert response['removedExperiments']==4
 time.sleep(.3)
 jobs=api.request(fb+'/demo-jobs')[1]
 for id in fixture_runs:
  current=next(j for j in jobs if j['id']==id);assert current['status']=='cancelled' and current['result']=={}
  assert not (ROOT/'.scratch/private/runtime/processing'/fid/id).exists(),'Deleted private native copy recreated'
  check(404,api.request(fb+'/demo-jobs/'+id+'/artifacts/head/model'),'dependent head denied '+id)
 assert api.request(fb+'/demo-options')[1]==[] and api.request(fb+'/demo-workspace')[1]['state'] is None
 assert api.request(fb+'/permission')[1]['status']=='active' and len(api.request(fb+'/assets')[1])==6
 denied={'candidate':candidate,'kind':'process','photoSetId':capture['id'],'photoViews':snapshot,'minimumWidth':512,'component':child['settings']['component']}
 check(400,api.request(fb+'/demo-jobs',denied),'deleted upstream cannot recreate processing')
 check(200,api.request(fb+'/withdraw',{'confirmed':True}),'withdraw fictional fixture permission')
 check(403,api.request(fb+'/demo-jobs/'+child['id']+'/artifacts/diagnostic/component'),'withdrawal denies retained diagnostics')
 evidence={'date':time.strftime('%Y-%m-%dT%H:%M:%S%z'),'candidate':candidate,'upstreamRoute':'standalone MakeHuman','scope':'Actual local upstream fitting, native '+candidate+' processing, completed child and still-running native child. Synthetic photos only; no real-client likeness claim.','actualArtifactsRead':len(paths),'actualBytesRead':loaded,'processedStateReopened':True,'actualCorruptUpstreamFailure':failure_evidence,'anonymousAndCrossClientDenied':True,'privateUpstreamPathDenied':True,'parentRemovalPurgedCompletedAndRunningChildren':True,'removedExperiments':response['removedExperiments'],'sameSixSourcePhotosPreservedUntilWithdrawal':True,'permissionPreservedOnExperimentRemoval':True,'dependentWorkspaceAndOptionsRemoved':True,'deletedParentReprocessingDenied':True,'deletedDirectoriesDidNotReappear':True,'withdrawalDeniedDiagnostics':True}
 (ROOT/f'.scratch/execution-log/assets/{candidate}-live-verification.json').write_text(json.dumps(evidence,indent=2)+'\n')
finally:
 check(200,api.request(fb,{'confirmed':True},'DELETE'),'remove disposable synthetic fixture')
print('PASS real',candidate,'artifacts/reopening/auth boundaries and transitive live process erasure.')
