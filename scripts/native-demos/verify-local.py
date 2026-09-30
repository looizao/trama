#!/usr/bin/env python3
"""Exercise real native failure/cancellation and retained fitted-artifact access."""
import argparse,json,sys,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'scripts'))
from local_demo_http import LocalDemoAPI,diagnostic_png
parser=argparse.ArgumentParser();parser.add_argument('--candidate',choices=['blender-mpfb','makehuman','flame'],default='blender-mpfb');parser.add_argument('--job-id',default='');args=parser.parse_args();candidate=args.candidate
api=LocalDemoAPI();check=api.expect;library=check(200,api.request('/demo-library'),'shared asset catalog')
base='/clients/a0b730e5-490f-488d-ae16-4f3812ee044f'
jobs=check(200,api.request(base+'/demo-jobs'),'existing synthetic '+candidate+' run')
workspace=check(200,api.request(base+'/demo-workspace'),'retained chosen fitted workspace')
job=next(j for j in jobs if j['candidate']==candidate and j['kind']=='fit' and j['status']=='completed' and (j['id']==args.job_id if args.job_id else (candidate!='blender-mpfb' or j['id']==workspace['state']['modelRunId'])))
paths=[('head','model')]+[('hair',s['id']) for s in library['hair']]+[('beard',s['id']) for s in library['beard']]
loaded=0
for kind,identifier in paths:
    path=base+'/demo-jobs/'+job['id']+'/artifacts/'+kind+'/'+identifier
    data=check(200,api.request(path),'actual fitted '+kind+'/'+identifier);assert data[:4]==b'glTF';loaded+=len(data)
check(401,api.request(base+'/demo-jobs/'+job['id']+'/artifacts/head/model',anonymous=True),'anonymous native artifact blocked')
check(404,api.request(base+'/demo-jobs/'+job['id']+'/artifacts/diagnostic/password'),'unlisted private artifact blocked')
workspace=check(200,api.request(base+'/demo-workspace'),'reopen fitted workspace');assert args.job_id or candidate=='makehuman' or workspace['state']['modelRunId']==job['id']
options=check(200,api.request(base+'/demo-options'),'reopen fitted exploration');assert any(o['state']['modelRunId']==job['id'] for o in options)
chosen=next(o for o in options if o['state']['modelRunId']==job['id'])
previous=workspace
try:
    check(200,api.request(base+'/demo-workspace',{'version':previous['version'],'state':chosen['state']},'PUT'),'persist reopened fitted option')
    reopened=check(200,api.request(base+'/demo-workspace'),'reload actual chosen native state')
    assert reopened['state']['modelRunId']==job['id'] and reopened['state']['photoViews']==chosen['state']['photoViews']
finally:
    latest=check(200,api.request(base+'/demo-workspace'),'current version before preserving original workspace')
    check(200,api.request(base+'/demo-workspace',{'version':latest['version'],'state':previous['state']},'PUT'),'restore original current exploration')
