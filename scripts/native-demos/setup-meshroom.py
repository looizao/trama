#!/usr/bin/env python3
"""Prepare pinned Meshroom; native CUDA acquisition requires prior acceptance."""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tarfile
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / '.scratch/private'
os.umask(0o077)
p = argparse.ArgumentParser()
p.add_argument('--acquire-native', action='store_true')
p.add_argument('--cuda-license-accepted', action='store_true', help='Use only after the user accepts the exact CUDA 12.1.1 terms.')
args = p.parse_args()
if args.acquire_native and not args.cuda_license_accepted:
    raise SystemExit('Native download requires prior CUDA 12.1.1 agreement acceptance: https://docs.nvidia.com/cuda/archive/12.1.1/eula/index.html')
sources = [
    ('meshroom-source', 'alicevision/Meshroom', 'v2025.1.0', '024b6f398c67bec4968a29a2c5744e49e2bab9b8'),
    ('alicevision-source', 'alicevision/AliceVision', 'v3.3.0', '928bac2689461ffb6f0174609f983a16bdbd2b30'),
]
records = []
for name, repository, tag, commit in sources:
    checkout = PRIVATE / 'tools' / name
    if not checkout.exists():
        subprocess.run(['git', 'clone', '--depth', '1', '--branch', tag, 'https://github.com/' + repository, str(checkout)], check=True)
    actual = subprocess.check_output(['git', '-C', str(checkout), 'rev-parse', 'HEAD'], text=True).strip()
    if actual != commit:
        raise SystemExit('Existing private source checkout differs from pinned release; preserve it and resolve explicitly: ' + name)
    notices = []
    for file in sorted(checkout.glob('*LICENSE*')) + [checkout / 'COPYING.md']:
        if file.is_file():
            data = file.read_bytes()
            notices.append({'file': file.name, 'sha256': hashlib.sha256(data).hexdigest(), 'text': data.decode()})
    records.append({'name': name, 'creator': 'AliceVision contributors', 'version': tag, 'commit': commit, 'license': 'MPL-2.0; separate third-party notices retained', 'source': 'https://github.com/' + repository + '/tree/' + tag, 'notices': notices, 'modifications': 'None'})
python = PRIVATE / 'native-demos/meshroom-python/bin/python'
uv = str(Path.home() / '.local/bin/uv')
if not python.exists():
    subprocess.run([uv, 'venv', '--python', '3.12.14', str(python.parent.parent)], check=True)
subprocess.run([uv, 'pip', 'install', '--quiet', '--python', str(python), '-r', str(ROOT / 'scripts/native-demos/requirements-meshroom.txt')], check=True)
env = dict(os.environ, PYTHONPATH=str(PRIVATE / 'tools/meshroom-source'), MESHROOM_NODES_PATH=str(PRIVATE / 'tools/alicevision-source/meshroom'), MESHROOM_PIPELINE_TEMPLATES_PATH=str(PRIVATE / 'tools/alicevision-source/meshroom'))
help_text = subprocess.check_output([str(python), str(PRIVATE / 'tools/meshroom-source/bin/meshroom_batch'), '--help'], env=env, text=True)
assert 'photogrammetry' in help_text
(PRIVATE / 'native-demos/meshroom-cli-help.log').write_text(help_text)
subprocess.run(['unshare', '--user', '--map-root-user', '--net', '--', '/bin/true'], check=True)
native = {'status': 'Awaiting explicit CUDA 12.1.1 agreement acceptance; native runtime not acquired by preparation.', 'buildConfiguration': 'https://github.com/alicevision/AliceVision/blob/v3.3.0/.github/workflows/continuous-integration.yml', 'cudaTerms': 'https://docs.nvidia.com/cuda/archive/12.1.1/eula/index.html'}
if args.acquire_native:
    url = 'https://github.com/alicevision/AliceVision/releases/download/v3.3.0/AliceVision-3.3.0-Linux.tar.gz'
    digest = 'f43f498312859af627f2f7f65a6d33c2a3411b37989b8b680c04c8c690dcb640'
    archive = PRIVATE / 'downloads/AliceVision-3.3.0-Linux.tar.gz'
    archive.parent.mkdir(parents=True, exist_ok=True)
    if not archive.exists():
        partial = archive.with_suffix('.part')
        with urllib.request.urlopen(url, timeout=60) as response, partial.open('wb') as output:
            total = 0
            while chunk := response.read(8 << 20):
                output.write(chunk)
                total += len(chunk)
                if total % (64 << 20) == 0:
                    print('Native download MiB:', total // (1 << 20), flush=True)
        partial.replace(archive)
    checksum = hashlib.file_digest(archive.open('rb'), 'sha256').hexdigest()
    if checksum != digest:
        raise SystemExit('Native archive checksum differs from official release; not extracted or run')
    destination = PRIVATE / 'tools/alicevision-native'
    destination.mkdir(exist_ok=True)
    with tarfile.open(archive) as bundle:
        # Classical exhaustive SIFT uses no learned models or vocabulary tree.
        # Optional models are deliberately excluded from extraction and use.
        members = [m for m in bundle.getmembers() if not any(term in m.name.lower() for term in ['.onnx', '.sift.tree', 'colorchartdetectionmodel'])]
        bundle.extractall(destination, members=members, filter='data')
    native.update(status='Acquired privately, checksum verified; runtime execution and exact bundled-library inventory still pending.', url=url, sha256=checksum, bytes=archive.stat().st_size, acceptedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(), acceptance='Caller asserts prior human acceptance of the linked CUDA 12.1.1 terms; no acceptance inferred from authentication.')
report = {'date': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'software': records, 'nativeRuntime': native, 'models': 'No learned matcher, segmentation model or vocabulary tree used. Classical SIFT plus exhaustive six-view pairing is the intended experiment.', 'assets': 'Existing authorized synthetic six-photo cases; separately verified CC0 and local procedural asset provenance retained in makehuman-core-provenance.json.', 'scope': 'Open-source CLI preparation is verified. Native processing and the complete candidate journey are not yet verified.', 'licenseObligations': 'Retain MPL notices. Modified covered files require MPL source availability on distribution. Qt/PySide and the native CUDA runtime have separate terms; package provenance retained separately. No source modifications or redistribution of the native bundle in Git.'}
(ROOT / '.scratch/execution-log/assets/meshroom-setup-provenance.json').write_text(json.dumps(report, indent=2) + '\n')
print('Pinned source, CLI photogrammetry template and private runtime preparation verified. Native status:', native['status'])
