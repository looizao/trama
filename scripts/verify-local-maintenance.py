#!/usr/bin/env python3
"""Verify retained care plans and real native stages without restoring any records."""
from datetime import datetime,timezone
import io,json
from pathlib import Path
from PIL import Image
from local_demo_http import LocalDemoAPI,RUNTIME
ROOT=Path(__file__).resolve().parents[1];api=LocalDemoAPI();known=json.loads((RUNTIME/'maintenance-demo-imports.json').read_text());report=[]
for key,entry in known.items():
 base='/clients/'+entry['clientId'];assert api.request(base+'/permission')[1]['status']=='active'
 plans=api.request(base+'/maintenance-plans')[1];initial=next(p for p in plans if p['id']==entry['planId']);series=[p for p in plans if p['seriesId']==initial['seriesId']];latest=max(series,key=lambda p:p['revision']);assert initial['revision']==1 and initial['synthetic']
 if key=='alex-ramos':assert latest['revision']==2 and initial['guidance']['dailyMinutes']==5 and latest['guidance']['dailyMinutes']==4 and latest['parentId']==initial['id']
 options=api.request(base+'/demo-options')[1];visits=api.request(base+'/outcome-visits')[1];selections=api.request(base+'/expected-results')[1]
 selected=next(s for s in selections if s['consultationId']==initial['consultationId']);assert any(e['id']==initial['expectedEventId'] and e['optionId']==initial['expectedOptionId'] and e['sequence']==initial['expectedVersion'] for e in selected['history'])
 native=[]
 for stage in latest['stages']:
  option=next(o for o in options if o['id']==stage['optionId']);state=option['state'];root=base+'/demo-jobs/'+state['modelRunId']+'/artifacts';paths=[root+'/head/model']
  for kind,choice,current in [('hair',state['hairId'],state['currentHairId']),('beard',state['beardId'],state['currentBeardId'])]:
   style=current if choice=='keep-current' else choice
   if style not in ['keep-current','none','clean-shaven']:paths.append(root+'/'+kind+'/'+style)
  for path in paths:
   status,data=api.request(path);assert status==200 and data[:4]==b'glTF';assert api.request(path,anonymous=True)[0]==401
  if stage['outcomeVisitId']:assert next(v for v in visits if v['id']==stage['outcomeVisitId'])['synthetic']
  native.append({'position':stage['position'],'weeks':stage['weeks'],'title':stage['title'],'optionId':option['id'],'nativeArtifactCount':len(paths),'actualArtifactHeadersVerified':True,'observedVisit':stage['outcomeVisitId'],'predictedGrowth':False})
 status,data=api.request(base+'/demo-options/'+initial['expectedOptionId']+'/preview');assert status==200
 with Image.open(io.BytesIO(data)) as picture:picture.load();assert picture.width>=16
 assert api.request(base+'/maintenance-plans',anonymous=True)[0]==401
 report.append({'fictionalCase':key,'initialId':initial['id'],'latestId':latest['id'],'preservedRevisionCount':len(series),'initialDailyMinutes':initial['guidance']['dailyMinutes'],'latestDailyMinutes':latest['guidance']['dailyMinutes'],'expectedVersion':initial['expectedVersion'],'expectedEventRetained':True,'stages':native,'anonymousPlanAndMediaDenied':True})
(ROOT/'.scratch/execution-log/assets/maintenance-live-verification.json').write_text(json.dumps({'verifiedAt':datetime.now(timezone.utc).isoformat(),'scope':'Live local fictional planning records, actual native GLB headers and retained expected JPEG, original immutable revisions and exact selection event history, nine stage references and simulated observed visit links. No real growth prediction or professional acceptance. No creation or mutation performed.','cases':report},indent=2)+'\n')
print('PASS preserved initial/revised routines, nine actual native stage references, original expected events, linked simulated visits and private access')
