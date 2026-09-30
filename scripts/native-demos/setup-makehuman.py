#!/usr/bin/env python3
"""Pin standalone MakeHuman source and verify separately licensed core data."""
import datetime
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
os.umask(0o077)
source = ROOT / '.scratch/private/tools/makehuman-source'
commit = '1f508f6083b2f823dab15de924b3bde72e08d77c'
url = 'https://github.com/makehumancommunity/makehuman.git'
if not source.exists():
    subprocess.run(['git', 'clone', '--depth', '1', '--branch', 'v1.3.0', url, str(source)], check=True)
actual = subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip()
if actual != commit or subprocess.check_output(['git', '-C', str(source), 'status', '--porcelain'], text=True).strip():
    raise SystemExit('Pinned MakeHuman source differs or has local edits; refusing to replace it')
private_python = ROOT / '.scratch/private/native-demos/python/bin/python'
if Path(sys.executable).resolve() != private_python.resolve():
    raise SystemExit('Use the pinned private Python environment from setup.py')
data = ROOT / '.scratch/private/tools/mpfb2/src/mpfb/data'
if not (data / '3dobjs/base.obj').is_file():
    raise SystemExit('Run the CC0 shared asset acquisition before standalone MakeHuman setup')
notices = []
for name in ['license.txt', 'LICENSE.CODE.md', 'LICENSE.ASSETS.md']:
    path = source / 'makehuman' / name if name == 'license.txt' else source / name
    content = path.read_bytes()
    notices.append({'file': name, 'sha256': hashlib.sha256(content).hexdigest(), 'text': content.decode()})
subprocess.run(['unshare', '--user', '--map-root-user', '--net', '--', '/bin/true'], check=True)
report = {
    'acquiredAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'software': {'name': 'Standalone MakeHuman', 'version': '1.3.0', 'sourceCommit': commit,
                 'creator': 'MakeHuman Community', 'sourceUrl': url, 'releaseUrl': 'https://github.com/makehumancommunity/makehuman/releases/tag/v1.3.0',
                 'license': 'AGPL-3.0-or-later', 'licenseUrl': 'https://static.makehumancommunity.org/about/license.html',
                 'notices': notices, 'modifications': 'Upstream checkout is unmodified. The headless adapter makehuman.py is supplied under AGPL-3.0-or-later.'},
    'assets': {'license': 'CC0-1.0', 'creator': 'MakeHuman Community and credited core asset creators',
               'sourceUrl': 'https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html',
               'geometryAndTargets': 'Existing pinned CC0 core data from MPFB 2.0.17, loaded by native MakeHuman APIs. No MPFB or Blender code is executed.',
               'baseSha256': hashlib.sha256((data / '3dobjs/base.obj').read_bytes()).hexdigest(),
               'fullAssetProvenance': 'makehuman-core-provenance.json',
               'modifications': ['Bounded head target fitting', 'Head-only extraction and GLB export', 'Native MHCLO hair refitting', 'Shared procedural beard and coil definitions resampled on the fitted surface'],
               'attribution': 'CC0 has no attribution requirement; provenance is retained voluntarily.',
               'outputRights': 'The upstream license expressly permits arbitrary use of generated assets, scripted output and renderings; software terms remain separate.'},
    'models': 'Same separately documented Apache-2.0 MediaPipe FaceLandmarker model as the MPFB experiment. No additional model acquired. Entire head is a fitted template, not observed 3D geometry.',
    'dependencies': 'Existing pinned Python 3.12.14, NumPy 2.5.3, Pillow 12.3.0 and MediaPipe 1.0.1. Exact distribution hashes and full notices are retained in native-mpfb-provenance.json. MakeHuman core runs without Qt, OpenGL, a GUI or Blender.',
    'processingPrivacy': 'Actual image processing runs in a kernel network namespace with no external network interfaces. MH_HOME_LOCATION points inside the private job, leaving the normal user configuration untouched.',
    'professionalAssessment': 'Pending. Software licensing and technical checks do not establish likeness or professional suitability.'
}
(ROOT / '.scratch/execution-log/assets/makehuman-provenance.json').write_text(json.dumps(report, indent=2) + '\n')
print('Pinned unmodified MakeHuman core, AGPL code and separate CC0 output terms verified.')
