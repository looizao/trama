#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Build pinned CloudCompare privately, with native ICP iteration diagnostics."""
import datetime
import hashlib
import json
import os
from pathlib import Path
import resource
import subprocess
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / '.scratch/private/native-demos'
SOURCE = BASE / 'cloudcompare-source'
BUILD = BASE / 'cloudcompare-build'
PREFIX = BASE / 'cloudcompare'
QT = BASE / 'cloudcompare-qt'
COMMIT = '49dbbb662f296c7780aae717897c85b3cb3764ed'
CORE = 'a8ce4270dfa41d5817842447b27f36094f9dfb51'
NANO = '2f54b8eb07c719bc605445e4ec44d61240f5a2ce'
os.umask(0o077)
if not SOURCE.exists():
    subprocess.run(['git', 'clone', '--depth', '1', '--branch', 'v2.13.2', 'https://github.com/CloudCompare/CloudCompare.git', str(SOURCE)], check=True)
assert subprocess.check_output(['git', '-C', str(SOURCE), 'rev-parse', 'HEAD'], text=True).strip() == COMMIT
subprocess.run(['git', '-C', str(SOURCE), 'submodule', 'update', '--init', '--depth', '1', 'libs/qCC_db/extern/CCCoreLib'], check=True)
core = SOURCE / 'libs/qCC_db/extern/CCCoreLib'
assert subprocess.check_output(['git', '-C', str(core), 'rev-parse', 'HEAD'], text=True).strip() == CORE
subprocess.run(['git', '-C', str(core), 'submodule', 'update', '--init', '--depth', '1', 'extern/nanoflann'], check=True)
assert subprocess.check_output(['git', '-C', str(core / 'extern/nanoflann'), 'rev-parse', 'HEAD'], text=True).strip() == NANO
QT.mkdir(exist_ok=True)
packages = []
for name, digest in [
    ('qt5-svg-5.15.19+kde+r5-1', '874d631c937bbca955257cd47af9199864479a07772e99cc480775b1efb6ea1f'),
    ('qt5-tools-5.15.18+kde+r3-2', 'b25c4598dd4a38d75f87f7bbe7f0fea69727a48e8fc5cad9502d6456aa7810f1'),
]:
    filename = name + '-x86_64.pkg.tar.zst'
    cached = Path('/var/cache/pacman/pkg') / filename
    archive = cached if cached.exists() else BASE / 'downloads' / filename
    url = 'https://archive.archlinux.org/packages/q/' + name.split('-5.')[0] + '/' + filename
    if not archive.exists():
        with urllib.request.urlopen(url, timeout=60) as response:
            archive.write_bytes(response.read())
    assert hashlib.sha256(archive.read_bytes()).hexdigest() == digest
    subprocess.run(['tar', '-xf', str(archive), '-C', str(QT)], check=True)
    info = (QT / '.PKGINFO').read_text()
    packages.append({'filename': filename, 'sha256': digest, 'bytes': archive.stat().st_size, 'sourceUrl': url, 'packageMetadata': info})
# Two diagnostic changes only: enable the existing Release ICP trace and keep
# enough decimal precision to inspect convergence. The registration algorithm
# and stopping rules are unchanged. Refuse silently patching another version.
trace = core / 'src/RegistrationTools.cpp'
original = subprocess.check_output(['git', '-C', str(core), 'show', 'HEAD:src/RegistrationTools.cpp'], text=True)
patched = original.replace('#ifdef CC_DEBUG\n\tfTraceFile = fopen("registration_trace_log.csv", "wt");\n#endif', '// Trama diagnostic change: retain native ICP iterations in Release builds.\n\tfTraceFile = fopen("registration_trace_log.csv", "wt");').replace('"%u; %f; %u;\\n"', '"%u; %.12g; %u;\\n"')
assert patched != original and trace.read_text() in [original, patched]
trace.write_text(patched)
configure = ['cmake', '-S', str(SOURCE), '-B', str(BUILD), '-G', 'Ninja', '-DCMAKE_BUILD_TYPE=Release', '-DCMAKE_INSTALL_PREFIX=' + str(PREFIX), '-DQt5Svg_DIR=' + str(QT / 'usr/lib/cmake/Qt5Svg'), '-DQt5LinguistTools_DIR=' + str(QT / 'usr/lib/cmake/Qt5LinguistTools'), '-DOPTION_BUILD_CCVIEWER=OFF', '-DOPTION_USE_DXF_LIB=OFF', '-DOPTION_USE_SHAPE_LIB=OFF', '-DCMAKE_POLICY_VERSION_MINIMUM=3.10', '-DCCCORELIB_USE_QT_CONCURRENT=ON']
metrics = []
for stage, command in [('configure', configure), ('build', ['cmake', '--build', str(BUILD), '--parallel', '4']), ('install', ['cmake', '--install', str(BUILD)])]:
    before = resource.getrusage(resource.RUSAGE_CHILDREN)
    started = time.monotonic()
    with (BASE / ('cloudcompare-' + stage + '.log')).open('w') as output:
        result = subprocess.run(command, stdout=output, stderr=subprocess.STDOUT)
    after = resource.getrusage(resource.RUSAGE_CHILDREN)
    metrics.append({'stage': stage, 'command': command, 'seconds': time.monotonic() - started, 'cpuSeconds': after.ru_utime + after.ru_stime - before.ru_utime - before.ru_stime, 'peakRssKiB': after.ru_maxrss, 'exitCode': result.returncode})
    assert result.returncode == 0, 'Inspect retained private ' + stage + ' log'
