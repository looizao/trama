#!/usr/bin/env python3
"""Verify labeled uploads on a running app with disposable diagnostic squares."""
from local_demo_http import LocalDemoAPI,diagnostic_png
api=LocalDemoAPI()
check=api.expect
client=check(201,api.request('/clients',{'name':'Disposable Fictional Photo Workflow Client','notes':'Diagnostic colored squares only. No person or reconstruction accuracy evidence.'}),'create fictional photo client')
cid=client['id']
try:
    link=check(201,api.request(f'/clients/{cid}/permission-link',method='POST'),'client acknowledgement link')
    notice=check(200,api.request(link['path'],anonymous=True),'notice without account')
    check(200,api.request(link['path'],{'name':client['name'],'acknowledged':True,'noticeVersion':notice['noticeVersion']},anonymous=True),'fictional affirmative acknowledgement')
    path=f'/clients/{cid}/photo-sets'
    photo_set=check(201,api.request(path,{'title':'Diagnostic six-view set'}),'incomplete set persisted')
    assert len(photo_set['missing'])==6
    sid=photo_set['id']
    def upload(view,expected='',data=None):
        boundary='trama-labeled-diagnostic'
        body=b''
        for name,value in {'photoSetId':sid,'view':view,'expectedAssetId':expected}.items():
            body+=f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode()
        body+=f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="diagnostic.png"\r\nContent-Type: image/png\r\n\r\n'.encode()
        body+=(diagnostic_png() if data is None else data)+f'\r\n--{boundary}--\r\n'.encode()
        return api.request(f'/clients/{cid}/assets',body=body,content_type=f'multipart/form-data; boundary={boundary}')
    check(400,upload('front',data=b'not an image'),'unsupported file rejected')
    check(400,upload('front',data=diagnostic_png()[:30]),'corrupt PNG rejected')
    first=check(201,upload('front'),'front diagnostic saved')
    check(409,upload('front'),'stale overwrite rejected')
    second=check(201,upload('front',first['id']),'reviewed replacement saved')
    assert check(200,api.request(f'/assets/{first["id"]}/content'),'original retained')==diagnostic_png()
    for view in ['left-three-quarter','right-three-quarter','left-profile','right-profile','back','crown','under-chin']:
        check(201,upload(view),view+' slot saved')
    loaded=check(200,api.request(path),'reload all labels')[0]
    assert not loaded['missing'] and len(loaded['views'])==8
    check(409,api.request(f'/photo-sets/{sid}/views/back',{'assetId':second['id'],'expectedAssetId':loaded['views']['back']},'PATCH'),'same photo cannot impersonate two views')
    check(200,api.request(f'/photo-sets/{sid}/views/front',{'assetId':'','expectedAssetId':second['id']},'PATCH'),'clear view without deletion')
    check(200,api.request(f'/assets/{second["id"]}/content'),'cleared photo still available')
    check(200,api.request(f'/photo-sets/{sid}/views/front',{'assetId':first['id'],'expectedAssetId':''},'PATCH'),'reassign retained original')
    check(200,api.request(f'/assets/{first["id"]}',{'confirmed':True},'DELETE'),'delete original with dependent view cleanup')
    loaded=check(200,api.request(path),'deleted slot now missing')[0]
    assert loaded['missing']==['front']
    check(200,api.request(f'/clients/{cid}/withdraw',{'confirmed':True}),'withdrawal purges all labeled media')
    loaded=check(200,api.request(path),'withdrawal reload')[0]
    assert not loaded['views'] and len(loaded['missing'])==6
    check(403,upload('front'),'withdrawal blocks recreation')
finally:
    check(200,api.request(f'/clients/{cid}',{'confirmed':True},'DELETE'),'delete disposable photo journey')
check(404,api.request(path),'deleted set cannot reopen')
print('PASS labels, partial/complete sets, replacement, retained originals, conflict, file errors, reload and deletion. Inputs are diagnostic squares, not reconstruction evidence.')