client=check(201,api.request('/clients',{'name':'Disposable Native Processing Diagnostic','notes':'Colored diagnostic squares only, no face or client likeness.'}),'disposable native fixture')
cid=client['id'];base='/clients/'+cid;fixture_job=None
try:
    check(403,api.request(base+'/demo-jobs',{'candidate':candidate,'kind':'fit','minimumWidth':512,'photoSetId':''}),'native affirmative permission gate')
    link=check(201,api.request(base+'/permission-link',method='POST'),'fixture permission link');notice=check(200,api.request(link['path'],anonymous=True),'fixture notice')
    check(200,api.request(link['path'],{'name':client['name'],'acknowledged':True,'noticeVersion':notice['noticeVersion']},anonymous=True),'affirmative simulated fixture permission')
    capture=check(201,api.request(base+'/photo-sets',{'title':'Diagnostic squares, not portrait coverage'}),'diagnostic capture');views={}
    for view in ['front','left-three-quarter','right-three-quarter','left-profile','right-profile','back']:
        boundary='trama-native-test';body=b''
        for name,value in {'photoSetId':capture['id'],'view':view,'expectedAssetId':''}.items():body+=f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode()
        body+=f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="diagnostic.png"\r\nContent-Type: image/png\r\n\r\n'.encode()+diagnostic_png()+f'\r\n--{boundary}--\r\n'.encode()
        views[view]=check(201,api.request(base+'/assets',body=body,content_type='multipart/form-data; boundary='+boundary),'fixture upload '+view)['id']
    payload={'candidate':candidate,'kind':'fit','photoSetId':capture['id'],'photoViews':views,'minimumWidth':512,'native':{'focalLength':70,'cameraDistance':1.6,'cameraHeight':.04,'fitRounds':1}}
    failure=check(202,api.request(base+'/demo-jobs',payload),'actual no-face experiment')
    deadline=time.monotonic()+100
    while time.monotonic()<deadline:
        result=next(j for j in api.request(base+'/demo-jobs')[1] if j['id']==failure['id'])
        if result['status'] not in ['queued','running']:break
        time.sleep(.2)
    assert result['status']=='failed' and not result['result'].get('head'),result
    check(404,api.request(base+'/demo-jobs/'+failure['id']+'/artifacts/head/model'),'no fallback head served after failure')
    log=check(200,api.request(base+'/demo-jobs/'+failure['id']+'/artifacts/diagnostic/fit'),'retained actual detector failure')
    assert b'Insufficient paired landmarks' in log
    failureEvidence={'status':result['status'],'error':result['error'],'failure':result['result'].get('failure'),'modelAvailable':False}
    fixture_job=check(202,api.request(base+'/demo-jobs',payload),'real cancellation experiment')
    directory=ROOT/'.scratch/private/runtime/processing'/cid/fixture_job['id'];deadline=time.monotonic()+10
    while time.monotonic()<deadline:
        started=(directory/'prepare.log').exists() and (candidate not in ['makehuman','flame'] or ('FLAME_RENDER front' if candidate=='flame' else 'MAKEHUMAN_RENDER front') in (directory/'prepare.log').read_text(errors='replace'))
        if started and (directory/'progress.json').exists():break
        time.sleep(.05)
    assert started and (directory/'progress.json').exists(),'actual native prepare stage did not start'
    check(200,api.request('/assets/'+views['right-profile'],{'confirmed':True},'DELETE'),'erase nonfront input while native processing runs')
    time.sleep(.3);assert not directory.exists(),'private process recreated erased output'
    cancelled=next(j for j in api.request(base+'/demo-jobs')[1] if j['id']==fixture_job['id']);assert cancelled['status']=='cancelled' and cancelled['result']=={}
    check(404,api.request(base+'/demo-jobs/'+fixture_job['id']+'/artifacts/diagnostic/process'),'erased native diagnostics inaccessible')
    check(200,api.request(base+'/withdraw',{'confirmed':True}),'withdraw fixture permission')
    check(403,api.request(base+'/demo-jobs/'+failure['id']+'/artifacts/diagnostic/fit'),'withdrawal denies previous retained diagnostics')
    evidence={'date':time.strftime('%Y-%m-%dT%H:%M:%S%z'),'scope':'Real local native pipeline and privacy checks. Diagnostic squares cannot produce a fitted head. The chosen candidate synthetic Alex fitted artifacts were actually read. No real-person accuracy or professional acceptance claimed.','candidate':candidate,'fittedArtifactsRead':len(paths),'fittedBytesRead':loaded,'fittedWorkspaceAndOptionReopened':True,'anonymousAndPrivatePathDenied':True,'failureExperiment':failureEvidence,'nonfrontDeletionKilledRealNativeProcess':True,'erasedDirectoryDidNotReappear':True,'withdrawalDeniedRetainedArtifacts':True}
    filename=candidate+'-live-verification.json' if candidate in ['makehuman','flame'] else ('mpfb-corrected-live-verification.json' if args.job_id else 'mpfb-live-verification.json')
    (ROOT/'.scratch/execution-log/assets'/filename).write_text(json.dumps(evidence,indent=2)+'\n')
finally:
    if fixture_job:api.request(base+'/demo-jobs/'+fixture_job['id']+'/cancel',method='POST')
    check(200,api.request(base,{'confirmed':True},'DELETE'),'delete disposable native fixture')
print('PASS native artifact access, fitted reopening, actual no-face failure, nonfront erasure, process termination, dependent deletion and withdrawal.')
