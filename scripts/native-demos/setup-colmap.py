#!/usr/bin/env python3
"""Acquire only the official CPU wheel and retain its exact license metadata."""
import datetime
import hashlib
from importlib.metadata import distribution
import json
import os
from pathlib import Path
import subprocess
import sys
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
os.umask(0o077)
python = ROOT / '.scratch/private/native-demos/python/bin/python'
if Path(sys.executable).resolve() != python.resolve():
    raise SystemExit('Run with the pinned private Python environment created by setup.py')
subprocess.run([str(Path.home() / '.local/bin/uv'), 'pip', 'install', '--python', str(python), '-r', str(ROOT / 'scripts/native-demos/requirements-colmap.txt')], check=True)
subprocess.run(['unshare', '--user', '--map-root-user', '--net', '--', '/bin/true'], check=True)
dist = distribution('pycolmap')
registry_url = 'https://pypi.org/pypi/pycolmap/4.2.1/json'
registry = json.load(urllib.request.urlopen(registry_url, timeout=30))
notices = []
for file in dist.files or []:
    if 'dist-info' in str(file) and 'copying' in str(file).lower():
        data = Path(dist.locate_file(file)).read_bytes()
        notices.append({'file': str(file), 'sha256': hashlib.sha256(data).hexdigest(), 'text': data.decode()})
report = {'acquiredAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'software': {'name': 'COLMAP / PyCOLMAP', 'version': dist.version, 'creator': registry['info']['author'], 'license': 'BSD-3-Clause', 'licenseSource': 'https://github.com/colmap/colmap/blob/4.2.1/COPYING.txt', 'primaryRegistry': registry_url, 'officialInstallation': 'https://colmap.github.io/pycolmap/index.html', 'notices': notices, 'distributionHashes': [{'filename': x['filename'], 'url': x['url'], 'sha256': x['digests']['sha256']} for x in registry['urls']]}, 'models': 'No learned reconstruction model used. Native SIFT features and geometric mapping only.', 'assets': 'Existing fictional six-view photos and shared style meshes have separate CC0/procedural provenance in makehuman-core-provenance.json. No additional licensed images acquired.', 'dependencies': 'Uses the pinned NumPy and Pillow software already documented separately in native-mpfb-provenance.json. The CPU wheel is installed privately. CUDA runtime, learned matchers and paid services are not installed by this setup.', 'attributionRequirements': 'Retain BSD copyright, conditions and disclaimer with redistributed software. Do not imply endorsement. Package is unmodified; local experiment wrapper is GPL-3.0-or-later.', 'processingPrivacy': 'Acquisition is online; image processing is separately isolated using a kernel network namespace and private local storage.'}
(ROOT / '.scratch/execution-log/assets/colmap-provenance.json').write_text(json.dumps(report, indent=2) + '\n')
print('Pinned PyCOLMAP CPU wheel, BSD notice and distribution hashes retained.')
