#!/usr/bin/env python3
"""Exercise actual native photo derivatives and erasure on disposable synthetic inputs."""
import io
import json
from pathlib import Path
import time
from PIL import Image
from local_demo_http import LocalDemoAPI

root=Path(__file__).resolve().parents[1];api=LocalDemoAPI();check=api.expect
checkpoint=json.loads((root/'.scratch/private/runtime/full-journey-checkpoints.json').read_text())['flame']
alex='/clients/a0b730e5-490f-488d-ae16-4f3812ee044f'
source=next(j for j in api.request(alex+'/demo-jobs')[1] if j['id']==checkpoint['alexRun'])
fixture=check(201,api.request('/clients',{'name':'Disposable synthetic photo texture fixture','notes':'Authorized synthetic copy, local derivative lifetime test; no real person or agreement.'}),'disposable texture fixture');base='/clients/'+fixture['id']
try:
    link=check(201,api.request(base+'/permission-link',{}),'fixture permission link')['path'];notice=check(200,api.request(link,anonymous=True),'fixture notice')
    check(200,api.request(link,{'name':fixture['name'],'acknowledged':True,'noticeVersion':notice['noticeVersion']},anonymous=True),'simulated affirmative fixture permission')
    capture=check(201,api.request(base+'/photo-sets',{'title':'Same six synthetic inputs for derivative erasure'}),'fixture capture');snapshot={}
    for view in ['front','left-three-quarter','right-three-quarter','left-profile','right-profile','back']:
        pixels=check(200,api.request('/assets/'+source['photoViews'][view]+'/content'),'authorized synthetic '+view)
        boundary='trama-private-texture-test';body=b''
        for name,value in {'photoSetId':capture['id'],'view':view,'expectedAssetId':''}.items():body+=f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode()
        body+=f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="synthetic.png"\r\nContent-Type: image/png\r\n\r\n'.encode()+pixels+f'\r\n--{boundary}--\r\n'.encode()
        snapshot[view]=check(201,api.request(base+'/assets',body=body,content_type='multipart/form-data; boundary='+boundary),'fixture upload '+view)['id']
    settings={'candidate':'flame','kind':'fit','photoSetId':capture['id'],'photoViews':snapshot,'minimumWidth':512,'native':{'focalLength':70,'cameraDistance':1.6,'cameraHeight':.04,'fitRounds':1}}
    job=check(202,api.request(base+'/demo-jobs',settings),'real derivative processing');deadline=time.monotonic()+100
    while job['status'] in ['running','queued'] and time.monotonic()<deadline:
        time.sleep(.5);job=next(j for j in api.request(base+'/demo-jobs')[1] if j['id']==job['id'])
    assert job['status']=='completed',job['error'];assert job['result']['photoTexture']['version']=='six-photo-projection-v2'
    art=base+'/demo-jobs/'+job['id']+'/artifacts/';paths=['photo-texture/model','photo-texture/atlas','photo-texture-render/front','diagnostic/photo-texture']
    for path in paths:
        data=check(200,api.request(art+path),'real texture artifact '+path);check(401,api.request(art+path,anonymous=True),'anonymous texture denied')
        if path.endswith('atlas') or 'render' in path:Image.open(io.BytesIO(data)).load()
    directory=root/'.scratch/private/runtime/processing'/fixture['id']/job['id'];assert (directory/'photo-texture/head.glb').is_file()
    concurrent=check(202,api.request(base+'/demo-jobs',settings),'second real async derivative job')
    check(200,api.request('/assets/'+snapshot['right-profile'],{'confirmed':True},'DELETE'),'erase source and dependent media plus processing')
    for path in paths:check(404,api.request(art+path),'erased texture unavailable')
    assert not directory.exists()
    jobs=api.request(base+'/demo-jobs')[1];assert next(j for j in jobs if j['id']==concurrent['id'])['status']=='cancelled'
    assert not (root/'.scratch/private/runtime/processing'/fixture['id']/concurrent['id']).exists()
    check(400,api.request(base+'/demo-jobs',settings),'erased input cannot recreate texture')
    report={'scope':'Actual local FLAME fit and photo atlas on copied fictional six-view inputs. Real artifact serving, anonymous boundaries, source erasure, physical derivative removal and cancellation of a concurrent job. No production data or backup accessed.','fixtureId':fixture['id'],'completedRunId':job['id'],'cancelledRunId':concurrent['id'],'seconds':job['result']['elapsedMs']/1000,'projectionVersion':job['result']['photoTexture']['version'],'privateFilesRemoved':True,'concurrentProcessingCancelled':True,'erasedSourceCannotRecreate':True}
    (root/'.scratch/execution-log/assets/flame-photo-texture-live-erasure.json').write_text(json.dumps(report,indent=2)+'\n')
    print('PASS actual private photo texture derivative, six source dependencies, physical erasure, anonymous denial, async cancellation and no recreation.')
finally:
    check(200,api.request(base+'/withdraw',{'confirmed':True}),'dispose remaining synthetic fixture media')
