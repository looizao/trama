#!/usr/bin/env python3
"""Retain simulated visits using live authorized fictional sources; never restore erasures."""
from datetime import datetime, timezone
import json
import os
from pathlib import Path
from local_demo_http import LocalDemoAPI

ROOT=Path(__file__).resolve().parents[1]
RUNTIME=ROOT/'.scratch/private/runtime'
os.umask(0o077)
api=LocalDemoAPI();check=api.expect
imports=json.loads((RUNTIME/'demo-asset-imports.json').read_text())
profiles=json.loads((ROOT/'scripts/demo-assets/cases.json').read_text())
checkpoint=RUNTIME/'outcome-demo-imports.json'
known=json.loads(checkpoint.read_text()) if checkpoint.exists() else {}
report=[]
def retain():
    tmp=checkpoint.with_suffix('.tmp');tmp.write_text(json.dumps(known,indent=2)+'\n');tmp.replace(checkpoint)
for profile in profiles:
    key=profile['id'];case=imports['cases'][key];base='/clients/'+case['clientId']
    assert check(200,api.request(base+'/permission'),'live fictional client permission')['status']=='active','Permission withdrawn; no recreation'
    assets=check(200,api.request(base+'/assets'),'existing authorized fictional inputs')
    ids={a['id'] for a in assets}
    for role in ['baseline','expected','simulated-follow-up']:
        assert {a['assetId'] for a in case['roles'][role]['views'].values()}<=ids,'Original source deleted; no automatic recreation'
    current=check(200,api.request(base+'/outcome-visits'),'retained visits')
    expected=check(200,api.request(base+'/expected-results'),'preserved expected selections')
    consultation=case['consultationId']
    if key=='alex-ramos':
        consultations=check(200,api.request(base+'/consultations'),'existing route consultations')
        consultation=next(c['id'] for c in consultations if c['title']=='Synthetic standalone MakeHuman evaluation / route selection pending')
    selection=next(s for s in expected if s['consultationId']==consultation)
    entry=known.setdefault(key,{})
    if entry.get('consultationId'):assert entry['consultationId']==consultation
    entry['consultationId']=consultation
    if not selection['optionId']:
        assert selection['version']==0,'Previously selected result removed or cleared; no automatic recreation'
        jobs=check(200,api.request(base+'/demo-jobs'),'actual completed native heads')
        options=check(200,api.request(base+'/demo-options'),'actual explored native options')
        candidate={'maya-costa':'blender-mpfb','noah-kim':'flame'}[key]
        runs={j['id'] for j in jobs if j['candidate']==candidate and j['status']=='completed' and j['result'].get('catalog',{}).get('version')=='trama-surface-styles-v1'}
        option=next(o for o in options if o['state']['modelRunId'] in runs)
        check(201,api.request(base+'/expected-results',{'consultationId':consultation,'optionId':option['id'],'version':0,'rationale':'Fictional '+candidate+' journey example only; synthetic agreement, fitted/inferred geometry, no real outcome or professional acceptance. This does not choose the final route.','agreementMethod':'synthetic-demonstration','agreementName':profile['name'],'professionalReviewed':True,'clientAgreed':True}),'retain synthetic expected workflow example')
        selection=next(s for s in api.request(base+'/expected-results')[1] if s['consultationId']==consultation)
    assert selection['history'][0]['agreementMethod']=='synthetic-demonstration'
    entry['expectedOptionId']=selection['optionId']
    for phase,role,date in [('post-cut','expected','2026-09-02'),('follow-up','simulated-follow-up','2026-09-30')]:
        title=({'post-cut':'Synthetic post-cut demonstration / corrected date','follow-up':'Synthetic four-week follow-up demonstration'}[phase] if key=='alex-ramos' else profile['name']+' / simulated '+phase+' demonstration')
        if entry.get(phase):
            visit=next((v for v in current if v['id']==entry[phase]),None)
            assert visit is not None,'Known visit removed; no automatic recreation'
        else:
            visit=next((v for v in current if v['title']==title),None)
            if visit is None:
                payload={'requestId':key+'-simulated-'+phase+'-v1','consultationId':consultation,'kind':phase,'title':title,'occurredOn':date,'baselineSetId':case['roles']['baseline']['setId'],'actualSetId':case['roles'][role]['setId'],'expectedVersion':selection['version'],'synthetic':True,'previousVisitId':entry.get('post-cut','') if phase=='follow-up' else '', 'notes':'Fictional retrospective demonstration recorded now. Independently rendered synthetic photos represent a simulated '+phase+'; the expected selection is captured when this record is saved. No actual haircut, biological growth or reconstruction accuracy is claimed. Professional acceptance and route choice remain pending.','clientFeedback':'Fictional feedback: review silhouette and beard maintenance; retain an achievable staged plan.'}
                visit=check(201,api.request(base+'/outcome-visits',payload),'persist actual simulated visit workflow')
                current.append(visit)
            entry[phase]=visit['id'];retain()
        assert visit['synthetic'] and visit['kind']==phase and visit['occurredOn']==date
        assert visit['consultationId']==consultation and visit['baselineSetId']==case['roles']['baseline']['setId'] and visit['actualSetId']==case['roles'][role]['setId']
        assert {a['assetId'] for a in case['roles']['baseline']['views'].values()}==set(visit['views']['baseline'].values())
        assert {a['assetId'] for a in case['roles'][role]['views'].values()}==set(visit['views']['actual'].values())
        if phase=='follow-up':assert visit['previousVisitId']==entry['post-cut']
        report.append({'fictionalCase':key,'visitId':visit['id'],'kind':phase,'occurredOn':date,'synthetic':True,'expectedOptionId':visit['expectedOptionId'],'expectedVersion':visit['expectedVersion'],'baselineViews':sorted(visit['views']['baseline']),'actualViews':sorted(visit['views']['actual']),'linkedPreviousVisit':visit['previousVisitId']})
    retain()
(ROOT/'.scratch/execution-log/assets/outcomes-populated-verification.json').write_text(json.dumps({'date':datetime.now(timezone.utc).isoformat(),'scope':'Six actual persisted post-cut/follow-up workflow records across three authorized fictional clients. Images and all outcomes are synthetic simulations, with retrospective illustrative visit dates. Existing input assignments and selection events are retained without copying media or recreating deleted work. Professional review and final route choice remain pending.','visits':report},indent=2)+'\n')
print('PASS six retained simulated visits, distinct baseline/outcome sources, eight views per phase and linked follow-up history')
