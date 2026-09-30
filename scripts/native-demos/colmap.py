#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Retain a bounded six-photo COLMAP experiment, including failed coverage."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import resource
import sqlite3
import sys
import time

# Client images and native processing never need network access.
interfaces = [line.split(':', 1)[0].strip() for line in Path('/proc/self/net/dev').read_text().splitlines() if ':' in line]
if any(interface != 'lo' for interface in interfaces):
    os.execvp('unshare', ['unshare', '--user', '--map-root-user', '--net', '--', sys.executable, str(Path(__file__).resolve()), *sys.argv[1:]])
import numpy as np
from PIL import Image, ImageDraw
import pycolmap

os.umask(0o077)
p = argparse.ArgumentParser()
p.add_argument('directory', type=Path)
args = p.parse_args()
directory = args.directory.resolve()
manifest = json.loads((directory / 'manifest.json').read_text())
views = ['front', 'left-three-quarter', 'left-profile', 'back', 'right-profile', 'right-three-quarter']
if len(manifest['inputs']) != 6 or {i['view'] for i in manifest['inputs']} != set(views):
    raise SystemExit('Exactly six labeled inputs required')
images = directory / 'colmap-images'
images.mkdir(exist_ok=True)
inputs = []
for item in manifest['inputs']:
    source = (directory / item['path']).resolve()
    if not source.is_relative_to(directory):
        raise SystemExit('Input outside private job directory')
    with Image.open(source) as image:
        image.convert('RGB').save(images / (item['view'] + '.png'))
        inputs.append({'view': item['view'], 'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'width': image.width, 'height': image.height})
database = directory / 'colmap.db'
if database.exists():
    raise SystemExit('Use a fresh experiment directory; retained native databases are immutable')
metrics = []
started = time.monotonic()
def stage(name, percent, function):
    (directory / 'progress.json').write_text(json.dumps({'stage': name, 'percent': percent}))
    before = resource.getrusage(resource.RUSAGE_SELF)
    start = time.monotonic()
    result = function()
    after = resource.getrusage(resource.RUSAGE_SELF)
    metrics.append({'stage': name, 'seconds': round(time.monotonic() - start, 3), 'cpuSeconds': round(after.ru_utime + after.ru_stime - before.ru_utime - before.ru_stime, 3), 'peakRssKiB': after.ru_maxrss})
    (directory / 'colmap-resources.json').write_text(json.dumps(metrics, indent=2))
    return result

preset = manifest.get('colmapPreset', 'standard')
if preset not in ('standard', 'sensitive-calibrated'):
    raise SystemExit('Unknown COLMAP preset')
calibrated = preset == 'sensitive-calibrated'
settings = {'preset': preset, 'maxImageSize': 1600, 'maxFeatures': 8192, 'peakThreshold': .002 if calibrated else 1 / 150, 'affineShape': calibrated, 'domainSizePooling': calibrated, 'threads': 4, 'seed': 42, 'mappingSecondsPerTrial': 35, 'cameraModel': 'PINHOLE' if calibrated else 'SIMPLE_RADIAL', 'sharedCamera': True, 'calibration': 'Declared focal length and 36 mm sensor; square pixels, centered principal point, zero distortion. Assumptions, not measured calibration.' if calibrated else 'Unknown focal length; COLMAP initial focal factor 1.2. No known camera poses or ground-truth mesh supplied.', 'minimumModelImages': 3}
reader = pycolmap.ImageReaderOptions()
reader.camera_model = settings['cameraModel']
if calibrated:
    dimensions = {(i['width'], i['height']) for i in inputs}
    if len(dimensions) != 1:
        raise SystemExit('Shared calibrated camera requires equal image dimensions')
    width, height = dimensions.pop()
    focal_mm = manifest['settings']['focalLength']
    focal_px = max(width, height) * focal_mm / 36
    reader.camera_params = f'{focal_px},{focal_px},{width/2},{height/2}'
    settings.update({'focalLengthMm': focal_mm, 'focalPixels': focal_px, 'sensorMm': 36})
extract = pycolmap.FeatureExtractionOptions()
extract.num_threads = 4
extract.max_image_size = settings['maxImageSize']
extract.sift.max_num_features = settings['maxFeatures']
extract.sift.peak_threshold = settings['peakThreshold']
extract.sift.estimate_affine_shape = calibrated
extract.sift.domain_size_pooling = calibrated
extract.use_gpu = False
stage('features', 10, lambda: pycolmap.extract_features(database, images, camera_mode=pycolmap.CameraMode.SINGLE, reader_options=reader, extraction_options=extract, device=pycolmap.Device.cpu))
matching = pycolmap.FeatureMatchingOptions()
matching.num_threads = 4
matching.use_gpu = False
verification = pycolmap.TwoViewGeometryOptions()
verification.ransac.random_seed = 42
stage('matches', 30, lambda: pycolmap.match_exhaustive(database, matching_options=matching, verification_options=verification, device=pycolmap.Device.cpu))
connection = sqlite3.connect(database)
names = dict(connection.execute('SELECT image_id,name FROM images'))
features = [{'view': names[i].removesuffix('.png'), 'features': n} for i, n in connection.execute('SELECT image_id,rows FROM keypoints')]
pairs = []
for pair_id, n in connection.execute('SELECT pair_id,rows FROM two_view_geometries'):
    first, second = divmod(pair_id, 2147483647)
    pairs.append({'first': names[first].removesuffix('.png'), 'second': names[second].removesuffix('.png'), 'verifiedMatches': n})
connection.close()
trials = []
for index, (inliers, angle) in enumerate([(100, 16), (50, 8), (20, 5)]):
    options = pycolmap.IncrementalPipelineOptions()
    options.num_threads = 4
    options.random_seed = 42
    options.min_model_size = 3  # Default ten would suppress all six-photo models.
    options.max_num_models = 3
    options.max_runtime_seconds = 35
    options.init_num_trials = 30
    options.mapper.init_min_num_inliers = inliers
    options.mapper.init_min_tri_angle = angle
    options.mapper.num_threads = 4
    options.mapper.random_seed = 42
    if calibrated:
        options.ba_refine_focal_length = False
        options.ba_refine_extra_params = False
        options.mapper.abs_pose_refine_focal_length = False
        options.mapper.abs_pose_refine_extra_params = False
    output = directory / ('sparse-' + str(index))
    output.mkdir()
    models = stage('mapping-' + str(index), 45 + index * 15, lambda: pycolmap.incremental_mapping(database, images, output, options=options))
    retained = []
    for model_id, reconstruction in models.items():
        model_dir = output / str(model_id)
        model_dir.mkdir(exist_ok=True)
        reconstruction.write(model_dir)
        reconstruction.export_PLY(model_dir / 'observed-points.ply')
        registered = sorted(reconstruction.image(i).name.removesuffix('.png') for i in reconstruction.reg_image_ids())
        retained.append({'model': str(model_dir.relative_to(directory)), 'registeredViews': registered, 'points3D': reconstruction.num_points3D(), 'observations': reconstruction.compute_num_observations(), 'meanReprojectionErrorPixels': reconstruction.compute_mean_reprojection_error(), 'geometry': 'Sparse triangulated feature points only; unobserved surfaces absent; scale unknown.'})
    trials.append({'index': index, 'initialMinimumInliers': inliers, 'initialMinimumAngleDegrees': angle, 'relaxedThresholds': index > 0, 'models': retained})
    (directory / 'colmap-report.json').write_text(json.dumps({'settings': settings, 'inputs': inputs, 'features': features, 'pairs': pairs, 'trials': trials}, indent=2))

# Actual verified-match graph is useful even when reconstruction fails.
canvas = Image.new('RGB', (1200, 820), '#111827')
draw = ImageDraw.Draw(canvas)
draw.text((24, 20), 'COLMAP / six synthetic views / verified feature matches', fill='white', font_size=24)
positions = {}
for index, view in enumerate(views):
    angle = index * np.pi / 3 - np.pi / 2
    positions[view] = (600 + 380 * np.cos(angle), 390 + 270 * np.sin(angle))
for pair in pairs:
    a, b = positions[pair['first']], positions[pair['second']]
    count = pair['verifiedMatches']
    draw.line([a, b], fill='#34d399' if count >= 20 else '#4b5563', width=min(8, 1 + count // 40))
    draw.text(((a[0] + b[0]) / 2, (a[1] + b[1]) / 2), str(count), fill='#fbbf24', font_size=17)
for view, (x, y) in positions.items():
    draw.ellipse((x - 12, y - 12, x + 12, y + 12), fill='#60a5fa')
    draw.text((x - 80, y + 16), view, fill='white', font_size=17)
draw.text((24, 755), 'Line counts are geometrically verified matches, not surface coverage or likeness.', fill='white', font_size=19)
draw.text((24, 785), 'Relaxed mapping trials and all partial geometry retained. Hidden surfaces are not filled.', fill='white', font_size=18)
canvas.save(directory / 'colmap-matches.png')
models = [m for trial in trials for m in trial['models']]
report = {'candidate': 'colmap', 'version': pycolmap.__version__, 'cudaAvailable': pycolmap.has_cuda, 'settings': settings, 'inputs': inputs, 'features': features, 'pairs': pairs, 'trials': trials, 'resources': metrics, 'elapsedMs': round((time.monotonic() - started) * 1000), 'resourceMeasurement': 'Wall and CPU seconds per stage; peak RSS is the cumulative maximum of this COLMAP process.', 'geometry': 'Sparse triangulated feature observations only. No fitted head, inferred hidden surfaces or substitute model.' if models else 'No triangulated geometry retained. All three mapping trials failed to create a sparse model.', 'denseStatus': 'Not run: no sparse model available for dense processing.' if not models else 'Not run in this CPU experiment; GPU evaluation remains pending.', 'limitations': ['Synthetic inputs demonstrate workflow only and do not validate real-person accuracy.', 'Six views may lack overlap and texture needed for connected reconstruction.', 'Separating visible current hair and beard into independent fitting surfaces is not implemented.', 'Sparse points are not a watertight head or usable hairstyle fitting surface.', 'No mesh, compatible independent styles or verified likeness produced.'], 'unmetRequirements': ['Complete six-view head coverage', 'Client-specific editable head mesh', 'Removal or separation of current hair and beard', 'Independent compatible hairstyle and beardstyle fitting', 'Refinement and expected-result journey on reconstructed geometry']}
(directory / 'colmap-report.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=2), flush=True)
