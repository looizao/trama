#!/usr/bin/env python3
"""Populate structured fictional staged plans with actual retained native options."""
from datetime import datetime,timezone
import copy,json,os
from pathlib import Path
from local_demo_http import LocalDemoAPI,RUNTIME
ROOT=Path(__file__).resolve().parents[1];os.umask(0o077);api=LocalDemoAPI();check=api.expect
profiles=json.loads((ROOT/'scripts/demo-assets/cases.json').read_text());visits=json.loads((RUNTIME/'outcome-demo-imports.json').read_text());imports=json.loads((RUNTIME/'demo-asset-imports.json').read_text())
checkpoint=RUNTIME/'maintenance-demo-imports.json';known=json.loads(checkpoint.read_text()) if checkpoint.exists() else {}
def retain():
 tmp=checkpoint.with_suffix('.tmp');tmp.write_text(json.dumps(known,indent=2)+'\n');tmp.replace(checkpoint)
report=[]
for profile in profiles:
 key=profile['id'];client=imports['cases'][key]['clientId'];base='/clients/'+client;observed=visits[key];consultation=observed['consultationId']
 assert check(200,api.request(base+'/permission'),'fictional active permission')['status']=='active'
 options=check(200,api.request(base+'/demo-options'),'actual retained native proposals');plans=check(200,api.request(base+'/maintenance-plans'),'preserved plans');outcomes=check(200,api.request(base+'/outcome-visits'),'actual retained simulated visits')
 assert {observed['post-cut'],observed['follow-up']}<={v['id'] for v in outcomes},'Observed visit removed; no recreation'
 if key in known:
  entry=known[key]
  if entry.get('planId'):assert any(p['id']==entry['planId'] for p in plans),'Known plan removed; no recreation'
  selected=next((o for o in options if o['id']==entry['expectedOptionId']),None);assert selected,'Expected option removed; no recreation'
 else:
  selected=next(o for o in options if o['id']==observed['expectedOptionId']);known[key]={'clientId':client,'consultationId':consultation,'expectedOptionId':selected['id'],'options':{}};entry=known[key];retain()
 for kind in ['present','intermediate']:
  if kind in entry['options']:assert any(o['id']==entry['options'][kind] for o in options),'Known stage option removed; no recreation'
  else:
   state=copy.deepcopy(selected['state']);state.pop('refinement',None);state['revisionNote']='Synthetic stage reference, not observed or predicted biological growth.'
   if kind=='present':state['hairId']='keep-current';state['beardId']='keep-current'
   else:state['hairId']={'alex-ramos':'trama-crew-wavy','maya-costa':'trama-crop-coily','noah-kim':'trama-side-part-straight'}[key];state['beardId']={'alex-ramos':'trama-light-stubble','maya-costa':'clean-shaven','noah-kim':'trama-circle'}[key]
   result=check(201,api.request(base+'/demo-options',{'title':profile['name']+' / synthetic '+kind+' stage reference','state':state}),'retain actual styled stage option');entry['options'][kind]=result['id'];options.append(result);retain()
 if 'planId' not in entry:
  selection=next(s for s in api.request(base+'/expected-results')[1] if s['consultationId']==consultation);assert selection['optionId']==selected['id'],'Expected target changed before plan creation'
  minutes={'alex-ramos':5,'maya-costa':7,'noah-kim':3}[key]
  payload={'requestId':key+'-synthetic-maintenance-plan-v1','consultationId':consultation,'expectedVersion':selection['version'],'title':profile['name']+' / synthetic maintenance and growth checkpoints','startsOn':'2026-09-02','synthetic':True,
   'guidance':{'dailyMinutes':minutes,'washing':'Fictional routine: wash according to comfort and existing tolerance; dry gently before shaping. Discuss frequency with the professional rather than assuming one schedule fits every client.','hairSteps':['Detangle gently and follow the natural direction recorded in the intake.','Shape the planned outline with the selected comb or fingers.','Use light hold only if comfortable; reassess effort at the next check-in.'],'beardSteps':(['Keep the simulated clean-shaven preference; discuss comfortable care with the professional.'] if key=='maya-costa' else ['Comb along the observed growth direction.','Check the jaw and lip outline with the professional before changing length.']),'products':['Gentle cleanser category; no brand recommendation.','Optional light-hold styling category, subject to client preference.'],'trimDays':{'alex-ramos':28,'maya-costa':35,'noah-kim':21}[key],'checkInDays':28,'feasibility':'Synthetic editable planning example only. Length, texture, density, coverage and time tolerance must be assessed professionally; future targets may require growth or a different cut. No fixed growth rate, medical benefit or achievable likeness guarantee is asserted.'},
   'stages':[{'weeks':0,'title':'Present outline and immediate care','instructions':'Discuss the keep-current fitted reference and the simulated post-cut evidence separately. This planning reference is not an actual photograph.','optionId':entry['options']['present'],'outcomeVisitId':observed['post-cut']},{'weeks':4,'title':'Intermediate shape review','instructions':'Review actual length and maintenance effort before an intermediate proposal. The linked follow-up is simulated evidence, not measured growth.','optionId':entry['options']['intermediate'],'outcomeVisitId':observed['follow-up']},{'weeks':8,'title':'Longer-term target discussion','instructions':'Reassess whether the retained expected target is achievable and still desired. This is a planning checkpoint, not a promised growth date.','optionId':selected['id'],'outcomeVisitId':''}]}
  plan=check(201,api.request(base+'/maintenance-plans',payload),'retain actual structured plan');entry['planId']=plan['id'];retain();plans.append(plan)
 plan=next(p for p in plans if p['id']==entry['planId']);assert plan['synthetic'] and len(plan['stages'])==3 and plan['expectedOptionId']==selected['id']
 assert [s['weeks'] for s in plan['stages']]==[0,4,8]
 check(401,api.request(base+'/maintenance-plans',anonymous=True),'anonymous care plan denied')
 for stage in plan['stages']:
  option=next(o for o in options if o['id']==stage['optionId']);state=option['state'];run=state['modelRunId'];root=base+'/demo-jobs/'+run+'/artifacts';check(200,api.request(root+'/head/model'),'actual stage head GLB')
  for kind,choice,current in [('hair',state['hairId'],state['currentHairId']),('beard',state['beardId'],state['currentBeardId'])]:
   style=current if choice=='keep-current' else choice
   if style not in ['keep-current','none','clean-shaven']:check(200,api.request(root+'/'+kind+'/'+style),'actual compatible stage '+kind)
 report.append({'fictionalCase':key,'planId':plan['id'],'revision':plan['revision'],'expectedOptionId':plan['expectedOptionId'],'expectedVersion':plan['expectedVersion'],'dailyMinutes':plan['guidance']['dailyMinutes'],'stages':plan['stages'],'actualNativeArtifactsVerified':True,'synthetic':True,'professionalAcceptance':'pending'})
(ROOT/'.scratch/execution-log/assets/maintenance-populated-verification.json').write_text(json.dumps({'verifiedAt':datetime.now(timezone.utc).isoformat(),'scope':'Three real persisted fictional plans, nine live native stage proposals and separate simulated visit links. No actual biological growth prediction, professional approval or final route choice. Existing erasures are never automatically restored.','plans':report},indent=2)+'\n')
print('PASS three structured plans and nine stages with actual compatible native geometry and preserved simulated outcome links')
