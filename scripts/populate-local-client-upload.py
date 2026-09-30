#!/usr/bin/env python3
"""Populate actual private fictional submissions. Existing erasures are never restored."""
from datetime import datetime,timezone,timedelta
import io,json,os,urllib.request,urllib.error,uuid
from pathlib import Path
from PIL import Image
from local_demo_http import LocalDemoAPI,RUNTIME
os.umask(0o077)
ROOT=Path(__file__).resolve().parents[1]
api=LocalDemoAPI();imports=json.loads((RUNTIME/'demo-asset-imports.json').read_text());profiles=json.loads((ROOT/'scripts/demo-assets/cases.json').read_text())
checkpoint=RUNTIME/'client-upload-demo-imports.json';known=json.loads(checkpoint.read_text()) if checkpoint.exists() else {}
def retain():
 temporary=checkpoint.with_suffix('.tmp');temporary.write_text(json.dumps(known,indent=2));temporary.replace(checkpoint)
def portal(token,path='',data=None,body=None,content_type='application/json'):
 if data is not None:body=json.dumps(data).encode()
 req=urllib.request.Request('http://127.0.0.1:8080/api/client-upload'+path,data=body,headers={'Content-Type':content_type,'Authorization':'Bearer '+token})
 try:
  with urllib.request.urlopen(req) as r:
   raw=r.read();return r.status,json.loads(raw) if 'application/json' in r.headers.get('Content-Type','') else raw
 except urllib.error.HTTPError as e:return e.code,json.load(e)
def upload(token,view,file,expected=''):
 boundary='trama-'+uuid.uuid4().hex
 body=(f'--{boundary}\r\nContent-Disposition: form-data; name="expectedAssetId"\r\n\r\n{expected}\r\n--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="synthetic.png"\r\nContent-Type: image/png\r\n\r\n').encode()+file.read_bytes()+f'\r\n--{boundary}--\r\n'.encode()
 return portal(token,'/photos/'+view,body=body,content_type='multipart/form-data; boundary='+boundary)
report=[]
for p in profiles:
 key=p['id'];case=imports['cases'][key];client=case['clientId'];base='/clients/'+client
 assert api.request(base+'/permission')[1]['status']=='active','Withdrawn permission; no automatic recreation'
 live=api.request(base+'/assets')[1];assert {v['assetId'] for v in case['roles']['baseline']['views'].values()}<={x['id'] for x in live},'Original source deleted; stop'
 links=api.request(base+'/upload-links')[1]
 if key not in known:
  if key=='alex-ramos':
   browser=json.loads((RUNTIME/'browser-upload-invitation.json').read_text());path=browser['path'];link=next(x for x in links if x['title']=='Fictional Alex private self-upload demonstration')
  else:
   result=api.expect(201,api.request(base+'/upload-links',{'title':p['name']+' / private synthetic upload demo','hours':24}),'create fictional private intake');link=result['link'];path=result['path']
  known[key]={'clientId':client,'linkId':link['id'],'photoSetId':link['photoSetId'],'path':path,'views':{},'reminders':{}};retain()
 entry=known[key];link=next((x for x in links if x['id']==entry['linkId']),None) if links else None
 if link is None:link=next((x for x in api.request(base+'/upload-links')[1] if x['id']==entry['linkId']),None)
 assert link is not None and not link['revokedAt'],'Known link removed or revoked; never recreate'
 token=entry['path'].split('#')[1];status,state=portal(token);assert status==200,'Expired/revoked link; request a new explicit invitation'
 if state['intake'] is None:
  assert not entry.get('submitted'),'Known intake removed; stop'
  api.expect(201,portal(token,'/intake',{'goal':p['consultation']['goal'] if 'consultation' in p else 'Fictional practical style with a maintainable silhouette','maintenance':'low','routine':'Five minutes of fictional daily care; synthetic demo, professional review pending.'}),'actual client intake submission')
  entry['submitted']=True;retain()
 for view in case['roles']['baseline']['views']:
  status,state=portal(token);assert status==200
  if view in entry['views']:assert state['views'].get(view)==entry['views'][view],'Known media deleted or replaced; stop'
  elif state['views'].get(view):entry['views'][view]=state['views'][view];retain()
  else:
   asset=api.expect(201,upload(token,view,ROOT/'.scratch/private/demo-assets/clients'/key/'baseline'/f'{view}.png'),'actual synthetic labeled upload')
   entry['views'][view]=asset['id'];retain()
  status,payload=portal(token,'/photos/'+view);assert status==200
  with Image.open(io.BytesIO(payload)) as picture:picture.load();assert picture.size==(768,896)
 reminders=api.request(base+'/reminders')[1]
 for kind,delta,visible in [('due',-1,True),('future',48,True),('internal',24,False)]:
  if kind in entry['reminders']:assert any(x['id']==entry['reminders'][kind] for x in reminders),'Known reminder removed; stop'
  else:
   reminder=api.expect(201,api.request(base+'/reminders',{'title':p['name']+' / synthetic '+kind+' check-in','message':('Fictional studio-only coordination.' if not visible else 'Review the labeled photos and discuss daily care with the professional. Synthetic demonstration; no external delivery.'),'dueAt':(datetime.now(timezone.utc)+timedelta(hours=delta)).isoformat(),'clientVisible':visible}),'retain local reminder')
   entry['reminders'][kind]=reminder['id'];retain()
 status,state=portal(token);assert status==200 and not state['missing'] and state['intake']
 assert len(state['views'])==8 and not any(r['id']==entry['reminders']['internal'] for r in state['reminders'])
 assert all(not r.get('clientName') and not r.get('clientId') for r in state['reminders'])
 api.expect(401,api.request(base+'/upload-links',anonymous=True),'anonymous studio links denied')
 api.expect(401,api.request(base+'/reminders',anonymous=True),'anonymous reminder access denied')
 # A bearer is never a studio session.
 req=urllib.request.Request('http://127.0.0.1:8080/api/clients',headers={'Authorization':'Bearer '+token})
 try:urllib.request.urlopen(req);raise AssertionError('Bearer widened access')
 except urllib.error.HTTPError as error:assert error.code==401
 report.append({'fictionalCase':key,'clientId':client,'linkId':entry['linkId'],'photoSetId':entry['photoSetId'],'uploadedViews':sorted(state['views']),'decodedPictures':8,'intakeSubmitted':True,'pendingClientReminders':len(state['reminders']),'internalReminderHidden':True,'bearerStudioAccessDenied':True,'anonymousStudioAccessDenied':True})
(ROOT/'.scratch/execution-log/assets/client-upload-live-verification.json').write_text(json.dumps({'verifiedAt':datetime.now(timezone.utc).isoformat(),'scope':'Actual local persisted submissions using three authorized fictional identities and their original coherent synthetic renders. No client accounts or external messages. No reconstruction accuracy or actual haircut outcome claim. Secret tokens excluded. Deleted work is never recreated.','cases':report},indent=2)+'\n')
print('PASS three real client submissions, 24 decoded uploads, scoped access and local reminders')
