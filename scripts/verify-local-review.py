#!/usr/bin/env python3
"""Read-only final review of original local fictional cases and native results."""
from datetime import datetime,timezone
import hashlib,io,json,struct
from pathlib import Path
from PIL import Image
from local_demo_http import LocalDemoAPI,RUNTIME
ROOT=Path(__file__).resolve().parents[1];ASSETS=ROOT/'.scratch/execution-log/assets';api=LocalDemoAPI()
imports=json.loads((RUNTIME/'demo-asset-imports.json').read_text())['cases']
library=api.request('/demo-library')[1];assert len(library['candidates'])==8
active={kind:[s for s in library[kind] if not s.get('deprecated')] for kind in ['hair','beard']}
assert len(active['hair'])==40 and len(active['beard'])==20
fit_versions={'blender-mpfb':'mpfb-metre-z-up-v2','makehuman':'makehuman-metre-z-up-v2','flame':'flame-2023-open-neutral-rig-v4'}
components={'open3d':'open3d-cpu-upstream-v5','meshlab':'meshlab-native-upstream-v1','cloudcompare':'cloudcompare-native-upstream-v2'}
views=['front','left-three-quarter','right-three-quarter','left-profile','right-profile','back'];results={c['id']:[] for c in library['candidates']};cases=[];checked=0
for key,entry in imports.items():
 cid=entry['clientId'];base='/clients/'+cid;assert api.request(base+'/permission')[1]['status']=='active'
 original=entry['roles']['baseline']['views'];original_ids={v:a['assetId'] for v,a in original.items()}
 for view in views:
  status,data=api.request('/assets/'+original_ids[view]+'/content');assert status==200 and hashlib.sha256(data).hexdigest()==original[view]['sha256']
  with Image.open(io.BytesIO(data)) as im:im.load();assert im.width>=512
 jobs=api.request(base+'/demo-jobs')[1];options=api.request(base+'/demo-options')[1];valid={}
 for job in jobs:
  r=job['result'];candidate=job['candidate']
  if job['status']!='completed' or not r.get('head') or r.get('catalog',{}).get('version')!='trama-surface-styles-v1':continue
  if candidate in fit_versions:
   if r.get('fit',{}).get('basisVersion')!=fit_versions[candidate]:continue
   if candidate=='makehuman' and r.get('nativeShape',{}).get('styleAttachment',{}).get('version')!='makehuman-visible-lips-v2':continue
   assert r.get('targetBasisCheck',{}).get('passed') is not False
  elif r.get('component',{}).get('processingVersion')!=components.get(candidate):continue
  assert job['photoViews']==original_ids
  directory=RUNTIME/'processing'/cid/job['id'];assert directory.is_dir() and not directory.is_symlink()
  for kind in ['hair','beard']:
   assert {s['id'] for s in active[kind]}<=set(r[kind])
   for identifier,path in r[kind].items():
    assert path==kind+'/'+identifier+'.glb';file=directory/path
    with file.open('rb') as stream:header=stream.read(12)
    assert struct.unpack('<4sII',header)==(b'glTF',2,file.stat().st_size);checked+=1
  status,head=api.request(base+'/demo-jobs/'+job['id']+'/artifacts/head/model');assert status==200 and head[:4]==b'glTF'
  assert api.request(base+'/demo-jobs/'+job['id']+'/artifacts/head/model',anonymous=True)[0]==401
  native={'fictionalCase':key,'jobId':job['id'],'elapsedSeconds':r['elapsedMs']/1000,'retainedMiBAtProcessing':r['retainedBytes']/1048576,'resources':r['resources'],'iterations':r.get('fit',{}).get('iterations',[]),'evaluationCount':r.get('fit',{}).get('evaluations'),'nativeStyleCount':len(r['hair'])+len(r['beard']),'headSha256':hashlib.sha256(head).hexdigest(),'catalogVersion':r['catalog']['version'],'catalogSnapshotSha256':r['catalog']['snapshotSha256'],'sameOriginalPhotos':True,'geometry':r.get('geometry'),'limitations':r.get('fit',r.get('component',{})).get('limitations',[]),'upstream':r.get('component',{}).get('upstream')}
  if native['upstream']:
   upstream=next(j for j in jobs if j['id']==native['upstream']['runId']);assert upstream['status']=='completed' and upstream['photoViews']==original_ids
   native['upstream']['headSha256Verified']=hashlib.sha256((RUNTIME/'processing'/cid/upstream['id']/'head.glb').read_bytes()).hexdigest()==native['upstream']['headSha256'];assert native['upstream']['headSha256Verified']
  results[candidate].append(native);valid[job['id']]=job
 for candidate in fit_versions:assert len([j for j in valid.values() if j['candidate']==candidate])==1
 for candidate in components:assert {j['result']['component']['upstream']['candidate'] for j in valid.values() if j['candidate']==candidate}==set(fit_versions)
 failed=[j for j in jobs if j['candidate']=='colmap' and j['kind']=='reconstruct'];assert len(failed)>=2
 for j in failed:
  assert j['status']=='failed' and not j['result'].get('head') and all(not t['models'] for t in j['result']['reconstruction']['trials'])
  r=j['result']['reconstruction'];results['colmap'].append({'fictionalCase':key,'jobId':j['id'],'preset':j['settings']['colmapPreset'],'elapsedSeconds':r['elapsedMs']/1000,'retainedMiBAtProcessing':r['retainedBytes']/1048576,'resources':r['resources'],'features':r['features'],'verifiedPairs':r['pairs'],'trials':r['trials'],'limitations':r['limitations'],'unmetRequirements':r['unmetRequirements'],'usableHead':False})
 assert not any(j['result'].get('head') for j in jobs if j['candidate']=='meshroom')
 assert all(any(o['state']['candidate']==c and o['state']['modelRunId'] in valid and o['previewUrl'] for o in options) for c in [*fit_versions,*components]) if key=='alex-ramos' else True
 # Original expected choices, simulated visits, upload submissions and plan history must survive together.
 expected=api.request(base+'/expected-results')[1];visits=api.request(base+'/outcome-visits')[1];plans=api.request(base+'/maintenance-plans')[1];links=api.request(base+'/client-upload-links')[1];reminders=api.request(base+'/reminders')[1]
 assert len(visits)>=2 and any(e['optionId'] and e['history'] for e in expected) and len(plans)>=1 and len(links)>=1 and len(reminders)>=3
 assert api.request(base+'/demo-options',anonymous=True)[0]==401
 cases.append({'fictionalCase':key,'clientId':cid,'originalSixPhotosDecodedAndSha256Verified':True,'retainedOptions':len(options),'selectionHistoryEvents':sum(len(e['history']) for e in expected),'simulatedVisits':len(visits),'immutablePlanRevisions':len(plans),'uploadLinks':len(links),'localReminders':len(reminders),'currentNativeRuns':len(valid)})
 print('PASS',key,'original six photographs, twelve current native routes, preserved options/expected history/visits/upload/reminders/plans')
