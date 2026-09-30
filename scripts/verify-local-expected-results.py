#!/usr/bin/env python3
"""Verify live immutable options and expected-result erasure using synthetic inputs."""
import base64
import hashlib
import io
import json
from pathlib import Path
import sys
import time
from PIL import Image
from local_demo_http import LocalDemoAPI

ROOT=Path(__file__).resolve().parents[1]
api=LocalDemoAPI();check=api.expect
alex='/clients/a0b730e5-490f-488d-ae16-4f3812ee044f'
options=check(200,api.request(alex+'/demo-options'),'retained real browser options')
first=next(o for o in options if o['id']=='c5ea9ce3-397f-47c8-b069-320d8d9ff342')
second=next(o for o in options if o['id']=='b42c8077-9ac2-4ab8-9b0a-5355a7ba5839')
assert second['parentId']==first['id'] and second['seriesId']==first['id'] and second['revision']==2
assert first['state']['refinement']['hair']['lengthPercent']==85 and second['state']['refinement']['hair']['lengthPercent']==90
results=check(200,api.request(alex+'/expected-results'),'browser selection history reopened')
assert results[0]['optionId']==second['id'] and results[0]['version']==4
assert [e['action'] for e in results[0]['history']]==['select','clear','select','select']
assert all(e['agreementMethod']=='synthetic-demonstration' for e in results[0]['history'] if e['action']=='select')
pictures=[]
for o in [first,second]:
 data=check(200,api.request(o['previewUrl'].removeprefix('/api')),'actual retained browser proposal picture')
 image=Image.open(io.BytesIO(data));image.load();assert image.format=='JPEG' and image.width==400
 check(401,api.request(o['previewUrl'].removeprefix('/api'),anonymous=True),'anonymous saved picture denied')
 pictures.append({'optionId':o['id'],'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'pixels':image.size})
fixture=check(201,api.request('/clients',{'name':'Disposable synthetic expected-result fixture','notes':'Actual local fitting of copied synthetic portraits. Agreement is simulated.'}),'disposable synthetic fixture')
base='/clients/'+fixture['id']
try:
 check(401,api.request(base+'/expected-results',anonymous=True),'anonymous selection history denied')
 link=check(201,api.request(base+'/permission-link',{}),'synthetic permission link')['path']
 notice=check(200,api.request(link,anonymous=True),'permission notice')
 check(200,api.request(link,{'name':fixture['name'],'acknowledged':True,'noticeVersion':notice['noticeVersion']},anonymous=True),'simulated affirmative permission')
 capture=check(201,api.request(base+'/photo-sets',{'title':'Same authorized synthetic six views'}),'disposable capture');snapshot={}
 for view,asset in first['state']['photoViews'].items():
  image=check(200,api.request('/assets/'+asset+'/content'),'authorized synthetic source '+view)
  boundary='trama-expected-test';body=b''
  for name,value in {'photoSetId':capture['id'],'view':view,'expectedAssetId':''}.items():body+=f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode()
  body+=f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="synthetic.png"\r\nContent-Type: image/png\r\n\r\n'.encode()+image+f'\r\n--{boundary}--\r\n'.encode()
  snapshot[view]=check(201,api.request(base+'/assets',body=body,content_type='multipart/form-data; boundary='+boundary),'fixture view '+view)['id']
 visit=check(201,api.request(base+'/consultations',{'title':'Synthetic local privacy consultation','fields':{'goal':'Verify preserved options and dependent erasure','maintenance':'low'}}),'fixture consultation')
 job=check(202,api.request(base+'/demo-jobs',{'candidate':'makehuman','kind':'fit','photoSetId':capture['id'],'photoViews':snapshot,'minimumWidth':512,'native':{'focalLength':70,'cameraDistance':1.6,'cameraHeight':.04,'fitRounds':1}}),'actual disposable client fitting')
 deadline=time.monotonic()+100
 while time.monotonic()<deadline:
  job=next(j for j in api.request(base+'/demo-jobs')[1] if j['id']==job['id'])
  if job['status'] not in ['queued','running']:break
  time.sleep(.2)
 assert job['status']=='completed',job
 directory=ROOT/'.scratch/private/runtime/processing'/fixture['id']/job['id']
 # A real neutral fitted-head render tests private image lifetime. It is not
 # evidence of a styled proposal; styled browser pictures are checked above.
 rendered=Image.open(directory/'fitted-renders/front.png').convert('RGB');rendered.thumbnail((400,400));buf=io.BytesIO();rendered.save(buf,format='JPEG')
 preview='data:image/jpeg;base64,'+base64.b64encode(buf.getvalue()).decode()
 state={**first['state'],'candidate':'makehuman','modelRunId':job['id'],'photoSetId':capture['id'],'photoViews':snapshot,'native':job['settings']['native'],'component':{'sourceRunId':'','referenceRunId':'','triangleRatio':.75,'voxelSize':.003,'samplePoints':12000}}
 option=check(201,api.request(base+'/demo-options',{'title':'Disposable actual fitted-head privacy test','state':state,'preview':preview}),'actual fitted option and private picture')
 check(404,api.request(base+'/demo-options/'+first['id']+'/preview'),'cross-client saved picture denied')
 selection={'consultationId':visit['id'],'optionId':option['id'],'version':0,'rationale':'Synthetic lifetime test only; professional assessment pending.','agreementName':fixture['name'],'agreementMethod':'synthetic-demonstration','professionalReviewed':True,'clientAgreed':True}
 check(201,api.request(base+'/expected-results',selection),'simulated expected-result selection')
 check(409,api.request(base+'/expected-results',selection),'stale expected selection denied')
 check(200,api.request('/assets/'+snapshot['right-profile'],{'confirmed':True},'DELETE'),'delete an actual fit source and all dependent proposals')
 check(404,api.request(option['previewUrl'].removeprefix('/api')),'dependent retained picture erased')
 check(404,api.request(base+'/demo-jobs/'+job['id']+'/artifacts/head/model'),'dependent actual native head erased')
 assert api.request(base+'/demo-options')[1]==[]
 after=api.request(base+'/expected-results')[1][0]
 assert after['optionId']=='' and after['version']==1 and after['history']==[]
 assert not directory.exists(),'Erased native output was recreated'
 selection['version']=1
 check(404,api.request(base+'/expected-results',selection),'deleted option cannot be selected again')
 check(200,api.request(base+'/withdraw',{'confirmed':True}),'withdraw fixture permission')
 check(403,api.request(base+'/expected-results'),'withdrawal denies expected result access')
 check(403,api.request(base+'/demo-options',{'title':'Attempted restoration','state':state,'preview':preview}),'withdrawal blocks restored options and pictures')
 evidence={'date':time.strftime('%Y-%m-%dT%H:%M:%S%z'),'scope':'Actual local browser proposal pictures, immutable revisions and four-event synthetic selection history. A disposable same-six-photo MakeHuman fit verified source-dependent erasure. No real-person accuracy or professional acceptance claim.','browserRevisions':[{'id':o['id'],'parentId':o['parentId'],'revision':o['revision']} for o in [first,second]],'browserPictures':pictures,'selectionActions':['select','select','clear','select'],'persistedSelectionVersion':4,'actualDisposableFitCompleted':True,'anonymousAndCrossClientDenied':True,'staleSelectionDenied':True,'sourceRemovalErasedNativeHeadOptionPictureAndSelectionHistory':True,'selectionVersionPreservedWithoutResurrection':True,'withdrawalDeniedRestoration':True}
 (ROOT/'.scratch/execution-log/assets/expected-live-verification.json').write_text(json.dumps(evidence,indent=2)+'\n')
finally:
 check(200,api.request(base,{'confirmed':True},'DELETE'),'erase disposable fixture')
print('PASS actual local option lineage, browser pictures, selection history, authorization and source-dependent erasure.')
