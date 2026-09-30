#!/usr/bin/env python3
"""Verify the importer refuses erased or withdrawn fictional material on loopback."""
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'scripts'))
from local_demo_http import LocalDemoAPI,diagnostic_png
api=LocalDemoAPI()
check=api.expect
original=json.loads((ROOT/'.scratch/private/runtime/demo-asset-imports.json').read_text())
private=ROOT/'.scratch/private/assets-work/import-guard-state.json'

def attempt(case,reason):
    data={'templateId':original['templateId'],'cases':{'alex-ramos':case}}
    private.write_text(json.dumps(data))
    before=check(200,api.request('/clients'),'client list before guarded import')
    result=subprocess.run([sys.executable,str(ROOT/'scripts/demo-assets/populate.py')],
            env=dict(os.environ,TRAMA_DEMO_IMPORT_STATE=str(private)),capture_output=True,text=True)
    assert result.returncode!=0 and reason in result.stderr,(result.returncode,result.stdout,result.stderr)
    assert check(200,api.request('/clients'),'client list after guarded import')==before
    print('PASS importer refusal:',reason)

fixture=check(201,api.request('/clients',{'name':'Disposable Synthetic Import Guard','notes':'Disposable colored-square verification, no real person.'}),'disposable guard client')
cid=fixture['id']
try:
    link=check(201,api.request(f'/clients/{cid}/permission-link',method='POST'),'guard permission link')
    notice=check(200,api.request(link['path'],anonymous=True),'guard notice')
    check(200,api.request(link['path'],{'name':fixture['name'],'acknowledged':True,'noticeVersion':notice['noticeVersion']},anonymous=True),'synthetic acknowledgement')
    photo_set=check(201,api.request(f'/clients/{cid}/photo-sets',{'title':'Disposable diagnostic importer set'}),'guard set')
    boundary='trama-import-guard'
    raw=(f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="diagnostic.png"\r\nContent-Type: image/png\r\n\r\n').encode()+diagnostic_png()+f'\r\n--{boundary}--\r\n'.encode()
    asset=check(201,api.request(f'/clients/{cid}/assets',body=raw,content_type=f'multipart/form-data; boundary={boundary}'),'guard diagnostic upload')
    check(200,api.request('/assets/'+asset['id'],{'confirmed':True},'DELETE'),'erase disposable media')
    case={'clientId':cid,'consultationId':'already-recorded-in-fixture-state','roles':{'baseline':{'setId':photo_set['id'],'views':{'front':{'assetId':asset['id'],'sha256':'erased'}}}}}
    attempt(case,'Imported media was removed or became inaccessible')
    assert check(200,api.request(f'/clients/{cid}/assets'),'erased media remains absent')==[]
    check(200,api.request(f'/clients/{cid}/withdraw',{'confirmed':True}),'withdraw fictional permission')
    attempt(case,'Demo permission is withdrawn or inactive')
finally:
    check(200,api.request(f'/clients/{cid}',{'confirmed':True},'DELETE'),'erase disposable guard client')
attempt(case,'Previously imported demo client is missing or erased')
private.unlink(missing_ok=True)
print('PASS no erased client/media recreation and no withdrawn-media restoration. Real retained demo cases untouched.')
