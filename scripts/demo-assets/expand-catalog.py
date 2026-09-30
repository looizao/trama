#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Create original CC0 style meshes and real matched mannequin renders privately."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import resource
import sys
import time
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts/native-demos'))
from catalog_styles import VERSION, definitions, hair_meshes, beard_meshes
from flame import read_shared_glb
from geometry import camera, export, render
from PIL import Image, ImageDraw

os.umask(0o077)
parser = argparse.ArgumentParser()
parser.add_argument('--representative-only', action='store_true')
args = parser.parse_args()
source = ROOT / '.scratch/private/demo-assets'
out = ROOT / '.scratch/private/catalog-expansion'
out.mkdir(parents=True, exist_ok=True)
(out / 'textures').mkdir(exist_ok=True)
head = read_shared_glb(source / 'neutral-head.glb', out / 'textures')
skin = next(m for m in head if 'head' in m['name'].lower())
# Recorded actual MPFB visible lip group mean from the shared neutral mannequin,
# not the rig mouth joint. Fitted exports use their own actual lip correspondences.
mouth_z = .009534768760204315
provenance = {'creator': 'Trama original procedural asset generator', 'license': 'CC0-1.0',
              'licenseVersion': '1.0', 'licenseUrl': 'https://creativecommons.org/publicdomain/zero/1.0/',
              'sourceUrl': 'local:scripts/native-demos/catalog_styles.py', 'acquisitionDate': datetime.now(timezone.utc).date().isoformat(),
              'sourceDependency': 'CC0 MakeHuman/MPFB shared skin topology, normalized metres',
              'dependencyProvenance': 'assets/makehuman-core-provenance.json',
              'attributionRequirement': 'None for CC0 generated geometry; underlying software licenses remain separate.',
              'software': 'Original GPL-3.0-or-later Python/NumPy geometry code; generated output separately dedicated to CC0-1.0.',
              'generationVersion': VERSION, 'professionalAcceptance': 'pending',
              'modifications': ['Deterministic actual surface root sampling', 'Continuous scalp coverage mesh',
                                'Independent solid strand geometry', 'Normalized metre GLB export', 'Matched four-angle native renders']}
hair, beard = definitions()
if args.representative_only:
    hair = [s for s in hair if s['id'] in ['trama-buzz-straight', 'trama-quiff-wavy', 'trama-shag-curly', 'trama-long-coily']]
    beard = [s for s in beard if s['id'] in ['trama-short-boxed', 'trama-circle', 'trama-moustache', 'trama-long-curly']]
started = time.monotonic(); entries = []
for kind, styles in [('hair', hair), ('beard', beard)]:
    directory = out / kind; directory.mkdir(exist_ok=True)
    for style in styles:
        beginning = time.monotonic()
        meshes = hair_meshes(skin, style['recipe'], style['id']) if kind == 'hair' else beard_meshes(skin, mouth_z, style['recipe'], style['id'])
        meshes[0]['provenance'] = provenance
        path = directory / (style['id'] + '.glb'); export(path, meshes)
        views = []
        for view, yaw in [('front', 0), ('three-quarter', 45), ('profile', 90), ('back', 180)]:
            destination = directory / (style['id'] + '-' + view + '.png')
            render(destination, head + meshes, camera(yaw, {'focalLength': 70, 'cameraDistance': 1.6, 'cameraHeight': .04}))
            views.append({'view': view, 'render': str(destination.relative_to(out)), 'sha256': hashlib.sha256(destination.read_bytes()).hexdigest()})
        tile = directory / (style['id'] + '.png')
        tile.write_bytes((directory / (style['id'] + '-three-quarter.png')).read_bytes())
        item = {**style, **provenance, 'glb': str(path.relative_to(out)), 'render': str(tile.relative_to(out)), 'views': views,
                'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                'vertices': sum(len(m['xyz']) for m in meshes), 'triangles': sum(len(m['tri']) for m in meshes),
                'creationSeconds': round(time.monotonic() - beginning, 3),
                'compatibility': {'sharedMannequinExport': 'passed', 'actualNativeFitting': 'pending', 'browserLoadAndReopen': 'pending'}}
        entries.append(item); print('REAL_STYLE', style['id'], item['vertices'], item['triangles'], item['creationSeconds'], flush=True)
    (out / (kind + '-catalog.json')).write_text(json.dumps([s for s in entries if s['kind'] == kind], indent=2) + '\n')
usage = resource.getrusage(resource.RUSAGE_SELF)
report = {'date': datetime.now(timezone.utc).isoformat(), 'scope': 'Original real CC0 meshes, not generated reference pictures or exact physical cut predictions.',
          'version': VERSION, 'representativeOnly': args.representative_only, 'hairCount': len(hair), 'beardCount': len(beard),
          'seconds': round(time.monotonic() - started, 3), 'cpuSeconds': round(usage.ru_utime + usage.ru_stime, 3), 'peakRssKiB': usage.ru_maxrss,
          'retainedBytes': sum(p.stat().st_size for p in out.rglob('*') if p.is_file()), 'provenance': provenance, 'assets': entries}
filename = 'catalog-expansion-representative.json' if args.representative_only else 'catalog-expansion-creation.json'
(ROOT / '.scratch/execution-log/assets' / filename).write_text(json.dumps(report, indent=2) + '\n')
sheet = Image.new('RGB', (1024, 60 + len(entries) * 210), '#e2e8ea'); draw = ImageDraw.Draw(sheet)
draw.text((12, 12), 'Actual original 3D style renders / synthetic mannequin / professional review pending', fill='#17313d', font_size=18)
for row, style in enumerate(entries):
    for col, view in enumerate(style['views']):
        picture = Image.open(out / view['render']); picture.thumbnail((175, 180)); sheet.paste(picture, (col * 245 + 10, row * 210 + 90))
    draw.text((10, row * 210 + 62), style['label'] + ' / ' + str(style['lengthMm']) + 'mm / ' + style['coverage'], fill='#17313d', font_size=16)
sheet.save(ROOT / '.scratch/execution-log/assets' / ('catalog-representative-renders.png' if args.representative_only else 'catalog-all-style-renders.png'))
print('CREATED', json.dumps({k: report[k] for k in ['hairCount', 'beardCount', 'seconds', 'peakRssKiB', 'retainedBytes']}), flush=True)
