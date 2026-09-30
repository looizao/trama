#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Run retained native experiments. Called in a cancellable process group."""
import argparse,datetime,json,os,resource,subprocess,sys,time,ctypes,signal
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
# Prevent accidental online execution when this CLI is used directly. The app
# also creates an isolated process group and network namespace before starting it.
interfaces=[line.split(':',1)[0].strip() for line in Path('/proc/self/net/dev').read_text().splitlines() if ':' in line]
if any(interface!='lo' for interface in interfaces):
    os.execvp('unshare',['unshare','--user','--map-root-user','--net','--',sys.executable,str(Path(__file__).resolve()),*sys.argv[1:]])
# Parent-death signals cover both the API-owned runner and every native stage.
# Re-check the parent after registration to close the startup race.
parent_pid=int(os.environ.get('TRAMA_NATIVE_PARENT_PID',os.getppid()))
libc=ctypes.CDLL(None)
if libc.prctl(1,signal.SIGKILL)!=0:raise RuntimeError('Cannot register native parent-death protection')
if os.getppid()!=parent_pid:raise SystemExit('Native parent exited before processing started')
stage_parent=os.getpid()
def protect_stage():
    if ctypes.CDLL(None).prctl(1,signal.SIGKILL)!=0:os._exit(125)
    if os.getppid()!=stage_parent:os.kill(os.getpid(),signal.SIGKILL)
