#!/usr/bin/env python3
"""Populate authorized synthetic cases through the loopback app API, without restoration."""
import hashlib
import json
import os
from pathlib import Path
import sys
import uuid

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'scripts'))
from local_demo_http import LocalDemoAPI

os.umask(0o077)
api=LocalDemoAPI()
check=api.expect
assets=ROOT/'.scratch/private/demo-assets'
state_path=Path(os.environ.get('TRAMA_DEMO_IMPORT_STATE',str(ROOT/'.scratch/private/runtime/demo-asset-imports.json')))
if not state_path.resolve().is_relative_to((ROOT/'.scratch/private').resolve()):
    raise SystemExit('Demo import state must remain in private local storage')
state=json.loads(state_path.read_text()) if state_path.exists() else {'cases':{}}

def save():
    temp=state_path.with_suffix('.tmp')
    temp.write_text(json.dumps(state,indent=2)+'\n')
    temp.replace(state_path)

def upload(cid,sid,view,path):
    boundary='trama-synthetic-'+uuid.uuid4().hex
    data=b''
    for name,value in {'photoSetId':sid,'view':view,'expectedAssetId':''}.items():
        data+=f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode()
    data+=f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="synthetic-{view}.png"\r\nContent-Type: image/png\r\n\r\n'.encode()
    data+=path.read_bytes()+f'\r\n--{boundary}--\r\n'.encode()
    return check(201,api.request(f'/clients/{cid}/assets',body=data,content_type=f'multipart/form-data; boundary={boundary}'),'synthetic '+view+' upload')

if 'templateId' not in state:
    t=check(201,api.request('/intake-templates',{'name':'Fictional demo styling routine',
              'questions':[{'id':'time','label':'What is your daily styling budget?','required':True}]}),'reusable fictional intake')
    state['templateId']=t['id']
    save()

for profile in json.loads((ROOT/'scripts/demo-assets/cases.json').read_text()):
    directory=assets/'clients'/profile['id']
    if not (directory/'case.json').exists():
        raise SystemExit('Case generation is incomplete: '+profile['id'])
    current=state['cases'].get(profile['id'])
    if current:
        if api.request('/clients/'+current['clientId'])[0]!=200:
            raise SystemExit('Previously imported demo client is missing or erased. Refusing to recreate it: '+profile['id'])
        permission=check(200,api.request('/clients/'+current['clientId']+'/permission'),'saved permission check')
        if permission['status']!='active':
            raise SystemExit('Demo permission is withdrawn or inactive. Refusing to restore media: '+profile['id'])
    else:
        client=check(201,api.request('/clients',{'name':profile['name'],'email':profile['id']+'@example.test',
              'notes':'Fictional synthetic demo. All views are locally rendered from one coherent 3D identity. Expected images and follow-up visits are simulated, not real haircut outcomes or reconstruction accuracy evidence.'}),'fictional client')
        current={'clientId':client['id'],'roles':{}}
        state['cases'][profile['id']]=current
        save()
        link=check(201,api.request('/clients/'+client['id']+'/permission-link',method='POST'),'synthetic acknowledgement link')
        notice=check(200,api.request(link['path'],anonymous=True),'synthetic permission notice')
        check(200,api.request(link['path'],{'name':profile['name'],'acknowledged':True,'noticeVersion':notice['noticeVersion']},anonymous=True),'simulated affirmative acknowledgement for fictional person')
    cid=current['clientId']
    if 'consultationId' not in current:
        consultation=check(201,api.request(f'/clients/{cid}/consultations',{'title':'Synthetic initial consultation',
                    'fields':profile['consultation'],'templateId':state['templateId'],'templateVersion':1,
                    'answers':{'time':profile['consultation']['maintenanceDetails']}}),'saved fictional consultation')
        current['consultationId']=consultation['id']
        save()
    for role,title in [('baseline','Synthetic baseline six-view capture'),('expected','Simulated expected reference (asset example)'),('simulated-follow-up','Simulated follow-up (not an actual haircut)')]:
        r=current['roles'].setdefault(role,{'views':{}})
        if 'setId' not in r:
            photo_set=check(201,api.request(f'/clients/{cid}/photo-sets',{'title':title,'consultationId':current['consultationId']}),'fictional '+role+' set')
            r['setId']=photo_set['id']
            save()
        for view in ['front','left-three-quarter','right-three-quarter','left-profile','right-profile','back','crown','under-chin']:
            if view in r['views']:
                response=api.request('/assets/'+r['views'][view]['assetId']+'/content')
                if response[0]!=200:
                    raise SystemExit('Imported media was removed or became inaccessible. Refusing to restore: '+role+'/'+view)
                assert hashlib.sha256(response[1]).hexdigest()==r['views'][view]['sha256']
                continue
            path=directory/role/(view+'.png')
            asset=upload(cid,r['setId'],view,path)
            r['views'][view]={'assetId':asset['id'],'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
            save()
        loaded=check(200,api.request(f'/clients/{cid}/photo-sets'),'saved set reload')
        saved=next(s for s in loaded if s['id']==r['setId'])
        assert not saved['missing'] and len(saved['views'])==8
    print('CASE_PERSISTED',profile['id'],cid)
print('PASS populated three synthetic identities, consultations and complete labeled sets; no production access or real-person agreement claimed.')
