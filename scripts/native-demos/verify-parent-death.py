#!/usr/bin/env python3
"""Verify native stages terminate when their launcher dies unexpectedly."""
import argparse,json,os,shutil,signal,subprocess,sys,tempfile,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
if '--launcher' in sys.argv:
    directory=Path(sys.argv[-1]);env=dict(os.environ,TRAMA_NATIVE_PARENT_PID=str(os.getpid()))
    child=subprocess.Popen([str(ROOT/'.scratch/private/native-demos/python/bin/python'),str(ROOT/'scripts/native-demos/run.py'),'blender-mpfb',str(directory)],env=env,stdout=(directory/'launcher.log').open('w'),stderr=subprocess.STDOUT)
    (directory/'runner-pid.json').write_text(json.dumps({'pid':child.pid}));child.wait();raise SystemExit()
os.umask(0o077)
d=Path(tempfile.mkdtemp(prefix='parent-death-',dir=ROOT/'.scratch/private/native-demos'));(d/'inputs').mkdir()
source=ROOT/'.scratch/private/native-demos/experiments/mpfb-alex-six'
manifest=json.loads((source/'manifest.json').read_text())
for item in manifest['inputs']:shutil.copyfile(source/item['path'],d/item['path'])
(d/'manifest.json').write_text(json.dumps(manifest))
launcher=subprocess.Popen([sys.executable,__file__,'--launcher',str(d)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
def alive(pid):
    try:return (Path('/proc')/str(pid)/'stat').read_text().split()[2]!='Z'
    except FileNotFoundError:return False
try:
    deadline=time.monotonic()+12;runner=None;stage=None
    while time.monotonic()<deadline:
        if (d/'runner-pid.json').exists():runner=json.loads((d/'runner-pid.json').read_text())['pid']
        if runner:
            try:
                children=(Path('/proc')/str(runner)/'task'/str(runner)/'children').read_text().split()
                if children:stage=int(children[0]);break
            except FileNotFoundError:pass
        time.sleep(.02)
    assert runner and stage,'Actual native stage did not start'
    launcher.kill();launcher.wait()
    deadline=time.monotonic()+4
    while time.monotonic()<deadline and (alive(runner) or alive(stage)):time.sleep(.02)
    assert not alive(runner) and not alive(stage),'Orphaned native processing survived launcher death'
    evidence={'launcherAbruptlyTerminated':True,'nativeRunnerTerminated':True,'blenderStageTerminated':True,'scope':'Actual MPFB native runner and Blender process; synthetic diagnostic copy only. No app/client state changed.','date':time.strftime('%Y-%m-%dT%H:%M:%S%z')}
    (ROOT/'.scratch/execution-log/assets/mpfb-parent-death-check.json').write_text(json.dumps(evidence,indent=2)+'\n');print('PASS launcher hard kill also terminates the native runner and Blender stage.')
finally:
    if launcher.poll() is None:launcher.kill();launcher.wait()
    for pid in [runner,stage]:
        if pid and alive(pid):os.kill(pid,signal.SIGKILL)
    shutil.rmtree(d)
