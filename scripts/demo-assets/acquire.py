#!/usr/bin/env python3
"""Acquire pinned, commercially usable core assets in ignored private storage."""
import datetime
import hashlib
import json
from pathlib import Path
import subprocess
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / '.scratch/private'
MPFB_TAG = 'v2.0.17'
MPFB_SHA = '80919fa4682335c41847f761a4d79dcad4124732'
PACK_URL = 'https://files2.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip'
PACK_SOURCE = 'https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html'
PACK_SHA = 'b542127a8e25547c7c29c19f2d1d2adb9a664c80396ecd694095dbc8028a0107'

def acquire():
    tools = PRIVATE / 'tools'
    tools.mkdir(parents=True, exist_ok=True, mode=0o700)
    mpfb = tools / 'mpfb2'
    if not mpfb.exists():
        subprocess.run(['git', 'clone', '--branch', MPFB_TAG, '--depth', '1',
                        'https://github.com/makehumancommunity/mpfb2.git', str(mpfb)], check=True)
    actual = subprocess.check_output(['git', '-C', str(mpfb), 'rev-parse', 'HEAD'], text=True).strip()
    if actual != MPFB_SHA:
        raise RuntimeError('MPFB source differs from approved pin; refusing to run it')
    downloads = PRIVATE / 'downloads'
    downloads.mkdir(parents=True, exist_ok=True, mode=0o700)
    archive = downloads / 'makehuman_system_assets_cc0.zip'
    if not archive.exists():
        part = archive.with_suffix('.part')
        with urllib.request.urlopen(PACK_URL, timeout=60) as response, part.open('wb') as output:
            while block := response.read(1024 * 1024):
                output.write(block)
        part.replace(archive)
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    if digest != PACK_SHA:
        raise RuntimeError('Core asset archive differs from inspected pin; license review required')
    asset_root = PRIVATE / 'source-assets/makehuman-system'
    asset_root.mkdir(parents=True, exist_ok=True, mode=0o700)
    with zipfile.ZipFile(archive) as z:
        bad = z.testzip()
        if bad:
            raise RuntimeError(f'Corrupt pack member: {bad}')
        for member in z.infolist():
            if not (asset_root/member.filename).resolve().is_relative_to(asset_root.resolve()):
                raise RuntimeError('Unsafe ZIP member')
        z.extractall(asset_root)
    provenance = {
        'acquiredAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'mpfb': {'version': MPFB_TAG, 'commit': actual,
                 'creator': 'MakeHuman Community / Joel Palmius',
                 'sourceUrl': 'https://github.com/makehumancommunity/mpfb2',
                 'codeLicense': 'GPL-3.0-or-later', 'assetsLicense': 'CC0-1.0',
                 'licenseUrl': f'https://github.com/makehumancommunity/mpfb2/blob/{MPFB_TAG}/LICENSE.md',
                 'modifications': [], 'attributionRequired': False},
        'systemAssets': {'creator': 'MakeHuman Community (makehuman_system)',
                         'sourceUrl': PACK_SOURCE, 'downloadUrl': PACK_URL,
                         'license': 'CC0-1.0', 'attributionRequired': False,
                         'modifications': [], 'bytes': archive.stat().st_size,
                         'sha256': digest,
                         'integrity': 'all archive members passed CRC',
                         'scope': 'Core pack only. Third-party packs require separate per-asset checks.'}}
    path = ROOT / '.scratch/execution-log/assets/makehuman-core-provenance.json'
    path.write_text(json.dumps(provenance, indent=2)+'\n')
    print(json.dumps(provenance, indent=2))

if __name__ == '__main__':
    acquire()
