#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Run actual supporting processing on retained authorized native case fits."""
import argparse
import json
import os
from pathlib import Path
import sys
import time
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'scripts'))
from local_demo_http import LocalDemoAPI
os.umask(0o077)
p=argparse.ArgumentParser();p.add_argument('candidate',choices=['open3d','meshlab','cloudcompare']);p.add_argument('--attempt',default='initial');p.add_argument('--upstream',choices=['blender-mpfb','makehuman','flame'],default='makehuman');p.add_argument('--reference',choices=['blender-mpfb','makehuman','flame']);p.add_argument('--source-style-version',choices=['makehuman-visible-lips-v2'],default='');args=p.parse_args();assert not args.reference or (args.candidate=='cloudcompare' and args.reference!=args.upstream)
if args.source_style_version and args.upstream!='makehuman':p.error('Visible-lip attachment belongs to the primary standalone MakeHuman fit')
versions={'blender-mpfb':'mpfb-metre-z-up-v2','makehuman':'makehuman-metre-z-up-v2','flame':'flame-2023-open-neutral-rig-v4'}
api=LocalDemoAPI();check=api.expect;runtime=ROOT/'.scratch/private/runtime'
imports=json.loads((runtime/'demo-asset-imports.json').read_text());native=json.loads((runtime/'native-demo-imports.json').read_text());profiles=json.loads((ROOT/'scripts/demo-assets/cases.json').read_text())
checkpoint=runtime/'component-demo-imports.json';known=json.loads(checkpoint.read_text()) if checkpoint.exists() else {};summary=[]
def retain():
 tmp=checkpoint.with_suffix('.tmp');tmp.write_text(json.dumps(known,indent=2));tmp.chmod(0o600);tmp.replace(checkpoint)
for profile in profiles:
 cid=imports['cases'][profile['id']]['clientId'];base='/clients/'+cid
 assert check(200,api.request(base+'/permission'),'permission')['status']=='active','Refuse processing after withdrawal'
 jobs=check(200,api.request(base+'/demo-jobs'),'existing native experiments')
 source_key=args.upstream+':'+versions[args.upstream]+(':'+args.source_style_version if args.source_style_version else '')
 source_id=native[profile['id']][source_key]['jobId'];parent=next((j for j in jobs if j['id']==source_id),None)
 assert parent and parent['status']=='completed' and parent['result'].get('head'),'Known upstream removed or failed; never recreate it'
 if args.source_style_version:assert parent['result'].get('nativeShape',{}).get('styleAttachment',{}).get('version')==args.source_style_version,'Primary source uses an incompatible attachment version'
 component_version={'open3d':'open3d-cpu-upstream-v5','meshlab':'meshlab-native-upstream-v1','cloudcompare':'cloudcompare-native-upstream-v2'}[args.candidate]
 key=args.candidate+':'+args.upstream+':'+component_version+':'+args.attempt+(':'+args.reference if args.reference else '')+(':'+args.source_style_version if args.source_style_version else '');entry=known.setdefault(profile['id'],{}).setdefault(key,{})
 if entry.get('jobId'):
  job=next((j for j in jobs if j['id']==entry['jobId']),None)
  assert job and job['status']!='cancelled','Known component output removed; never recreate it'
 else:
  component={'sourceRunId':source_id,'triangleRatio':.75,'voxelSize':.003,'samplePoints':12000}
  if args.reference:
   reference_id=native[profile['id']][args.reference+':'+versions[args.reference]]['jobId'];reference=next((j for j in jobs if j['id']==reference_id),None)
   assert reference and reference['status']=='completed' and all(reference['photoViews'][v]==parent['photoViews'][v] for v in ['front','left-three-quarter','right-three-quarter','left-profile','right-profile','back']),'Reference removed or different input snapshot; refuse recreation'
   component['referenceRunId']=reference_id
  job=check(202,api.request(base+'/demo-jobs',{'candidate':args.candidate,'kind':'process','photoSetId':parent['photoSetId'],'photoViews':parent['photoViews'],'minimumWidth':512,'native':parent['settings']['native'],'component':component}),'queue actual supporting processing')
  entry['jobId']=job['id'];retain()
 deadline=time.monotonic()+310
 while job['status'] in ['queued','running'] and time.monotonic()<deadline:
  time.sleep(1);job=next(j for j in api.request(base+'/demo-jobs')[1] if j['id']==entry['jobId'])
 item={'fictionalCase':profile['id'],'candidate':args.candidate,'upstreamCandidate':args.upstream,'upstreamJobId':source_id,'jobId':job['id'],'status':job['status'],'error':job['error'],'result':job['result'],'expectedResultSelection':'pending','professionalAssessment':'pending'}
 if job['status']=='completed':
  state={'candidate':args.candidate,'photoSetId':job['photoSetId'],'photoViews':job['photoViews'],'modelRunId':job['id'],'currentHairId':profile['current']['hair'],'currentBeardId':profile['current']['beard'],'hairId':profile['proposal']['hair'],'beardId':profile['proposal']['beard'],'camera':{'azimuth':0,'elevation':.08,'distance':1.3},'minimumWidth':512,'native':job['settings']['native'],'component':job['settings']['component']}
  options=check(200,api.request(base+'/demo-options'),'retained options')
  if entry.get('optionId'):assert any(o['id']==entry['optionId'] for o in options),'Known option removed; never recreate it'
  else:
   option=check(201,api.request(base+'/demo-options',{'title':profile['name']+' / '+args.candidate+' supporting '+args.upstream+' / synthetic exploration','state':state}),'save native supporting option');entry['optionId']=option['id'];retain()
 summary.append(item);print('COMPONENT_CASE',json.dumps({k:item[k] for k in ['fictionalCase','jobId','status','error']}),flush=True)
report={'date':time.strftime('%Y-%m-%dT%H:%M:%S%z'),'scope':'Real supporting processing of identified fitted heads and unchanged six-photo inputs. No raw-photo reconstruction attributed to component, no measured scan or real likeness proof. Full editing/expected-result journeys and professional review remain pending.','results':summary}
suffix='-'+args.source_style_version if args.source_style_version else ''
(ROOT/'.scratch/execution-log/assets'/f'{args.candidate}-{args.upstream}-populated-results{suffix}.json').write_text(json.dumps(report,indent=2)+'\n')
assert all(i['status']=='completed' for i in summary),'Actual component failure retained; inspect diagnostics before retry'
