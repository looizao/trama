#!/usr/bin/env python3
"""Verify live consultation persistence with disposable fictional inputs."""
import http.cookiejar
import json
from pathlib import Path
import urllib.error
import urllib.request

runtime=Path(__file__).resolve().parent.parent/'.scratch/private/runtime'
env=dict(line.split('=',1) for line in (runtime/'local.env').read_text().splitlines())
http=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def req(path,body=None,method=None):
    request=urllib.request.Request('http://127.0.0.1:8080/api'+path,data=json.dumps(body).encode() if body is not None else None,method=method,headers={'Content-Type':'application/json'})
    try:
        with http.open(request) as response:return response.status,json.load(response)
    except urllib.error.HTTPError as error:return error.code,json.load(error)
def check(expected,response,label):
    assert response[0]==expected,(label,response)
    print(f'PASS {label}: HTTP {expected}')
    return response[1]
check(200,req('/login',{'email':env['ADMIN_EMAIL'],'password':env['ADMIN_PASSWORD']}),'mandated demo account login')
client=check(201,req('/clients',{'name':'Disposable Fictional Consultation Client','notes':'Local diagnostic case, no real person.'}),'create fictional client')
path=f'/clients/{client["id"]}/consultations'
check(400,req(path,{'title':'First consultation','fields':{'maintenance':'low'}}),'missing goal rejected')
check(400,req(path,{'title':'First consultation','fields':{'goal':'Fictional preference'}}),'missing maintenance rejected')
template=check(201,req('/intake-templates',{'name':'Local diagnostic reusable intake','questions':[{'id':'routine','label':'Which tools do you use?','required':True}]}),'create reusable template')
body={'title':'First consultation','fields':{'goal':'A softer outline','maintenance':'low','hairTexture':'Optional fictional observation'},'templateId':template['id'],'templateVersion':1,'answers':{}}
check(400,req(path,body),'required custom answer rejected')
body['answers']={'routine':'A comb'}
first=check(201,req(path,body),'complete consultation persisted')
check(200,req('/intake-templates/'+template['id'],{'name':template['name'],'version':1,'questions':[{'id':'routine','label':'How much time do you spend styling?','required':False}]},'PATCH'),'template edited independently')
check(409,req(path,body),'stale template rejected')
body.update(templateId='',revisesId=first['id']);body['fields']['goal']='A softer outline with more volume'
second=check(201,req(path,body),'revision preserved')
check(409,req(path,body),'stale revision rejected')
loaded=check(200,req(path),'reload saved history')
assert len(loaded)==2 and loaded[1]['fields']['goal']=='A softer outline'
assert second['template']['questions'][0]['label']=='Which tools do you use?'
assert loaded[0]['template']['version']==1
check(200,req('/clients/'+client['id'],{'confirmed':True},'DELETE'),'dispose fictional client')
check(404,req(path),'deleted consultation cannot reopen')
check(200,req('/intake-templates/'+template['id'],{'name':template['name'],'version':2,'questions':[{'id':'routine','label':'How much time do you spend styling?','required':False}],'archived':True},'PATCH'),'archive reusable diagnostic template')
print('PASS local required fields, templates, snapshots, revisions, reload and client deletion. No external services used.')
