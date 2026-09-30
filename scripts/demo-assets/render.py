#!/usr/bin/env python3
"""Run asset rendering offline with a private Blender profile."""
import os
import datetime
import json
import resource
import time
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parents[2]
os.umask(0o077)
env = dict(os.environ, BLENDER_USER_RESOURCES=str(root/'.scratch/private/blender-resources'))
started=time.monotonic()
result=subprocess.run(['blender','--background','--factory-startup','--offline-mode',
                '--python-exit-code','1','--python',str(root/'scripts/demo-assets/blender-assets.py'),
                '--',*sys.argv[1:]],env=env)
usage=resource.getrusage(resource.RUSAGE_CHILDREN)
record={'date':datetime.datetime.now(datetime.timezone.utc).isoformat(),'arguments':sys.argv[1:],
        'seconds':round(time.monotonic()-started,3),'exitCode':result.returncode,
        'peakRssKiB':usage.ru_maxrss,'cpuSeconds':round(usage.ru_utime+usage.ru_stime,3),
        'settings':{'renderer':'Cycles CPU','samples':32,'resolution':[768,896],'offline':True},
        'retainedBytes':sum(p.stat().st_size for p in (root/'.scratch/private/demo-assets').rglob('*') if p.is_file())}
metrics=root/'.scratch/private/assets-work/render-metrics.jsonl'
metrics.parent.mkdir(parents=True,exist_ok=True)
with metrics.open('a') as output:output.write(json.dumps(record)+'\n')
print('RESOURCE_USE',json.dumps(record),flush=True)
if result.returncode:raise SystemExit(result.returncode)
