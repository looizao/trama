#!/usr/bin/env python3
"""Verify real COLMAP failure, private artifacts and cancellation with fixtures."""
import io
import json
from pathlib import Path
import sys
import time
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts'))
from local_demo_http import LocalDemoAPI, diagnostic_png
api = LocalDemoAPI()
check = api.expect
client = check(201, api.request('/clients', {'name': 'Disposable COLMAP Diagnostic', 'notes': 'Colored squares and seeded noise only, not portrait or accuracy evidence.'}), 'disposable COLMAP fixture')
cid = client['id']
base = '/clients/' + cid
try:
    check(403, api.request(base + '/demo-jobs', {'candidate': 'colmap', 'kind': 'reconstruct', 'minimumWidth': 512, 'photoSetId': ''}), 'COLMAP affirmative permission gate')
    link = check(201, api.request(base + '/permission-link', method='POST'), 'fixture permission link')
    notice = check(200, api.request(link['path'], anonymous=True), 'fixture permission notice')
    check(200, api.request(link['path'], {'name': client['name'], 'acknowledged': True, 'noticeVersion': notice['noticeVersion']}, anonymous=True), 'simulated affirmative fixture permission')
    capture = check(201, api.request(base + '/photo-sets', {'title': 'Diagnostic squares, not portrait coverage'}), 'diagnostic capture')
    views = {}
    def upload(view, data, expected=''):
        boundary = 'trama-colmap-test'
        body = b''
        for name, value in {'photoSetId': capture['id'], 'view': view, 'expectedAssetId': expected}.items():
            body += f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode()
        body += f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="diagnostic.png"\r\nContent-Type: image/png\r\n\r\n'.encode() + data + f'\r\n--{boundary}--\r\n'.encode()
        return check(201, api.request(base + '/assets', body=body, content_type='multipart/form-data; boundary=' + boundary), 'diagnostic upload ' + view)['id']
    for view in ['front', 'left-three-quarter', 'right-three-quarter', 'left-profile', 'right-profile', 'back']:
        views[view] = upload(view, diagnostic_png())
    payload = {'candidate': 'colmap', 'kind': 'reconstruct', 'photoSetId': capture['id'], 'photoViews': views, 'minimumWidth': 512, 'colmapPreset': 'standard'}
    check(400, api.request(base + '/demo-jobs', {**payload, 'colmapPreset': 'unsupported'}), 'invalid reconstruction preset rejected')
    failure = check(202, api.request(base + '/demo-jobs', payload), 'real zero-feature reconstruction')
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        result = next(j for j in api.request(base + '/demo-jobs')[1] if j['id'] == failure['id'])
        if result['status'] not in ('queued', 'running'):
            break
        time.sleep(.1)
    assert result['status'] == 'failed' and not result['result'].get('head')
    report = result['result']['reconstruction']
    assert len(report['features']) == 6 and all(f['features'] == 0 for f in report['features'])
    assert len(report['pairs']) == 15 and all(not t['models'] for t in report['trials'])
    prefix = base + '/demo-jobs/' + failure['id'] + '/artifacts/'
    check(404, api.request(prefix + 'head/model'), 'no fallback head after reconstruction failure')
    check(401, api.request(prefix + 'diagnostic/reconstruction', anonymous=True), 'anonymous diagnostics denied')
    check(404, api.request(prefix + 'diagnostic/colmap.db'), 'private database excluded from artifact allowlist')
    image = check(200, api.request(prefix + 'evaluation/matches'), 'actual verified-match graph')
    Image.open(io.BytesIO(image)).verify()
    check(200, api.request(prefix + 'diagnostic/reconstruction'), 'retained actual COLMAP report')
    state = {'candidate': 'colmap', 'photoSetId': capture['id'], 'photoViews': views, 'modelRunId': failure['id'], 'currentHairId': 'none', 'currentBeardId': 'clean-shaven', 'hairId': 'none', 'beardId': 'clean-shaven', 'minimumWidth': 512, 'camera': {'azimuth': 0, 'elevation': 0, 'distance': 1.3}}
    check(400, api.request(base + '/demo-workspace', {'state': state, 'version': 0}, 'PUT'), 'failed reconstruction cannot be saved as a fitted head')
    # A larger non-person texture keeps actual SIFT busy long enough to verify
    # erasure while its native stage is running. It is never a demo portrait.
    output = io.BytesIO()
    Image.fromarray(np.random.default_rng(42).integers(0, 256, (1280, 1280), dtype=np.uint8)).save(output, format='PNG')
    for view in views:
        views[view] = upload(view, output.getvalue(), views[view])
    live = check(202, api.request(base + '/demo-jobs', payload), 'real live SIFT cancellation experiment')
    directory = ROOT / '.scratch/private/runtime/processing' / cid / live['id']
    deadline = time.monotonic() + 10
    while time.monotonic() < deadline:
        current = next(j for j in api.request(base + '/demo-jobs')[1] if j['id'] == live['id'])
        if current['status'] == 'running' and (directory / 'colmap.log').exists() and 'Creating SIFT CPU feature extractor' in (directory / 'colmap.log').read_text():
            break
        time.sleep(.03)
    assert current['status'] == 'running' and (directory / 'colmap.log').exists() and 'Creating SIFT CPU feature extractor' in (directory / 'colmap.log').read_text(), 'Native SIFT process did not start'
    check(200, api.request('/assets/' + views['back'], {'confirmed': True}, 'DELETE'), 'erase back input during native reconstruction')
    time.sleep(.4)
    assert not directory.exists(), 'Native stage recreated erased output'
    cancelled = next(j for j in api.request(base + '/demo-jobs')[1] if j['id'] == live['id'])
    assert cancelled['status'] == 'cancelled' and cancelled['result'] == {}
    check(404, api.request(base + '/demo-jobs/' + live['id'] + '/artifacts/diagnostic/process'), 'cancelled native diagnostics inaccessible')
    check(200, api.request(base + '/withdraw', {'confirmed': True}), 'withdraw diagnostic client permission')
    check(403, api.request(prefix + 'diagnostic/reconstruction'), 'withdrawal denies earlier retained reconstruction')
    evidence = {'date': time.strftime('%Y-%m-%dT%H:%M:%S%z'), 'scope': 'Actual local COLMAP pipeline with disposable squares and random textures. Not portraits or likeness evidence.', 'realZeroFeatureFailure': True, 'allSixInputsAndFifteenPairsAttempted': True, 'threeSparseTrialsRetained': True, 'failedHeadSelectionRejected': True, 'anonymousAndPrivateDatabaseDenied': True, 'actualMatchGraphDecoded': True, 'backInputErasureKilledRunningNativeProcessing': True, 'cancelledResultEmpty': True, 'erasedDirectoryDidNotReappear': True, 'withdrawalDeniedRetainedArtifacts': True}
    (ROOT / '.scratch/execution-log/assets/colmap-live-verification.json').write_text(json.dumps(evidence, indent=2) + '\n')
finally:
    check(200, api.request(base, {'confirmed': True}, 'DELETE'), 'delete disposable COLMAP fixture')
print('PASS actual COLMAP failure, private retained artifacts, native cancellation and withdrawal.')
