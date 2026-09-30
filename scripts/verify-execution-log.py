#!/usr/bin/env python3
"""Decode requested log pictures and check actual portable local links."""
import argparse
import io
import json
from pathlib import Path
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('--base-url', default='http://127.0.0.1:8765/')
args = parser.parse_args()
base = urllib.parse.urlsplit(args.base_url)
if base.scheme != 'http' or base.hostname not in ['127.0.0.1', 'localhost', '::1']:
    parser.error('Use the local log server only')
root = Path(__file__).resolve().parents[1] / '.scratch/execution-log'
data = json.loads((root / 'assets/tasks.js').read_text().partition('=')[2].strip().removesuffix(';'))
links = {'index.html', 'assets/log.css', 'assets/log.js', 'assets/tasks.js'}
assert sum(t['status'] == 'in progress' for t in data['tasks']) <= 1
for task in data['tasks']:
    links.update(p['src'] for p in task['pictures'])
    links.update(o['href'] for o in task['outputs'] if not urllib.parse.urlsplit(o['href']).scheme and not o['href'].startswith('#'))
for candidate in data.get("comparison", {}).get("candidates", []):
    links.add(candidate["provenance"])
pictures = 0
for relative in sorted(links):
    path = (root / relative).resolve()
    assert path.is_relative_to(root.resolve()) and path.is_file(), relative
    with urllib.request.urlopen(urllib.parse.urljoin(args.base_url, relative), timeout=10) as response:
        payload = response.read()
        assert response.status == 200 and payload == path.read_bytes(), relative
    if path.suffix.lower() in ['.png', '.jpg', '.jpeg', '.webp']:
        with Image.open(io.BytesIO(payload)) as picture:
            picture.load()
        pictures += 1
    elif path.suffix.lower() == '.svg':
        ET.fromstring(payload)
        pictures += 1
print(json.dumps({'localLinkedResourcesHTTP200AndBytesEqual': len(links), 'decodedPictures': pictures, 'atMostOneTaskActive': True}))
