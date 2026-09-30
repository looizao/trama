#!/usr/bin/env python3
"""Populate retained native experiments from existing fictional authorized cases."""
import argparse,json,os,sys,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'scripts'))
from local_demo_http import LocalDemoAPI
os.umask(0o077);p=argparse.ArgumentParser();p.add_argument('candidate',choices=['blender-mpfb','colmap','makehuman','flame']);p.add_argument('--preset',choices=['standard','sensitive-calibrated'],default='standard');p.add_argument('--basis-version',choices=['mpfb-metre-z-up-v2','makehuman-metre-z-up-v2','flame-2023-open-neutral-rig-v4'],default='');p.add_argument('--style-version',choices=['makehuman-visible-lips-v2'],default='');p.add_argument('--texture-version',choices=['six-photo-projection-v2'],default='');p.add_argument('--catalog-version',choices=['trama-surface-styles-v1'],default='');args=p.parse_args()
if args.texture_version and args.candidate!='flame':raise SystemExit('This photo texture version belongs to FLAME')
if args.style_version and args.candidate!='makehuman':raise SystemExit('This style attachment version belongs to standalone MakeHuman')
if args.basis_version and {'blender-mpfb':'mpfb-metre-z-up-v2','makehuman':'makehuman-metre-z-up-v2','flame':'flame-2023-open-neutral-rig-v4'}.get(args.candidate)!=args.basis_version:raise SystemExit('Select the native basis version belonging to this candidate')
kind='reconstruct' if args.candidate=='colmap' else 'fit'
checkpoint_key=args.candidate+(':'+args.preset if args.candidate=='colmap' else (':'+args.basis_version if args.basis_version else ''))+(':'+args.style_version if args.style_version else '')+(':'+args.texture_version if args.texture_version else '')+(':'+args.catalog_version if args.catalog_version else '')
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
        job=next((j for j in jobs if j['candidate']==args.candidate and j['kind']==kind and j['photoSetId']==sid and j['status'] in ['completed','failed','running','queued'] and (args.candidate!='colmap' or j['settings'].get('colmapPreset')==args.preset) and (not args.basis_version or j['result'].get('fit',{}).get('basisVersion')==args.basis_version) and (not args.style_version or j['result'].get('nativeShape',{}).get('styleAttachment',{}).get('version')==args.style_version) and (not args.texture_version or j['result'].get('photoTexture',{}).get('version')==args.texture_version) and (not args.catalog_version or j['result'].get('catalog',{}).get('version')==args.catalog_version)),None)
        if job is None:job=check(202,api.request(base+'/demo-jobs',{'candidate':args.candidate,'kind':kind,'colmapPreset':args.preset,'photoSetId':sid,'photoViews':snapshot,'minimumWidth':512,'native':{'focalLength':70,'cameraDistance':1.6,'cameraHeight':.04,'fitRounds':4}}),'queue real six-view fitting')
        entry['jobId']=job['id'];retain()
    deadline=time.monotonic()+310
    while job['status'] in ['running','queued'] and time.monotonic()<deadline:
        time.sleep(1);jobs=api.request(base+'/demo-jobs')[1];job=next(j for j in jobs if j['id']==entry['jobId'])
    if job['status'] in ['running','queued']:raise RuntimeError('Native run did not finish within processing limit')
    if args.basis_version and job['status']=='completed' and job['result'].get('fit',{}).get('basisVersion')!=args.basis_version:raise RuntimeError('Completed native run uses the wrong basis version')
    if args.style_version and job['status']=='completed' and job['result'].get('nativeShape',{}).get('styleAttachment',{}).get('version')!=args.style_version:raise RuntimeError('Completed native run uses the wrong style attachment version')
    if args.texture_version and job['status']=='completed' and job['result'].get('photoTexture',{}).get('version')!=args.texture_version:raise RuntimeError('Completed native run uses the wrong photo texture version')
    if args.catalog_version and job['status']=='completed' and job['result'].get('catalog',{}).get('version')!=args.catalog_version:raise RuntimeError('Completed native run uses a different catalog version')
    item={'fictionalCase':profile['id'],'candidate':args.candidate,'jobId':job['id'],'status':job['status'],'error':job['error'],'elapsedMs':job['result'].get('elapsedMs'),'expectedResultSelection':'pending','professionalLikeness':'pending'}
    if args.candidate=='colmap':
        item.update(preset=args.preset,reconstruction=job['result'].get('reconstruction'),failure=job['result'].get('failure'))
    if job['status']=='completed' and args.candidate in ['blender-mpfb','makehuman','flame']:
        state={'candidate':args.candidate,'photoSetId':sid,'photoViews':job['photoViews'],'modelRunId':job['id'],'currentHairId':profile['current']['hair'],'currentBeardId':profile['current']['beard'],'hairId':profile['proposal']['hair'],'beardId':profile['proposal']['beard'],'camera':{'azimuth':0,'elevation':.08,'distance':1.3},'minimumWidth':512,'native':job['settings']['native']}
        options=api.request(base+'/demo-options')[1]
        if entry.get('optionId') and not any(o['id']==entry['optionId'] for o in options):raise RuntimeError('Known fitted option removed; no automatic recreation')
        option=next((o for o in options if o['state']['modelRunId']==job['id']),None)
        if option is None:option=check(201,api.request(base+'/demo-options',{'title':profile['name']+' / '+args.candidate+(' corrected basis' if args.basis_version else '')+' fitted synthetic exploration','state':state}),'save fitted independent styles')
        entry['optionId']=option['id'];retain();item['pairedLandmarks']=job['result']['fit']['pairedLandmarks'];item['meanLandmarkErrorPixels']=job['result']['fit']['meanLandmarkErrorPixels'];item['retainedBytes']=job['result']['retainedBytes']
    item['catalog']=job['result'].get('catalog',{});summary.append(item);print('NATIVE_CASE',json.dumps(item),flush=True)
report={'scope':'Actual six-view synthetic experiments; no ground-truth geometry or case morph parameters supplied. Failed reconstructions are retained without fallback. Saved fitted explorations are not selected expected results. Refinement, expected results, professional review and full demo journey remain pending.','date':time.strftime('%Y-%m-%dT%H:%M:%S%z'),'results':summary}
filename={'blender-mpfb':'mpfb-populated-native-results.json','makehuman':'makehuman-populated-native-results.json','flame':'flame-populated-native-results.json'}.get(args.candidate,'colmap-populated-'+args.preset+'.json')
if args.basis_version:filename='mpfb-populated-corrected-results.json' if args.candidate=='blender-mpfb' else ('flame-populated-native-results.json' if args.candidate=='flame' else 'makehuman-populated-validated-results.json')
if args.texture_version:filename='flame-populated-photo-texture-results.json'
if args.style_version:filename='makehuman-populated-visible-lips-results.json'
if args.catalog_version:filename=args.candidate+'-populated-'+args.catalog_version+'.json'
(ROOT/'.scratch/execution-log/assets'/filename).write_text(json.dumps(report,indent=2)+'\n')
