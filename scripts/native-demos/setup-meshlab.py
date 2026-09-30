#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Acquire the official pinned PyMeshLab wheel and retain its exact notices."""
import datetime
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import urllib.request
from importlib.metadata import distribution

ROOT=Path(__file__).resolve().parents[2]
os.umask(0o077)
python=ROOT/'.scratch/private/native-demos/python/bin/python'
assert Path(sys.executable).resolve()==python.resolve(),'Use pinned private Python 3.12'
url='https://pypi.org/pypi/pymeshlab/2025.7.post1/json'
registry=json.load(urllib.request.urlopen(url,timeout=30))
filename='pymeshlab-2025.7.post1-cp312-cp312-manylinux_2_35_x86_64.whl'
expected='bc453d89b114671affc747991a939b257d2320b71885b31213190c64081f5c35'
record=next(f for f in registry['urls'] if f['filename']==filename)
assert record['digests']['sha256']==expected
wheel=ROOT/'.scratch/private/native-demos/downloads'/filename
if not wheel.exists():
    with urllib.request.urlopen(record['url'],timeout=120) as response:wheel.write_bytes(response.read())
assert hashlib.sha256(wheel.read_bytes()).hexdigest()==expected
requirements=ROOT/'scripts/native-demos/requirements-meshlab.txt'
if not requirements.exists():requirements.write_text((ROOT/'scripts/native-demos/requirements-open3d.txt').read_text()+'\npymeshlab==2025.7.post1\n')
subprocess.run([str(Path.home()/'.local/bin/uv'),'pip','install','--python',str(python),'-r',str(requirements)],check=True)
dist=distribution('pymeshlab');assert dist.version=='2025.7.post1'
notices=[]
for f in dist.files or []:
    if any(s in str(f).lower() for s in ['license','copying','notice']):
        data=Path(dist.locate_file(f)).read_bytes()
        notices.append({'file':str(f),'sha256':hashlib.sha256(data).hexdigest(),'text':data.decode(errors='replace')})
license_url='https://raw.githubusercontent.com/cnr-isti-vclab/PyMeshLab/v2025.7.post1/LICENSE'
license_text=urllib.request.urlopen(license_url,timeout=30).read().decode()
assert 'GNU GENERAL PUBLIC LICENSE' in license_text and 'Version 3' in license_text
source=ROOT/'.scratch/private/native-demos/pymeshlab-source'
if not source.exists():subprocess.run(['git','clone','--depth','1','--branch','v2025.7.post1','https://github.com/cnr-isti-vclab/PyMeshLab.git',str(source)],check=True)
assert subprocess.check_output(['git','-C',str(source),'rev-parse','HEAD'],text=True).strip()=='1dc199f9b6c43e58b6db346ba4600866b950b8ae'
subprocess.run(['git','-C',str(source),'submodule','update','--init','--depth','1','src/meshlab','src/pymeshlab/pybind11'],check=True)
engine=source/'src/meshlab'
subprocess.run(['git','-C',str(engine),'submodule','update','--init','--depth','1','src/vcglib'],check=True)
native_sources=[]
for name,path,commit,license_name,files in [
    ('MeshLab',engine,'d876376e3cc4f92d257e248023d82cbac5b03c7d','GPL-2.0-or-later / GPL-3.0 distribution',['LICENSE.txt','src/meshlabplugins/filter_clean/cleanfilter.cpp','src/meshlabplugins/filter_meshing/meshfilter.cpp','src/meshlabplugins/filter_measure/filter_measure.cpp','src/meshlabplugins/filter_sampling/filter_sampling.cpp','src/meshlabplugins/io_base/baseio.cpp']),
    ('VCGlib',engine/'src/vcglib','c94ef4e12e9ea3ae986d9af91005be8328d13719','GPL-3.0 distribution',['LICENSE.txt']),
    ('pybind11',source/'src/pymeshlab/pybind11','a2e59f0e7065404b44dfe92a28aca47ba1378dc4','BSD-3-Clause',['LICENSE']),
]:
    assert subprocess.check_output(['git','-C',str(path),'rev-parse','HEAD'],text=True).strip()==commit
    base='https://github.com/'+('pybind/pybind11' if name=='pybind11' else 'cnr-isti-vclab/'+('meshlab' if name=='MeshLab' else 'vcglib'))+'/blob/'+commit+'/'
    native_sources.append({'name':name,'commit':commit,'license':license_name,'notices':[{'sourceUrl':base+file,'text':(path/file).read_text() if file.endswith('.txt') or file=='LICENSE' else '\n'.join((path/file).read_text().splitlines()[:25])} for file in files]})
report={'acquiredAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'software':{'name':'PyMeshLab','version':dist.version,'creator':'Alessandro Muntoni and Paolo Cignoni / CNR ISTI Visual Computing Lab','license':'GPL-3.0','licenseUrl':license_url,'licenseText':license_text,'officialSource':'https://github.com/cnr-isti-vclab/PyMeshLab/tree/v2025.7.post1','sourceCommit':'1dc199f9b6c43e58b6db346ba4600866b950b8ae','registry':url,'wheel':{'filename':filename,'sha256':expected,'bytes':wheel.stat().st_size,'url':record['url']},'notices':notices,'modifications':'Official wheel unmodified. Original processing wrapper GPL-3.0-or-later.','citation':'Muntoni and Cignoni, PyMeshLab (2021), doi:10.5281/zenodo.4438750'},'dependencies':{'pinnedRuntime':'scripts/native-demos/requirements-meshlab.txt','samePreviouslyVerifiedRuntime':'open3d-provenance.json','additionalPythonRequirements':registry['info']['requires_dist'],'nativePlugins':'Bundled native MeshLab/Qt filters require a separate inspection of wheel notices and pinned source dependency licenses before milestone verification.'},'models':'No learned model or reconstruction weights. Requires an identified retained native fitted head with the same six authorized photo dependencies.','assets':'Same independently licensed shared styles, copied from upstream with full model and asset provenance. No package test meshes used as client assets.','professionalAcceptance':'pending'}
report['dependencies']['nativeSources']=native_sources
report['dependencies']['nativePlugins']='Pinned MeshLab cleanup, meshing, measurement, sampling and PLY IO source headers permit GPL-2.0-or-later; used with the GPL-3 PyMeshLab distribution. Official wheel is unmodified; optional native plugins are not attributed as used processing stages.'
report['dependencies']['bundledNativeInventory']=[{'file':str(f),'sha256':hashlib.sha256(Path(dist.locate_file(f)).read_bytes()).hexdigest()} for f in dist.files or [] if '.so' in str(f)]
(ROOT/'.scratch/execution-log/assets/meshlab-provenance.json').write_text(json.dumps(report,indent=2)+'\n')
print('Verified official PyMeshLab 2025.7.post1 wheel, pinned MeshLab/VCGlib/pybind11 sources and separate GPL/BSD notices.')
