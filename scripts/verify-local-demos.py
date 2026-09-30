#!/usr/bin/env python3
"""Verify real local demo jobs and persistence with disposable image fixtures."""
import json
import time
from pathlib import Path
from local_demo_http import LocalDemoAPI, diagnostic_png
api=LocalDemoAPI();check=api.expect
library=check(200,api.request('/demo-library'),'shared library')
assert len(library['candidates'])==8 and len(library['hair'])>=11 and len(library['beard'])>=5
assert all(c['dependency'] for c in library['candidates'] if c['id'] in ['open3d','meshlab','cloudcompare'])
check(401,api.request('/demo-library',anonymous=True),'anonymous library denied')
loaded_bytes=0
for style in library['hair']+library['beard']:
    data=check(200,api.request(style['modelUrl'].removeprefix('/api')),'actual GLB '+style['id'])
    assert data[:4]==b'glTF' and len(data)==style['bytes']
    loaded_bytes+=len(data)
check(404,api.request('/demo-library/head/private/model'),'private paths excluded')
client=check(201,api.request('/clients',{'name':'Disposable Fictional Demo Workspace Client','notes':'Colored diagnostic squares, not a person or accuracy evidence.'}),'disposable fixture')
cid=client['id'];base=f'/clients/{cid}'
try:
    check(403,api.request(base+'/demo-jobs'),'permission gate')
    link=check(201,api.request(base+'/permission-link',method='POST'),'acknowledgement link')
    notice=check(200,api.request(link['path'],anonymous=True),'notice')
    check(200,api.request(link['path'],{'name':client['name'],'acknowledged':True,'noticeVersion':notice['noticeVersion']},anonymous=True),'affirmative fictional acknowledgement')
    photo_set=check(201,api.request(base+'/photo-sets',{'title':'Diagnostic six-view fixture'}),'photo set')
    sid=photo_set['id'];views={}
    def upload(view,expected=''):
        boundary='trama-demo-diagnostic'
        body=b''
        for name,value in {'photoSetId':sid,'view':view,'expectedAssetId':expected}.items():
            body+=f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode()
        body+=f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="diagnostic.png"\r\nContent-Type: image/png\r\n\r\n'.encode()+diagnostic_png()+f'\r\n--{boundary}--\r\n'.encode()
        return check(201,api.request(base+'/assets',body=body,content_type=f'multipart/form-data; boundary={boundary}'),'upload '+view)
    check(400,api.request(base+'/demo-jobs',{'candidate':'blender-mpfb','photoSetId':sid,'minimumWidth':512}),'incomplete capture rejected')
    for view in ['front','left-three-quarter','right-three-quarter','left-profile','right-profile','back','crown','under-chin']:
        views[view]=upload(view)['id']
    state={'candidate':'blender-mpfb','photoSetId':sid,'modelRunId':'','currentHairId':library['hair'][0]['id'],'currentBeardId':'clean-shaven','hairId':'keep-current','beardId':library['beard'][0]['id'],'camera':{'azimuth':.5,'elevation':.2,'distance':1.1},'minimumWidth':512}
    saved=check(200,api.request(base+'/demo-workspace',{'state':state,'version':0},'PUT'),'persist selections and camera')
    state=saved['state'];assert state['photoViews']==views
    check(409,api.request(base+'/demo-workspace',{'state':state,'version':0},'PUT'),'stale workspace conflict')
    option=check(201,api.request(base+'/demo-options',{'title':'Diagnostic retained independent selection','state':state}),'save explored option')
    assert check(200,api.request(base+'/demo-workspace'),'reload workspace')['state']==state
    assert check(200,api.request(base+'/demo-options'),'reload options')[0]['state']==state
    original=views['back'];replacement=upload('back',original)['id']
    run=check(202,api.request(base+'/demo-jobs',{'candidate':'blender-mpfb','photoSetId':sid,'photoViews':state['photoViews'],'minimumWidth':512}),'real asynchronous input job')
    deadline=time.monotonic()+10
    while time.monotonic()<deadline:
        jobs=api.request(base+'/demo-jobs')[1]
        job=next(j for j in jobs if j['id']==run['id'])
        if job['status'] not in ['queued','running']:break
        time.sleep(.05)
    assert job['status']=='completed',job
    assert len(job['result']['inputs'])==6 and all(i['width']==48 and len(i['sha256'])==64 for i in job['result']['inputs'])
    assert next(i for i in job['result']['inputs'] if i['view']=='back')['assetId']==original
    assert all(any('Identical image' in w for w in i['warnings']) for i in job['result']['inputs'])
    retained=Path(__file__).resolve().parent.parent/'.scratch/private/runtime/processing'/cid/run['id']/'input-report.json'
    assert retained.exists()
    check(200,api.request('/assets/'+original,{'confirmed':True},'DELETE'),'erase nonfront snapshot input')
    erased=check(200,api.request(base+'/demo-jobs'),'cancelled result reload')[0]
    assert erased['status']=='cancelled' and erased['result']=={} and not retained.parent.exists()
    assert check(200,api.request(base+'/demo-options'),'dependent options erased')==[]
    assert check(200,api.request(base+'/demo-workspace'),'snapshot workspace cleared')['state'] is None
    assert check(200,api.request(base+'/photo-sets'),'replacement preserved')[0]['views']['back']==replacement
    fresh=check(202,api.request(base+'/demo-jobs',{'candidate':'colmap','photoSetId':sid,'minimumWidth':512}),'new local check')
    check(200,api.request(base+'/demo-jobs/'+fresh['id']+'/cancel',method='POST'),'explicit cancellation')
    check(200,api.request(base+'/withdraw',{'confirmed':True}),'withdrawal')
    for resource in ['demo-workspace','demo-options','demo-jobs']:
        check(403,api.request(base+'/'+resource),'withdrawal denies '+resource)
    result={'scope':'Local API checks, diagnostic colored squares only. Not reconstruction accuracy.','candidateCount':8,'hairModels':len(library['hair']),'beardModels':len(library['beard']),'actualGLBBytesRead':loaded_bytes,'sixInputMetricsVerified':True,'snapshotReplacementAndErasureVerified':True,'workspaceAndOptionReloadVerified':True,'cancellationAndWithdrawalVerified':True,'date':time.strftime('%Y-%m-%dT%H:%M:%S%z')}
    print(json.dumps(result,indent=2))
finally:
    check(200,api.request(base,{'confirmed':True},'DELETE'),'delete disposable fixture')
print('PASS local demo library, actual processing, reload, retained inputs, cancellation and deletion. No external processing.')