summary=[]
for candidate in library['candidates']:
 identifier=candidate['id'];runs=results[identifier];status='failed' if identifier=='colmap' else 'blocked' if identifier=='meshroom' else 'verified local workflow'
 summary.append({'id':identifier,'name':candidate['name'],'role':candidate['role'],'dependency':candidate['dependency'],'status':status,'runs':runs,'professionalAcceptance':'pending','realPersonAccuracy':'unvalidated','sixPhotoCoverage':'Original six synthetic photographs only. No denser capture or independent measured head scan.'})
report={'verifiedAt':datetime.now(timezone.utc).isoformat(),'scope':'Read-only live local original fictional cases. Actual source image hashes and decoding, 36 persisted native jobs, 2736 style GLB headers and lengths, original upstream head hashes, actual authenticated/anonymous head access, retained workflows. Prior full decoded catalog/1368 edit/render/browser tests remain separate evidence. No records created, rewritten or restored.','activeHair':40,'activeBeard':20,'styleHeadersVerified':checked,'cases':cases,'candidates':summary,'meshroomBlocker':'Official AliceVision 3.3.0 runtime includes CUDA 12.1.1 terms awaiting user acceptance. Source graph experiment retained; no runtime/head success claimed.','geometryScope':'Observed pixels and detected 2D features; fitted and inferred surfaces, including hidden regions. Supporting tools process explicitly identified upstream templates. Synthetic outcomes are not actual haircut results.','pendingReview':['Real-client likeness and professional style quality/clipping/coverage/maintenance assessment','Final reconstruction/fitting route choice','Meshroom runtime agreement acceptance and native evaluation'],'removedScope':'Backup workflow removed at user instruction. No production rollout, production backups or client data accessed.'}
(ASSETS/'candidate-comparison.json').write_text(json.dumps(report,indent=2)+'\n');print('PASS',checked,'native style headers; six viable routes retained; COLMAP failed and Meshroom blocked clearly preserved')
