#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Acquire the official CPU-only Open3D release, with separate license records."""
import datetime
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import urllib.request
from importlib.metadata import distributions

ROOT = Path(__file__).resolve().parents[2]
os.umask(0o077)
python = ROOT / '.scratch/private/native-demos/python/bin/python'
if Path(sys.executable).resolve() != python.resolve():
    raise SystemExit('Use the pinned private Python 3.12 runtime')
registry_url = 'https://pypi.org/pypi/open3d-cpu/0.20.0/json'
registry = json.load(urllib.request.urlopen(registry_url, timeout=30))
filename = 'open3d_cpu-0.20.0-cp312-cp312-manylinux_2_35_x86_64.whl'
expected = 'cee9c7686a794de792070f029f8b81913aff1269154ee43de9cc4af72fa5e087'
record = next(x for x in registry['urls'] if x['filename'] == filename)
assert record['digests']['sha256'] == expected
wheel = ROOT / '.scratch/private/native-demos/downloads' / filename
wheel.parent.mkdir(parents=True, exist_ok=True)
if not wheel.exists():
    with urllib.request.urlopen(record['url'], timeout=120) as response:
        wheel.write_bytes(response.read())
assert hashlib.sha256(wheel.read_bytes()).hexdigest() == expected
uv = str(Path.home() / '.local/bin/uv')
requirements = ROOT / 'scripts/native-demos/requirements-open3d.txt'
if not requirements.exists():
    seed = wheel.parent / 'open3d-requirements.in'
    seed.write_text((ROOT / 'scripts/native-demos/requirements.txt').read_text() + '\npycolmap==4.2.1\nopen3d-cpu==0.20.0\n')
    subprocess.run([uv, 'pip', 'compile', '--python', str(python), '--no-header', '--no-annotate', str(seed), '-o', str(requirements)], check=True)
subprocess.run([uv, 'pip', 'install', '--python', str(python), '-r', str(requirements)], check=True)
import open3d as o3d
assert o3d.__version__ == '0.20.0' and not o3d._build_config['BUILD_CUDA_MODULE']
o3d.utility.set_max_threads(4)
license_url = 'https://raw.githubusercontent.com/isl-org/Open3D/v0.20.0/LICENSE'
license_text = urllib.request.urlopen(license_url, timeout=30).read().decode()
assert 'Permission is hereby granted, free of charge' in license_text
software = []
for dist in sorted(distributions(), key=lambda d: d.metadata['Name'].lower()):
    name = dist.metadata['Name']; version = dist.version
    primary = f'https://pypi.org/pypi/{name}/{version}/json'
    info = json.load(urllib.request.urlopen(primary, timeout=30))
    notices = []
    for file in dist.files or []:
        if any(term in str(file).lower() for term in ['license', 'copying', 'notice']) and ('dist-info' in str(file) or name == 'open3d-cpu'):
            data = Path(dist.locate_file(file)).read_bytes()
            notices.append({'file': str(file), 'sha256': hashlib.sha256(data).hexdigest(), 'text': data.decode(errors='replace')})
    license_name=dist.metadata.get('License-Expression') or info['info'].get('license')
    if not license_name:
        license_name={'blinker':'MIT','ipython_pygments_lexers':'BSD-3-Clause','itsdangerous':'BSD-3-Clause','Jinja2':'BSD-3-Clause','prompt_toolkit':'BSD-3-Clause','ptyprocess':'ISC','wcwidth':'MIT'}.get(name)
        if not license_name: raise RuntimeError('Missing separately verified software license: '+name)
    software.append({'name': name, 'version': version, 'creator': info['info'].get('author'), 'sourceUrls': info['info'].get('project_urls'), 'primarySource': primary, 'license': license_name, 'notices': notices, 'distributionHashes': [{'filename': x['filename'], 'sha256': x['digests']['sha256'], 'url': x['url']} for x in info['urls']]})
report = {'acquiredAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'software': software, 'open3d': {'version': o3d.__version__, 'creator': 'Open3D authors / Intel', 'license': 'MIT', 'licenseUrl': license_url, 'licenseText': license_text, 'registry': registry_url, 'distribution': {'filename': filename, 'sha256': expected, 'bytes': wheel.stat().st_size, 'url': record['url']}, 'buildConfig': o3d._build_config, 'modifications': 'Official wheel unmodified. Original processing wrapper GPL-3.0-or-later.', 'attributionRequirements': 'Preserve the MIT copyright and permission notice when redistributing software. Academic citation: Zhou, Park and Koltun, Open3D: A Modern Library for 3D Data Processing (2018), arXiv:1801.09847.'},
          'models': 'No reconstruction or learned model acquired by this setup. This supporting component requires a retained native fitted head and its six authorized photo dependencies.',
          'assets': 'Same shared assets, adapted upstream. CC0 sources documented separately in makehuman-core-provenance.json; any FLAME-derived input retains its accepted model terms and attribution.',
          'processingPrivacy': 'CPU-only build: no CUDA runtime or ML extra acquired. Every actual geometry-processing stage uses a private network namespace. Python web/notebook dependencies bundled by the official package are not launched as servers.',
          'professionalAcceptance': 'pending'}
(ROOT / '.scratch/execution-log/assets/open3d-provenance.json').write_text(json.dumps(report, indent=2) + '\n')
print('Verified CPU-only Open3D 0.20.0, official wheel hash and', len(software), 'separate software license records.')