os.umask(0o077)
p=argparse.ArgumentParser();p.add_argument('candidate',choices=['blender-mpfb','colmap','makehuman','flame','open3d','meshlab','cloudcompare']);p.add_argument('directory',type=Path);args=p.parse_args();directory=args.directory.resolve()
manifest=json.loads((directory/'manifest.json').read_text())
manifest['candidate']=args.candidate
(directory/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
expected={'front','left-three-quarter','right-three-quarter','left-profile','right-profile','back'}
if len(manifest['inputs'])!=6 or {i['view'] for i in manifest['inputs']}!=expected:raise SystemExit('Exactly six labeled inputs required')
for item in manifest['inputs']:
    path=(directory/item['path']).resolve()
    if not path.is_relative_to(directory) or not path.is_file():raise SystemExit('Input outside private job directory or unavailable')
env=dict(os.environ,BLENDER_USER_RESOURCES=str(ROOT/'.scratch/private/blender-resources'),OMP_NUM_THREADS='4',OPENBLAS_NUM_THREADS='4')
metrics=[];started=time.monotonic()
def stage(name,command):
    (directory/'progress.json').write_text(json.dumps({'stage':name,'percent':{'prepare':5,'fit':40,'export':60,'silhouette':90,'colmap':5,'open3d':5,'meshlab':5,'cloudcompare':5}[name]}))
    before=resource.getrusage(resource.RUSAGE_CHILDREN);start=time.monotonic()
    with (directory/(name+'.log')).open('w') as output:
        result=subprocess.run(command,env=env,stdout=output,stderr=subprocess.STDOUT,preexec_fn=protect_stage)
    after=resource.getrusage(resource.RUSAGE_CHILDREN)
    metrics.append({'stage':name,'seconds':round(time.monotonic()-start,3),'cpuSeconds':round(after.ru_utime+after.ru_stime-before.ru_utime-before.ru_stime,3),'peakRssKiB':after.ru_maxrss,'exitCode':result.returncode,'command':command})
    (directory/'resources.json').write_text(json.dumps(metrics,indent=2))
    print('STAGE',json.dumps(metrics[-1]),flush=True)
    if result.returncode:raise RuntimeError(f'{name} failed with exit {result.returncode}; retained diagnostic log')
blender=['blender','--background','--factory-startup','--offline-mode','--threads','4','--python-exit-code','1','--python',str(ROOT/'scripts/native-demos/blender-mpfb.py'),'--']
try:
    if args.candidate=='colmap':
        stage('colmap',[sys.executable,str(ROOT/'scripts/native-demos/colmap.py'),str(directory)])
        report=json.loads((directory/'colmap-report.json').read_text())
        files=[{'path':str(f.relative_to(directory)),'bytes':f.stat().st_size} for f in directory.rglob('*') if f.is_file()]
        report['retainedBytes']=sum(f['bytes'] for f in files)
        report['artifacts']=files
        (directory/'colmap-report.json').write_text(json.dumps(report,indent=2)+'\n')
        raise RuntimeError('Six-photo COLMAP experiment did not produce a complete editable head with independent compatible styles. See actual reconstruction report; no fallback used.')
    if args.candidate in ['open3d','meshlab','cloudcompare']:
        stage(args.candidate,[sys.executable,str(ROOT/('scripts/native-demos/process-'+args.candidate+'.py')),str(directory)])
        component=json.loads((directory/'component-report.json').read_text())
        files=[{'path':str(f.relative_to(directory)),'bytes':f.stat().st_size} for f in directory.rglob('*') if f.is_file()]
        report={'candidate':args.candidate,'kind':'process','geometry':component['geometry'],'scope':args.candidate+' supporting processing of identified upstream fitted geometry. Native processing report only; explored refinements and expected selections are retained separately in the consultation journey. Professional review remains pending.','component':component,'resources':metrics,'resourceMeasurement':'Wall and CPU seconds are per stage. Peak RSS is the cumulative maximum child-process RSS through that stage.','elapsedMs':round((time.monotonic()-started)*1000),'completedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'artifacts':files,'retainedBytes':sum(f['bytes'] for f in files),'head':'head.glb','hair':{f.stem:str(f.relative_to(directory)) for f in (directory/'hair').glob('*.glb')},'beard':{f.stem:str(f.relative_to(directory)) for f in (directory/'beard').glob('*.glb')}}
        (directory/'result.json').write_text(json.dumps(report,indent=2)+'\n');print('EXPERIMENT_COMPLETE',json.dumps({'elapsedMs':report['elapsedMs'],'retainedBytes':report['retainedBytes']}),flush=True)
        raise SystemExit(0)
    fitter=[sys.executable,str(ROOT/('scripts/native-demos/'+args.candidate+'.py'))] if args.candidate in ['makehuman','flame'] else blender
    stage('prepare',fitter+['prepare',str(directory)])
    stage('fit',[str(ROOT/'.scratch/private/native-demos/python/bin/python'),str(ROOT/'scripts/native-demos/fit-mpfb.py'),str(directory)])
    stage('export',fitter+['export',str(directory)])
    stage('silhouette',[sys.executable,str(ROOT/'scripts/native-demos/evaluate-silhouettes.py'),str(directory)])
    fit=json.loads((directory/'fit.json').read_text())
    files=[{'path':str(f.relative_to(directory)),'bytes':f.stat().st_size} for f in directory.rglob('*') if f.is_file()]
    report={'candidate':args.candidate,'kind':'fit','geometry':fit['geometry'],'scope':'Six-view '+args.candidate+' fitting experiment. Native processing report only; explored refinements and expected selections are retained separately in the consultation journey. Professional review remains pending.','fit':fit,'resources':metrics,'resourceMeasurement':'Wall and CPU seconds are per stage. Peak RSS is the cumulative maximum child-process RSS through that stage, not isolated stage memory.','elapsedMs':round((time.monotonic()-started)*1000),'completedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'artifacts':files,'retainedBytes':sum(f['bytes'] for f in files),'head':'head.glb','hair':{f.stem:str(f.relative_to(directory)) for f in (directory/'hair').glob('*.glb')},'beard':{f.stem:str(f.relative_to(directory)) for f in (directory/'beard').glob('*.glb')}}
    if args.candidate=='makehuman':report['nativeShape']=json.loads((directory/'makehuman-shape.json').read_text())
    if args.candidate=='flame':
        report['nativeShape']=json.loads((directory/'flame-shape.json').read_text())
        report['styleAdaptation']=json.loads((directory/'flame-style-adaptation.json').read_text())
        report['provenance']=json.loads((directory/'flame-attribution.json').read_text())
    report['targetBasisCheck']=json.loads((directory/'target-basis-check.json').read_text())
    report['silhouette']=json.loads((directory/'silhouette-report.json').read_text())
    (directory/'result.json').write_text(json.dumps(report,indent=2)+'\n');print('EXPERIMENT_COMPLETE',json.dumps({'elapsedMs':report['elapsedMs'],'retainedBytes':report['retainedBytes']}),flush=True)
except Exception as e:
    (directory/'failure.json').write_text(json.dumps({'error':str(e),'resources':metrics,'resourceMeasurement':'Wall and CPU seconds are per stage. Peak RSS is the cumulative maximum child-process RSS through that stage, not isolated stage memory.','elapsedMs':round((time.monotonic()-started)*1000)},indent=2));raise
