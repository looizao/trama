#!/usr/bin/env python3
"""Populate retained native experiments from existing fictional authorized cases."""
import argparse,json,os,sys,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'scripts'))
from local_demo_http import LocalDemoAPI
os.umask(0o077);p=argparse.ArgumentParser();p.add_argument('candidate',choices=['blender-mpfb','colmap']);p.add_argument('--preset',choices=['standard','sensitive-calibrated'],default='standard');args=p.parse_args()
kind='reconstruct' if args.candidate=='colmap' else 'fit'
checkpoint_key=args.candidate+(':'+args.preset if args.candidate=='colmap' else '')
api=LocalDemoAPI();check=api.expect;runtime=ROOT/'.scratch/private/runtime'
imports=json.loads((runtime/'demo-asset-imports.json').read_text());profiles=json.loads((ROOT/'scripts/demo-assets/cases.json').read_text())
checkpoint=runtime/'native-demo-imports.json';known=json.loads(checkpoint.read_text()) if checkpoint.exists() else {}
summary=[]
def retain():
    tmp=checkpoint.with_suffix('.tmp');tmp.write_text(json.dumps(known,indent=2));tmp.chmod(0o600);tmp.replace(checkpoint)
for profile in profiles:
    case=imports['cases'][profile['id']];cid=case['clientId'];base='/clients/'+cid
    if check(200,api.request(base+'/permission'),'existing permission')['status']!='active':raise RuntimeError('Refusing native processing after permission withdrawal')
    capture=case['roles']['baseline'];snapshot={v:a['assetId'] for v,a in capture['views'].items()};sid=capture['setId']
    existingAssets=check(200,api.request(base+'/assets'),'original synthetic sources')
    if not set(snapshot.values()).issubset({a['id'] for a in existingAssets}):raise RuntimeError('Original inputs erased; no automatic recreation')
    entry=known.setdefault(profile['id'],{}).setdefault(checkpoint_key,{})
    jobs=check(200,api.request(base+'/demo-jobs'),'retained native jobs')
    if entry.get('jobId'):
        job=next((j for j in jobs if j['id']==entry['jobId']),None)
        if job is None or job['status']=='cancelled':raise RuntimeError('Known native experiment removed; no automatic recreation')
    else:
        job=next((j for j in jobs if j['candidate']==args.candidate and j['kind']==kind and j['photoSetId']==sid and j['status'] in ['completed','failed','running','queued'] and (args.candidate!='colmap' or j['settings'].get('colmapPreset')==args.preset)),None)
        if job is None:job=check(202,api.request(base+'/demo-jobs',{'candidate':args.candidate,'kind':kind,'colmapPreset':args.preset,'photoSetId':sid,'photoViews':snapshot,'minimumWidth':512,'native':{'focalLength':70,'cameraDistance':1.6,'cameraHeight':.04,'fitRounds':4}}),'queue real six-view fitting')
        entry['jobId']=job['id'];retain()
    deadline=time.monotonic()+310
    while job['status'] in ['running','queued'] and time.monotonic()<deadline:
        time.sleep(1);jobs=api.request(base+'/demo-jobs')[1];job=next(j for j in jobs if j['id']==entry['jobId'])
    if job['status'] in ['running','queued']:raise RuntimeError('Native run did not finish within processing limit')
    item={'fictionalCase':profile['id'],'candidate':args.candidate,'jobId':job['id'],'status':job['status'],'error':job['error'],'elapsedMs':job['result'].get('elapsedMs'),'expectedResultSelection':'pending','professionalLikeness':'pending'}
    if args.candidate=='colmap':
        item.update(preset=args.preset,reconstruction=job['result'].get('reconstruction'),failure=job['result'].get('failure'))
    if job['status']=='completed' and args.candidate=='blender-mpfb':
        state={'candidate':args.candidate,'photoSetId':sid,'photoViews':job['photoViews'],'modelRunId':job['id'],'currentHairId':profile['current']['hair'],'currentBeardId':profile['current']['beard'],'hairId':profile['proposal']['hair'],'beardId':profile['proposal']['beard'],'camera':{'azimuth':0,'elevation':.08,'distance':1.3},'minimumWidth':512,'native':job['settings']['native']}
        options=api.request(base+'/demo-options')[1]
        if entry.get('optionId') and not any(o['id']==entry['optionId'] for o in options):raise RuntimeError('Known fitted option removed; no automatic recreation')
        option=next((o for o in options if o['state']['modelRunId']==job['id']),None)
        if option is None:option=check(201,api.request(base+'/demo-options',{'title':profile['name']+' / MPFB fitted synthetic exploration','state':state}),'save fitted independent styles')
        entry['optionId']=option['id'];retain();item['pairedLandmarks']=job['result']['fit']['pairedLandmarks'];item['meanLandmarkErrorPixels']=job['result']['fit']['meanLandmarkErrorPixels'];item['retainedBytes']=job['result']['retainedBytes']
    summary.append(item);print('NATIVE_CASE',json.dumps(item),flush=True)
report={'scope':'Actual six-view synthetic experiments; no ground-truth geometry or case morph parameters supplied. Failed reconstructions are retained without fallback. Saved MPFB explorations are not selected expected results. Refinement, expected results, professional review and full demo journey remain pending.','date':time.strftime('%Y-%m-%dT%H:%M:%S%z'),'results':summary}
filename='mpfb-populated-native-results.json' if args.candidate=='blender-mpfb' else 'colmap-populated-'+args.preset+'.json'
(ROOT/'.scratch/execution-log/assets'/filename).write_text(json.dumps(report,indent=2)+'\n')