notices = []
for name, file, url, license_name in [
    ('CloudCompare', SOURCE / 'license.txt', 'https://github.com/CloudCompare/CloudCompare/blob/' + COMMIT + '/license.txt', 'GPL-2.0-or-later'),
    ('CCCoreLib', core / 'LICENSE.txt', 'https://github.com/CloudCompare/CCCoreLib/blob/' + CORE + '/LICENSE.txt', 'LGPL-2.0-or-later'),
    ('CCCoreLib CMake', core / 'LICENSE-MIT.txt', 'https://github.com/CloudCompare/CCCoreLib/blob/' + CORE + '/LICENSE-MIT.txt', 'MIT'),
    ('nanoflann', core / 'extern/nanoflann/COPYING', 'https://github.com/jlblancoc/nanoflann/blob/' + NANO + '/COPYING', 'BSD'),
    ('QCustomPlot 2.1.0', SOURCE / 'qCC/extern/QCustomPlot/qcustomplot.h', 'https://github.com/CloudCompare/CloudCompare/blob/' + COMMIT + '/qCC/extern/QCustomPlot/qcustomplot.h', 'GPL-3.0-or-later'),
    ('RPly', SOURCE / 'libs/qCC_io/src/rply.c', 'https://github.com/CloudCompare/CloudCompare/blob/' + COMMIT + '/libs/qCC_io/src/rply.c', 'MIT'),
]:
    data = file.read_bytes()
    notices.append({'name': name, 'sourceUrl': url, 'license': license_name, 'sha256': hashlib.sha256(data).hexdigest(), 'text': data.decode() if file.suffix == '.txt' or file.name == 'COPYING' else '\n'.join(data.decode().splitlines()[:35] + (data.decode().splitlines()[-27:] if name == 'RPly' else []))})
for package in ['qt5-base', 'qt5-svg', 'qt5-tools']:
    directory = (Path('/usr/share/licenses') if package == 'qt5-base' else QT / 'usr/share/licenses') / package
    for file in sorted(directory.glob('*')):
        if file.is_file():
            notices.append({'name': package + '/' + file.name, 'sourceUrl': 'https://doc.qt.io/archives/qt-5.15/licensing.html', 'sha256': hashlib.sha256(file.read_bytes()).hexdigest(), 'text': file.read_text()})
binary = PREFIX / 'bin/CloudCompare'
report = {'acquiredAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'software': {'name': 'CloudCompare', 'version': '2.13.2', 'creator': 'Daniel Girardeau-Montaut / EDF R&D / TELECOM ParisTech and contributors', 'sourceUrl': 'https://github.com/CloudCompare/CloudCompare/tree/' + COMMIT, 'commit': COMMIT, 'license': 'GPL-3.0-or-later combined build: CloudCompare GPL-2.0-or-later plus QCustomPlot GPL-3.0-or-later', 'licenseUrl': notices[0]['sourceUrl'], 'modifications': 'Native existing ICP Release trace enabled and numeric formatting raised to 12 significant digits. No registration algorithm changes.', 'binarySha256': hashlib.sha256(binary.read_bytes()).hexdigest(), 'binaryBytes': binary.stat().st_size}, 'dependencies': {'CCCoreLib': CORE, 'nanoflann': NANO, 'Qt': subprocess.check_output(['pkg-config', '--modversion', 'Qt5Core'], text=True).strip(), 'privateExtractedPackages': packages, 'onlyPluginBuilt': 'QCORE_IO_PLUGIN; optional commercial or additional plugins, DXF, GDAL and ShapeLib disabled.', 'notices': notices}, 'setupMeasurements': metrics, 'measurementScope': 'These commands record their own actual execution, including cached rebuilds. Earlier first build timing is separately retained. Acquisition/extraction times are not included.', 'models': 'No learned model, texture or account required. Supporting native alignment/distance/conversion requires a retained six-photo fitting upstream.', 'assets': 'Actual upstream head and all 16 independent style GLBs retain their separate full model and asset provenance. No package sample head used.', 'professionalAcceptance': 'pending'}
report['dependencies']['licenseVersionResolution']={'primaryReadme':'https://github.com/CloudCompare/CloudCompare/blob/'+COMMIT+'/README.md','readmeGPLSection':'\n'.join((SOURCE/'README.md').read_text().splitlines()[24:36]),'oldInstalledNotice':'\n'.join((SOURCE/'qCC/bin_other/license.txt').read_text().splitlines()[:17]),'interpretation':'Pinned official README specifies GPL v3; root and executed application source headers permit GPL v2 or later. Included QCustomPlot v2.1.0 is GPL v3 or later, so this combined build uses GPL v3. Older installed v2 notice retained transparently; executable source explicitly grants later versions.'}
if (BASE/'cloudcompare-build-measurement.json').exists():report['initialBuildMeasurement']=json.loads((BASE/'cloudcompare-build-measurement.json').read_text())
(ROOT / '.scratch/execution-log/assets/cloudcompare-provenance.json').write_text(json.dumps(report, indent=2) + '\n')
print('Verified pinned CloudCompare 2.13.2, separate native and Qt notices, private CPU build and native trace modification.')
