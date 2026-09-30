#!/usr/bin/env python3
"""Verify real native target application and reject a corrupted fit basis."""
import datetime
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import uuid

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts'))
from local_demo_http import LocalDemoAPI

os.umask(0o077)
api = LocalDemoAPI()
runtime = ROOT / '.scratch/private/runtime'
imports = json.loads((runtime / 'demo-asset-imports.json').read_text())
runs = json.loads((runtime / 'native-demo-imports.json').read_text())
results = []
for name, entries in runs.items():
    cid = imports['cases'][name]['clientId']; base = '/clients/' + cid
    assert api.expect(200, api.request(base + '/permission'), 'source permission')['status'] == 'active'
    job_id = entries['blender-mpfb:mpfb-metre-z-up-v2']['jobId']
    job = next(j for j in api.expect(200, api.request(base + '/demo-jobs'), 'retained corrected job') if j['id'] == job_id)
    assert job['status'] == 'completed' and job['result']['fit']['basisVersion'] == 'mpfb-metre-z-up-v2'
    check = job['result']['targetBasisCheck']
    assert check['passed'] and check['mappedVertices'] > 4000 and check['maximumErrorMetres'] <= .00001
    directory = runtime / 'processing' / cid / job_id
    prior = runtime / 'processing' / cid / entries['blender-mpfb']['jobId']
    before = json.loads((prior / 'fit.json').read_text())
    after = job['result']['fit']
    assert {r['view']: r['sourceSha256'] for r in before['views']} == {r['view']: r['sourceSha256'] for r in after['views']}
    options = api.expect(200, api.request(base + '/demo-options'), 'preserved prior options')
    assert any(o['id'] == entries['blender-mpfb']['optionId'] for o in options)
    assert any(o['id'] == entries['blender-mpfb:mpfb-metre-z-up-v2']['optionId'] for o in options)
    results.append({'fictionalCase': name, 'jobId': job_id, 'sameSixInputs': True, 'historicalOptionPreserved': True,
                    'actualNativeCheck': check, 'fit': after, 'resources': job['result']['resources'],
                    'retainedBytes': job['result']['retainedBytes'], 'elapsedMs': job['result']['elapsedMs']})
    if name == 'alex-ramos':
        source = directory
# Inject an error into the predicted basis only. The actual MPFB deformation
# remains unchanged, so its native evaluated mesh must expose this corruption.
fixture = ROOT / '.scratch/private/native-demos' / ('mpfb-basis-rejection-' + str(uuid.uuid4()))
fixture.mkdir()
for name in ['manifest.json', 'fit.json']:
    shutil.copyfile(source / name, fixture / name)
with np.load(source / 'basis.npz') as original:
    basis = {key: original[key].copy() for key in original.files}
index = int(np.flatnonzero(basis['mapping'] >= 0)[0]); basis['xyz'][index, 0] += .02
np.savez_compressed(fixture / 'basis.npz', **basis)
command = ['unshare', '--user', '--map-root-user', '--net', '--', 'blender', '--background', '--factory-startup', '--offline-mode',
           '--threads', '4', '--python-exit-code', '1', '--python', str(ROOT / 'scripts/native-demos/blender-mpfb.py'), '--', 'export', str(fixture)]
environment = dict(os.environ, BLENDER_USER_RESOURCES=str(ROOT / '.scratch/private/blender-resources'), OMP_NUM_THREADS='4', OPENBLAS_NUM_THREADS='4')
with (fixture / 'export.log').open('w') as output:
    rejected = subprocess.run(command, env=environment, stdout=output, stderr=subprocess.STDOUT, timeout=90)
check = json.loads((fixture / 'target-basis-check.json').read_text())
assert rejected.returncode != 0 and not check['passed'] and check['maximumErrorMetres'] > .019
assert not (fixture / 'head.glb').exists(), 'Invalid optimizer basis published a fitted head'
report = {'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'scope': 'Correct target prediction versus actual native MPFB application; shared six synthetic photos; no professional likeness claim.',
          'results': results, 'corruptionRejection': {'injectedOffsetMetres': .02, 'actualNativeCheck': check,
                                                    'exitCode': rejected.returncode, 'headPublished': False}}
(ROOT / '.scratch/execution-log/assets/mpfb-corrected-basis-verification.json').write_text(json.dumps(report, indent=2) + '\n')
print('PASS three actual native deformation checks, original photos and options preserved, corrupted prediction rejected before head export.')
