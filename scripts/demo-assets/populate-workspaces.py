#!/usr/bin/env python3
"""Populate shared mannequin explorations, without claiming candidate head results."""
import json
import sys
import time
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from local_demo_http import LocalDemoAPI
root=Path(__file__).resolve().parents[2]
private=root/'.scratch/private/runtime'
imports=json.loads((private/'demo-asset-imports.json').read_text())
profiles=json.loads((Path(__file__).parent/'cases.json').read_text())
state_path=private/'shared-demo-imports.json'
retained=json.loads(state_path.read_text()) if state_path.exists() else {}
api=LocalDemoAPI();check=api.expect
library=check(200,api.request('/demo-library'),'shared catalog')
summary=[]
def checkpoint():
    temporary=state_path.with_suffix('.tmp');temporary.write_text(json.dumps(retained,indent=2));temporary.chmod(0o600);temporary.replace(state_path)
for profile in profiles:
    entry=imports['cases'][profile['id']];cid=entry['clientId'];base=f'/clients/{cid}'
    check(200,api.request(base),'existing fictional client')
    if check(200,api.request(base+'/permission'),'existing permission')['status']!='active':
        raise RuntimeError('Refusing to recreate work after permission withdrawal')
    baseline=entry['roles']['baseline'];sid=baseline['setId'];snapshot={v:asset['assetId'] for v,asset in baseline['views'].items()}
    assets=check(200,api.request(base+'/assets'),'existing source media')
    if not set(snapshot.values()).issubset({a['id'] for a in assets}):
        raise RuntimeError('Refusing to recreate explorations with erased source media')
    options=check(200,api.request(base+'/demo-options'),'existing explorations')
    jobs=check(200,api.request(base+'/demo-jobs'),'existing shared checks')
    workspace=check(200,api.request(base+'/demo-workspace'),'existing workspace')
    case=retained.setdefault(profile['id'],{})
    for candidate in library['candidates']:
        key=candidate['id'];known=case.setdefault(key,{})
        state={'candidate':key,'photoSetId':sid,'photoViews':snapshot,'modelRunId':'','currentHairId':profile['current']['hair'],'currentBeardId':profile['current']['beard'],'hairId':profile['proposal']['hair'],'beardId':profile['proposal']['beard'],'camera':{'azimuth':.4,'elevation':.08,'distance':1.3},'minimumWidth':512}
        if key=='blender-mpfb' and workspace['version']==0:
            workspace=check(200,api.request(base+'/demo-workspace',{'state':state,'version':0},'PUT'),'initial shared workspace')
        title=profile['name']+' / shared mannequin style inspection'
        if known.get('optionId') and not any(o['id']==known['optionId'] for o in options):
            raise RuntimeError('Known explored option removed; refusing automatic recreation')
        option=next((o for o in options if o['candidate']==key and o['title']==title),None)
        if option is None:
            option=check(201,api.request(base+'/demo-options',{'state':state,'title':title}),'shared mannequin option '+key);options.append(option)
        known['optionId']=option['id'];checkpoint()
        if known.get('jobId') and not any(j['id']==known['jobId'] for j in jobs):
            raise RuntimeError('Known experiment removed; refusing automatic recreation')
        job=next((j for j in jobs if j['id']==known.get('jobId')),None)
        if job is None:
            job=next((j for j in jobs if j['candidate']==key and j['photoSetId']==sid and j['kind']=='input-check' and j['status']=='completed'),None)
        if job is None:
            job=check(202,api.request(base+'/demo-jobs',{'candidate':key,'photoSetId':sid,'photoViews':snapshot,'minimumWidth':512}),'shared six-view diagnostics '+key)
        known['jobId']=job['id'];checkpoint()
        deadline=time.monotonic()+20
        while job['status'] in ['queued','running'] and time.monotonic()<deadline:
            jobs=check(200,api.request(base+'/demo-jobs'),'processing state')
            job=next(j for j in jobs if j['id']==known['jobId'])
            if job['status'] in ['queued','running']:time.sleep(.05)
        if job['status']!='completed':
            raise RuntimeError('Actual shared input check did not complete: '+str(job))
        report=job['result'];assert len(report['inputs'])==6
        assert {i['view']:i['assetId'] for i in report['inputs']}=={v:snapshot[v] for v in ['front','left-three-quarter','right-three-quarter','left-profile','right-profile','back']}
        summary.append({'fictionalCase':profile['id'],'candidate':key,'inputCheckStatus':job['status'],'inputCount':6,'inputCheckMS':report['elapsedMs'],'exploredMannequinOptionSaved':True,'candidateHeadProcessing':'pending'})
print(json.dumps({'scope':'Shared six-view diagnostics and generic mannequin asset explorations. Not candidate head fitting, reconstruction, selected expected results or actual haircut outcomes.','results':summary},indent=2))
