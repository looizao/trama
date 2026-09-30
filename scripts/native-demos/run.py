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
p=argparse.ArgumentParser();p.add_argument('candidate',choices=['blender-mpfb']);p.add_argument('directory',type=Path);args=p.parse_args();directory=args.directory.resolve()
manifest=json.loads((directory/'manifest.json').read_text())
expected={'front','left-three-quarter','right-three-quarter','left-profile','right-profile','back'}
if len(manifest['inputs'])!=6 or {i['view'] for i in manifest['inputs']}!=expected:raise SystemExit('Exactly six labeled inputs required')
for item in manifest['inputs']:
    path=(directory/item['path']).resolve()
    if not path.is_relative_to(directory) or not path.is_file():raise SystemExit('Input outside private job directory or unavailable')
env=dict(os.environ,BLENDER_USER_RESOURCES=str(ROOT/'.scratch/private/blender-resources'),OMP_NUM_THREADS='4',OPENBLAS_NUM_THREADS='4')
metrics=[];started=time.monotonic()
def stage(name,command):
    (directory/'progress.json').write_text(json.dumps({'stage':name,'percent':{'prepare':5,'fit':40,'export':60}[name]}))
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
    stage('prepare',blender+['prepare',str(directory)])
    stage('fit',[str(ROOT/'.scratch/private/native-demos/python/bin/python'),str(ROOT/'scripts/native-demos/fit-mpfb.py'),str(directory)])
    stage('export',blender+['export',str(directory)])
    fit=json.loads((directory/'fit.json').read_text())
    files=[{'path':str(f.relative_to(directory)),'bytes':f.stat().st_size} for f in directory.rglob('*') if f.is_file()]
    report={'candidate':args.candidate,'kind':'fit','geometry':fit['geometry'],'scope':'Six-view MPFB fitting experiment. Full refinement and expected-result journey remain pending.','fit':fit,'resources':metrics,'resourceMeasurement':'Wall and CPU seconds are per stage. Peak RSS is the cumulative maximum child-process RSS through that stage, not isolated stage memory.','elapsedMs':round((time.monotonic()-started)*1000),'completedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'artifacts':files,'retainedBytes':sum(f['bytes'] for f in files),'head':'head.glb','hair':{f.stem:str(f.relative_to(directory)) for f in (directory/'hair').glob('*.glb')},'beard':{f.stem:str(f.relative_to(directory)) for f in (directory/'beard').glob('*.glb')}}
    (directory/'result.json').write_text(json.dumps(report,indent=2)+'\n');print('EXPERIMENT_COMPLETE',json.dumps({'elapsedMs':report['elapsedMs'],'retainedBytes':report['retainedBytes']}),flush=True)
except Exception as e:
    (directory/'failure.json').write_text(json.dumps({'error':str(e),'resources':metrics,'resourceMeasurement':'Wall and CPU seconds are per stage. Peak RSS is the cumulative maximum child-process RSS through that stage, not isolated stage memory.','elapsedMs':round((time.monotonic()-started)*1000)},indent=2));raise
