#!/usr/bin/env python3
"""Install pinned native runtime and retain exact official model provenance."""
import datetime,hashlib,json,os,subprocess,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];os.umask(0o077)
private=ROOT/'.scratch/private';model=private/'models/mediapipe';model.mkdir(parents=True,exist_ok=True)
sources=[('face_landmarker.task','https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task','64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff'),('face-mesh-card.pdf','https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Face%20Mesh%20V2.pdf','c6add060f4ebfb37b2690136b6c711c7e5fcb7038baa2649ae3338b83979565a'),('blendshape-card.pdf','https://storage.googleapis.com/mediapipe-assets/Model%20Card%20Blendshape%20V2.pdf','c8e9cf60a39998f4b341740623917590e050d1c97004e2de4568d84e026445ae'),('detector-card.pdf','https://storage.googleapis.com/mediapipe-assets/MediaPipe%20BlazeFace%20Model%20Card%20%28Short%20Range%29.pdf','cd335c06fc0de7807cd815a0777a697932598bcdb28fa98adaaabf847485f758')]
for name,url,digest in sources:
    file=model/name;data=file.read_bytes() if file.exists() else urllib.request.urlopen(url,timeout=60).read()
    if hashlib.sha256(data).hexdigest()!=digest:raise RuntimeError('Official source checksum changed: '+name)
    file.write_bytes(data);file.chmod(0o600)
venv=private/'native-demos/python';uv=str(Path.home()/'.local/bin/uv')
if not (venv/'bin/python').exists():subprocess.run([uv,'venv','--python','3.12.14',str(venv)],check=True)
subprocess.run([uv,'pip','install','--quiet','--python',str(venv/'bin/python'),'-r',str(ROOT/'scripts/native-demos/requirements.txt')],check=True)
# Every processing job must use kernel network isolation. Setup/download remains
# a separate online acquisition step, never mixed with processing client inputs.
subprocess.run(['unshare','--user','--map-root-user','--net','--','/bin/true'],check=True)
print('Pinned runtime, exact model hashes and network namespace verified.')
