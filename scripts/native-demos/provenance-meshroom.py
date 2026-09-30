#!/usr/bin/env python3
"""Retain pinned Meshroom Python package licenses from their primary registry."""
import datetime
import hashlib
from importlib.metadata import distributions
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
records = []
for dist in sorted(distributions(), key=lambda d: d.metadata['Name'].lower()):
    name = dist.metadata['Name']
    primary = 'https://pypi.org/pypi/' + name + '/' + dist.version + '/json'
    registry = json.load(urllib.request.urlopen(primary, timeout=30))
    notices = []
    for file in dist.files or []:
        path = str(file)
        if 'dist-info' in path and any(token in path.lower() for token in ['license', 'notice', 'copying']):
            data = Path(dist.locate_file(file)).read_bytes()
            notices.append({'file': path, 'sha256': hashlib.sha256(data).hexdigest(), 'text': data.decode('utf-8', errors='replace')})
    records.append({'name': name, 'version': dist.version, 'creator': registry['info'].get('author'), 'primarySource': primary, 'sourceUrls': registry['info'].get('project_urls'), 'declaredLicense': dist.metadata.get('License-Expression', registry['info'].get('license')), 'notices': notices, 'distributionHashes': [{'filename': f['filename'], 'url': f['url'], 'sha256': f['digests']['sha256']} for f in registry['urls']]})
report = {'date': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'software': records, 'scope': 'Private CLI environment only. Core project licenses, native runtime terms, model licenses and input assets are recorded separately.', 'qtUse': 'Free LGPL-3.0 option for the dynamically loaded Qt/PySide CLI components; retain notices and allow replacement/debugging. Other bundled optional Qt components have their own notices. No proprietary Qt license selected and no Qt binaries distributed in Git.', 'modifications': 'Packages unmodified. Meshroom source and AliceVision node definitions are unmodified.', 'models': 'No learned model or vocabulary tree loaded by CLI help or prepared graph registration.'}
(ROOT / '.scratch/execution-log/assets/meshroom-python-provenance.json').write_text(json.dumps(report, indent=2) + '\n')
print('Retained primary registry metadata and installed notices for', len(records), 'pinned private packages.')
