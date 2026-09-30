#!/usr/bin/env python3
"""Verify separately accepted Open data, software references and shared assets."""
import datetime
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
os.umask(0o077)
source = ROOT / '.scratch/private/tools/flame-pytorch-source'
commit = '5a85f60a77f9e0454109e79de0a6517c4b95d371'
if not source.exists():
    subprocess.run(['git', 'clone', '--depth', '1', 'https://github.com/soubhiksanyal/FLAME_PyTorch.git', str(source)], check=True)
if subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip() != commit:
    raise SystemExit('Reference software checkout is not the retained pinned version')
if subprocess.check_output(['git', '-C', str(source), 'status', '--porcelain'], text=True).strip():
    raise SystemExit('Reference checkout has changes; refusing to replace existing work')
acquisition = json.loads((ROOT / '.scratch/execution-log/assets/flame-open-provenance.json').read_text())
assert acquisition['acceptance'].startswith('User explicitly accepted')
for record in acquisition['files']:
    file = ROOT / acquisition['privateDirectory'] / record['filename']
    assert file.stat().st_size == record['bytes'] and hashlib.sha256(file.read_bytes()).hexdigest() == record['sha256']
private_python = ROOT / '.scratch/private/native-demos/python/bin/python'
if Path(sys.executable).resolve() != private_python.resolve():
    raise SystemExit('Use the pinned private Python runtime from setup.py')
from flame import load_model, MODEL_SHA
model = load_model()
terms_url = 'https://flame.is.tue.mpg.de/modellicense.html'
terms = urllib.request.urlopen(terms_url, timeout=30).read().decode()
assert 'Open Model License' in terms and 'including commercial use' in terms
report = {
    'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'model': acquisition, 'exactModelSha256': MODEL_SHA,
    'load': {'vertices': len(model['v_template']), 'triangles': len(model['f']), 'identityComponents': 300, 'openExpressionComponents': 100, 'numericUnpicklerAllowlist': True},
    'implementation': {'name': 'Trama original neutral-rig NumPy FLAME fitting', 'license': 'GPL-3.0-or-later',
                       'sources': ['scripts/native-demos/flame.py', 'scripts/native-demos/fit-mpfb.py', 'scripts/native-demos/geometry.py', 'scripts/native-demos/procedural_styles.py'],
                       'equation': 'v = v_template + shapedirs[:,:,:300] @ identity coefficients. Zero expressions and rotations eliminate expression and pose terms; neutral linear blend skinning is identity because weights sum to one.',
                       'modifications': 'First 20 identity components are bounded to +/-2.5. The other 280 identity and 100 expression parameters, and all five joint poses, remain zero. Canonical coordinate conversion, actual crown recentering, procedural eye colors, shared hairstyle cage fitting and actual lower-face beard resampling are declared.',
                       'trainedModels': 'Only exact Open FLAME geometry and the separately documented Apache-2.0 MediaPipe image-plane detector. Detector depth is excluded.'},
    'referenceSoftware': {'name': 'FLAME_PyTorch', 'creator': 'Soubhik Sanyal', 'sourceUrl': 'https://github.com/soubhiksanyal/FLAME_PyTorch', 'commit': commit,
                          'rootLicense': (source / 'LICENSE').read_text(), 'fileHeader': (source / 'flame_pytorch/flame.py').read_text().split('import pickle')[0],
                          'usedForProcessing': False,
                          'limitation': 'Root MIT notice coexists with restrictive MPG file headers and a separately licensed SMPL-X import. Retained for inspection; none of its code, PyTorch, SMPL-X or RingNet embeddings execute in the local original NumPy route.'},
    'modelTerms': {'url': terms_url, 'retrievedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'sha256': hashlib.sha256(terms.encode()).hexdigest(),
                   'license': 'CC-BY-4.0 with additional published usage terms', 'fullPrimaryHtml': terms,
                   'acceptedByUser': True, 'attribution': 'Model creator, license links, citation and change notice included in app and exported GLB metadata.'},
    'dependencies': 'Pinned private Python 3.12.14 / NumPy 2.5.3 / Pillow 12.3.0 / MediaPipe 1.0.1. Full distribution notices and hashes in native-mpfb-provenance.json. No additional third-party code or weights required.',
    'assets': {'license': 'CC0-1.0 shared mannequin hairstyles and procedural beard meshes', 'primaryProvenance': 'makehuman-core-provenance.json', 'generationProvenance': 'asset-interchange-results.json', 'modifications': 'Actual neutral shared hairstyle GLBs adapted to the fitted Open head using an explicitly measured coarse radial cage; shared procedural beard definitions resampled on actual native skin. Derivative exports retain FLAME attribution and usage terms alongside the original CC0 style provenance.'},
    'textures': 'No academic FLAME texture space used. Clay skin and procedural native-eye material, plus the same verified CC0 style textures.',
    'limitations': ['Synthetic examples do not establish real-person fitting accuracy.', 'First-20-component fitting and neutral expression are this retained evaluation configuration; full 300-component expressivity and texture likeness are not claimed.', 'Radial style attachment requires clipping and professional review.'],
    'professionalAcceptance': 'pending'
}
(ROOT / '.scratch/execution-log/assets/flame-native-provenance.json').write_text(json.dumps(report, indent=2) + '\n')
print('Verified accepted exact Open model, pinned reference source, original local implementation and separate shared asset terms.')
