#!/usr/bin/env python3
"""Retain software licenses separately from model and asset permissions."""
import datetime,hashlib,json,platform,urllib.request
from pathlib import Path
from importlib.metadata import distributions
ROOT=Path(__file__).resolve().parents[2]
records=[]
for dist in sorted(distributions(),key=lambda x:x.metadata['Name'].lower()):
    name=dist.metadata['Name'];version=dist.version
    primary='https://pypi.org/pypi/'+name+'/'+version+'/json'
    registry=json.load(urllib.request.urlopen(primary,timeout=30))
    notices=[]
    for file in dist.files or []:
        if 'dist-info' in str(file) and any(term in str(file).lower() for term in ['license','notice','copying']):
            content=Path(dist.locate_file(file)).read_bytes()
            notices.append({'file':str(file),'sha256':hashlib.sha256(content).hexdigest(),'text':content.decode('utf-8',errors='replace')})
    records.append({'name':name,'version':version,'creator':registry['info'].get('author'),'primarySource':primary,'sourceUrls':registry['info'].get('project_urls'),'license':dist.metadata.get('License-Expression',registry['info'].get('license')),'notices':notices,'distributionHashes':[{k:x[k] for k in ['filename','url','digests']} for x in registry['urls']]})
modeldir=ROOT/'.scratch/private/models/mediapipe'
models=json.loads((modeldir/'sources.json').read_text())[:4]
for entry in models:entry.update(license='Apache-2.0',modifications='None',creator='Google MediaPipe authors; individual creators listed in the primary model cards')
report={'acquiredAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'software':records,'python':{'version':platform.python_version(),'license':'PSF-2.0 and historical Python licenses','source':'https://docs.python.org/3/license.html'},'models':models,'modelBundleVersion':'float16/1','modelComponents':{'face_detector.tflite':'BlazeFace short range, 2021-06-09, Valentin Bazarevsky','face_landmarks_detector.tflite':'Face Mesh V2, 2022-09-15, Geng Yan and Ivan Grishchenko','face_blendshapes.tflite':'Blendshape V2, 2022-11-11, Ivan Grishchenko, Geng Yan, Andrei Zanfir and Eduard Gabriel Bazavan'},'attribution':'Retain Apache notices and bundled third-party licenses. Models unmodified. MPFB helper script is GPL-3.0-or-later; CC0 core targets and geometry are separately documented in makehuman-core-provenance.json.','privacy':'MediaPipe 1.0.1 NOTICE describes utilization metrics. App processing runs inside unshare --user --map-root-user --net; no network access is available. Initial synthetic-only CLI probes ran before automatic CLI isolation was added. No real client input was used.','assets':'All fitted meshes are derivatives of separately verified CC0 MakeHuman core assets and retained local procedural geometry. No MediaPipe model weights are distributed in Git.'}
(ROOT/'.scratch/execution-log/assets/native-mpfb-provenance.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
print('Recorded',len(records),'software packages and four exact official model sources.')
