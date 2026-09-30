#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Fit the accepted FLAME 2023 Open identity basis with neutral rig/expression.

This local NumPy implementation evaluates the exact model's linear identity
basis. With all five joint rotations zero, skinning is identity and all pose
correctives vanish. No SMPL-X, RingNet, academic model or texture space is used.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import pickle
import struct
import sys

ROOT = Path(__file__).resolve().parents[2]
interfaces = [line.split(':', 1)[0].strip() for line in Path('/proc/self/net/dev').read_text().splitlines() if ':' in line]
if __name__ == '__main__' and any(interface != 'lo' for interface in interfaces):
    os.execvp('unshare', ['unshare', '--user', '--map-root-user', '--net', '--', sys.executable, str(Path(__file__).resolve()), *sys.argv[1:]])
os.umask(0o077)
import numpy as np
from geometry import export, render, camera

MODEL = ROOT / '.scratch/private/models/flame-2023-open/flame2023_Open.pkl'
MODEL_SHA = 'e75a0990728ba038c7da2a420ae4396f7ddd7781366c13026066c5b24f127623'
VERSION = 'flame-2023-open-neutral-rig-v4'
FORWARD_SHIFT = -.10
PARAMS = [f'shape_{i:02d}' for i in range(20)]
VIEWS = [('front', 0), ('left-three-quarter', 45), ('right-three-quarter', -45), ('left-profile', 90), ('right-profile', -90), ('back', 180)]
ATTRIBUTION = {
    'model': 'FLAME 2023 Open', 'creator': 'Max Planck Institute for Intelligent Systems / Max-Planck-Gesellschaft',
    'license': 'CC-BY-4.0 with additional published usage terms',
    'licenseUrl': 'https://flame.is.tue.mpg.de/modellicense.html',
    'creativeCommonsUrl': 'https://creativecommons.org/licenses/by/4.0/',
    'citation': 'Li, Bolkart, Black, Li and Romero (2017), Learning a model of facial shape and expression from 4D scans, DOI 10.1145/3130800.3130813',
    'modifications': 'Bounded fitting of first 20 identity components, coordinate conversion with -0.10 m canonical Y translation to align neutral eyeball planes with the shared mannequin, crown recentering, separate procedural eye materials, shared CC0 hairstyle radial-cage adaptation, same procedural beard definitions sampled on native fitted skin, and GLB export.',
    'geometry': 'Fitted template and inferred hidden surfaces, not observed 3D geometry. Synthetic photo inputs are labeled workflow examples, not likeness accuracy evidence.',
}


class SparseRecord:
    """Retain serialized CSC values without importing or executing SciPy code."""
    def dense(self):
        result = np.zeros(self._shape)
        for column in range(self._shape[1]):
            begin, end = self.indptr[column:column + 2]
            result[self.indices[begin:end], column] = self.data[begin:end]
        return result


class ModelReader(pickle.Unpickler):
    def find_class(self, module, name):
        allowed = {('numpy.core.numeric', '_frombuffer'): np._core.numeric._frombuffer,
                   ('numpy._core.numeric', '_frombuffer'): np._core.numeric._frombuffer,
                   ('numpy', 'dtype'): np.dtype, ('scipy.sparse._csc', 'csc_matrix'): SparseRecord}
        if (module, name) not in allowed:
            raise ValueError('Unexpected executable model class: ' + module + '.' + name)
        return allowed[module, name]


def load_model():
    if hashlib.sha256(MODEL.read_bytes()).hexdigest() != MODEL_SHA:
        raise ValueError('Only the accepted exact FLAME 2023 Open model hash is supported')
    with MODEL.open('rb') as source:
        model = ModelReader(source).load()
    assert model['v_template'].shape == (5023, 3) and model['shapedirs'].shape == (5023, 3, 400)
    assert model['f'].shape == (9976, 3) and model['f'].max() < 5023
    for key in ['v_template', 'shapedirs', 'posedirs', 'weights']:
        assert np.isfinite(model[key]).all(), key
    assert np.allclose(model['weights'].sum(1), 1, atol=1e-6)
    return model


def canonical(xyz):
    return np.asarray(xyz)[:, [0, 2, 1]] * [1, -1, 1]


def model_meshes(model, xyz):
    faces = model['f']; weights = model['weights']
    eye = np.argmax(weights, axis=1) >= 3
    is_eye = eye[faces].all(1)
    meshes = [{'name': 'FLAME 2023 Open fitted skin', 'xyz': xyz, 'tri': faces[~is_eye], 'color': [.48, .31, .22], 'provenance': ATTRIBUTION}]
    # Brown iris material is a local procedural marking on native eyeballs.
    # No separately licensed FLAME texture or borrowed eye texture is used.
    centers = model['J_regressor'].dense() @ xyz
    iris = np.zeros(len(faces), dtype=bool)
    for center in centers[3:]:
        vertices = xyz[faces]
        near_axis = np.linalg.norm(vertices[:, :, [0, 2]] - center[[0, 2]], axis=2).mean(1) < .005
        iris |= is_eye & near_axis & (vertices[:, :, 1].mean(1) < center[1])
    meshes += [{'name': 'Native FLAME eye sclera', 'xyz': xyz, 'tri': faces[is_eye & ~iris], 'color': [.78, .74, .64]},
               {'name': 'Procedural iris marking', 'xyz': xyz, 'tri': faces[iris], 'color': [.035, .018, .009]}]
    result = []
    for mesh in meshes:
        if not len(mesh['tri']): continue
        used, inverse = np.unique(mesh['tri'], return_inverse=True)
        mesh['xyz'] = mesh['xyz'][used]; mesh['tri'] = inverse.reshape(-1, 3)
        result.append(mesh)
    return result


def read_shared_glb(path, cache):
    """Read the actual shared interchange meshes, including embedded textures."""
    data = path.read_bytes(); size = struct.unpack_from('<I', data, 12)[0]
    doc = json.loads(data[20:20 + size]); offset = 20 + size
    length = struct.unpack_from('<I', data, offset)[0]; binary = data[offset + 8:offset + 8 + length]
    def accessor(index):
        a = doc['accessors'][index]; v = doc['bufferViews'][a['bufferView']]
        components = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3}[a['type']]
        dtype = {5121: 'u1', 5123: '<u2', 5125: '<u4', 5126: '<f4'}[a['componentType']]
        assert 'byteStride' not in v
        return np.frombuffer(binary, dtype=dtype, count=a['count'] * components, offset=v.get('byteOffset', 0) + a.get('byteOffset', 0)).reshape(-1, components).copy()
    meshes = []
    for node in doc['nodes']:
        if 'mesh' not in node: continue
        assert not any(k in node for k in ['matrix', 'rotation', 'scale', 'translation']), 'Shared representation requires baked transforms'
        for p in doc['meshes'][node['mesh']]['primitives']:
            positions = accessor(p['attributes']['POSITION'])
            xyz = positions[:, [0, 2, 1]] * [1, -1, 1]
            material = doc.get('materials', [{}])[p.get('material', 0)].get('pbrMetallicRoughness', {})
            m = {'name': node['name'], 'xyz': xyz, 'tri': accessor(p['indices']).reshape(-1, 3), 'color': material.get('baseColorFactor', [.045, .025, .015, 1])[:3]}
            if 'TEXCOORD_0' in p['attributes']: m['uv'] = accessor(p['attributes']['TEXCOORD_0'])
            if 'baseColorTexture' in material:
                image = doc['images'][doc['textures'][material['baseColorTexture']['index']]['source']]
                view = doc['bufferViews'][image['bufferView']]; begin = view.get('byteOffset', 0)
                texture = cache / (path.stem + '-' + str(node['mesh']) + '.png')
                texture.write_bytes(binary[begin:begin + view['byteLength']]); m['texture'] = str(texture)
            meshes.append(m)
    return meshes


def radius_field(meshes, directions, center):
    """Measure outer surface intersections for a declared coarse radial cage."""
    vertices = np.concatenate([m['xyz'][m['tri']] for m in meshes])
    e1 = vertices[:, 1] - vertices[:, 0]; e2 = vertices[:, 2] - vertices[:, 0]
    s = center - vertices[:, 0]; q = np.cross(s, e1)
    radii = []
    for ray in directions:
        h = np.cross(ray, e2); determinant = np.einsum('ij,ij->i', e1, h)
        f = np.divide(1, determinant, out=np.zeros_like(determinant), where=np.abs(determinant) > 1e-9)
        u = f * np.einsum('ij,ij->i', s, h); v = f * (q @ ray); t = f * np.einsum('ij,ij->i', e2, q)
        hit = (u >= 0) & (v >= 0) & (u + v <= 1) & (t > 0)
        radii.append(float(t[hit].max()) if hit.any() else 0)
    return np.array(radii)


def adapt_styles(directory, head, mouth_z):
    source = ROOT / '.scratch/private/demo-assets'; cache = directory / 'shared-textures'; cache.mkdir(exist_ok=True)
    reference = [m for m in read_shared_glb(source / 'neutral-head.glb', cache) if 'head' in m['name'].lower()]
    center = np.array([0., -.065, .04]); nlon, nlat = 64, 32
    lon = np.arange(nlon) * 2 * np.pi / nlon
    lat = (np.arange(nlat) + .5) * np.pi / nlat - np.pi / 2
    a, b = np.meshgrid(lon, lat)
    directions = np.stack([np.cos(b) * np.sin(a), -np.cos(b) * np.cos(a), np.sin(b)], axis=-1).reshape(-1, 3)
    old = radius_field(reference, directions, center); new = radius_field(head[:1], directions, center)
    valid = (old > .01) & (new > .01)
    raw_difference = np.where(valid, new - old, 0).reshape(nlat, nlon)
    # Rays crossing the open neck, mouth cavity or ear topology must not pull
    # hair cards across the head. Hair attachment is a bounded smooth scalp
    # deformation, and long ends below the scalp keep their original geometry.
    difference = np.clip(raw_difference, -.025, .025)
    for _ in range(2):
        padded = np.pad(difference, ((1,1),(0,0)), mode='edge')
        difference = sum(np.roll(padded[dy:dy+nlat], dx, axis=1) for dy in range(3) for dx in [-1,0,1]) / 9
    records = []
    for kind in ['hair', 'beard']:
        output = directory / kind; output.mkdir(exist_ok=True)
        for path in sorted((source / kind).glob('*.glb')):
            if kind == 'beard':
                lengths = {'stubble':.0017,'full':.012,'goatee':.009,'moustache':.007,'chinstrap':.006}
                from procedural_styles import beard_mesh
                mesh = beard_mesh(head[0], mouth_z, path.stem, lengths[path.stem]); mesh['provenance'] = ATTRIBUTION
                export(output / path.name, [mesh])
                records.append({'kind':kind,'id':path.stem,'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'method':'Same deterministic CC0 strand and coverage definition resampled on actual native FLAME lower-face surface using fitted lip semantic correspondences. No original mannequin face or beard skin baked into the output.'})
                continue
            meshes = read_shared_glb(path, cache); displaced = []
            for m in meshes:
                delta = m['xyz'] - center; radius = np.linalg.norm(delta, axis=1); unit = delta / np.maximum(radius[:, None], 1e-12)
                x = np.mod(np.arctan2(unit[:, 0], -unit[:, 1]), 2 * np.pi) / (2 * np.pi) * nlon
                y = np.clip((np.arcsin(np.clip(unit[:, 2], -1, 1)) + np.pi / 2) / np.pi * nlat - .5, 0, nlat - 1)
                ix, iy = x.astype(int), y.astype(int); fx, fy = x - ix, y - iy; nx = (ix + 1) % nlon; ny = np.minimum(iy + 1, nlat - 1)
                displacement = ((1 - fx) * (1 - fy) * difference[iy, ix] + fx * (1 - fy) * difference[iy, nx] + (1 - fx) * fy * difference[ny, ix] + fx * fy * difference[ny, nx])
                # Preserve the original strand/card shape and standoff. Long
                # ends outside the fitted cage receive a decaying displacement.
                source_radius = old.reshape(nlat, nlon)[iy, ix]
                fade = np.minimum(1, .04 / np.maximum(radius - source_radius, .04))
                fade *= np.clip((m['xyz'][:,2] + .04) / .10, 0, 1)
                m['xyz'] += unit * (displacement * fade)[:, None]; m['provenance'] = ATTRIBUTION
                displaced.append(float(np.abs(displacement * fade).max()))
            export(output / path.name, meshes)
            records.append({'kind': kind, 'id': path.stem, 'sourceSha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'maximumDisplacementMetres': max(displaced)})
    report = {'method': 'Hairstyles: bilinear 64x32 radial cage from actual neutral shared skin and fitted FLAME skin ray intersections, bounded to 25 mm and smoothed twice over a 3x3 neighborhood. Deformation fades below scalp and on long free ends. Preserve shared topology, material and strand standoff. Unsupported rays leave the initial cage displacement zero. Beards: shared deterministic procedural definitions resampled on actual fitted FLAME skin; lip semantic correspondences define coverage height.',
              'validCageRays': int(valid.sum()), 'totalCageRays': len(valid), 'centerMetres': center.tolist(),
              'boundedCageRays': int((np.abs(raw_difference)>.025).sum()), 'unboundedMaximumDifferenceMetres': float(np.abs(raw_difference).max()), 'attachmentLimitMetres': .025,
              'limitations': ['Coarse radial attachment is approximate; concavities, sideburns, lips and long hair require clipping inspection and later direct editing.', 'This adapts shared assets; it does not infer the client current hairstyle or beard from photographs.'], 'styles': records}
    (directory / 'flame-style-adaptation.json').write_text(json.dumps(report, indent=2) + '\n')


def main():
    parser = argparse.ArgumentParser(); parser.add_argument('phase', choices=['prepare', 'export']); parser.add_argument('directory', type=Path)
    args = parser.parse_args(); directory = args.directory.resolve(); manifest = json.loads((directory / 'manifest.json').read_text())
    model = load_model(); neutral = model['v_template'].copy(); coefficients = np.zeros(300)
    if args.phase == 'export':
        fit = json.loads((directory / 'fit.json').read_text())
        for i, name in enumerate(PARAMS): coefficients[i] = fit['signedParameters'][name]
        assert np.isfinite(coefficients).all() and np.abs(coefficients).max() <= 2.5
    # Neutral expression (100 coefficients) and all joint poses are zero.
    actual = neutral + np.einsum('vci,i->vc', model['shapedirs'][:, :, :300], coefficients)
    origin = actual[:, 1].max() - .18; xyz = canonical(actual); xyz[:, 2] -= origin; xyz[:, 1] += FORWARD_SHIFT
    meshes = model_meshes(model, xyz)
    matrices = {view: camera(yaw, manifest['settings']).tolist() for view, yaw in VIEWS}
    (directory / 'cameras.json').write_text(json.dumps(matrices, indent=2))
    if args.phase == 'prepare':
        directions = np.stack([canonical(model['shapedirs'][:, :, i]) for i in range(len(PARAMS))])
        signs = np.stack([-directions, directions], axis=1).reshape(-1, len(xyz), 3)
        frame = np.stack([-model['shapedirs'][:, 1, :len(PARAMS)].T, model['shapedirs'][:, 1, :len(PARAMS)].T], axis=1).reshape(-1, len(xyz))
        names = [name + suffix for name in PARAMS for suffix in ['_negative', '_positive']]
        np.savez_compressed(directory / 'basis.npz', xyz=xyz, tri=model['f'], deltas=signs, params=PARAMS, names=names,
                            frameHeights=neutral[:, 1], frameDeltas=frame, frameMask=np.ones(len(xyz)), basisVersion=VERSION)
    else:
        with np.load(directory / 'basis.npz') as basis:
            predicted = basis['xyz'].copy(); heights = basis['frameHeights'].copy()
            for i, name in enumerate(PARAMS):
                value = fit['signedParameters'][name]; index = 2 * i + (value >= 0)
                predicted += basis['deltas'][index] * abs(value); heights += basis['frameDeltas'][index] * abs(value)
            predicted[:, 2] -= heights.max() - basis['frameHeights'].max()
            errors = np.linalg.norm(predicted - xyz, axis=1)
            check = {'basisVersion': VERSION, 'mappedVertices': len(xyz), 'maximumErrorMetres': float(errors.max()), 'meanErrorMetres': float(errors.mean()), 'toleranceMetres': .00001, 'passed': bool(errors.max() <= .00001),
                     'measurement': 'Optimizer basis compared against direct evaluation of the accepted Open model identity tensor and actual crown recentering. Neutral rig makes skinning identity; expressions and all poses fixed to zero.'}
        (directory / 'target-basis-check.json').write_text(json.dumps(check, indent=2) + '\n')
        if not check['passed']: raise ValueError('FLAME native identity prediction differs; no head published')
        lip = [r['nativeVertexIndex'] for r in fit['semanticCorrespondences'] if r['view']=='front' and r['landmarkIndex'] in [13,14]]
        if len(lip)!=2: raise ValueError('Front lip correspondences required for native beard attachment; no fallback style used')
        export(directory / 'head.glb', meshes); adapt_styles(directory, meshes, float(xyz[lip,2].mean()))
        (directory / 'flame-shape.json').write_text(json.dumps({'modelSha256': MODEL_SHA, 'vertices': 5023, 'triangles': 9976, 'fittedIdentityComponents': coefficients[:20].tolist(), 'remainingIdentityComponents': '280 zero', 'expressions': '100 zero', 'jointRotations': '5 identity rotations', 'modelMetres': True, 'crownOriginMetres': float(origin), 'canonicalYTranslationMetres': FORWARD_SHIFT, 'translationRationale': 'Original neutral FLAME eye plane is canonical Y approximately -0.024 m; shared neutral mannequin eye plane is -0.128 m. Fixed -0.10 m coordinate alignment, not a fitted demographic or client ground-truth parameter.', 'provenance': ATTRIBUTION}, indent=2) + '\n')
    renders = directory / ('neutral-renders' if args.phase == 'prepare' else 'fitted-renders'); renders.mkdir(exist_ok=True)
    for view, _ in VIEWS:
        print('FLAME_RENDER', view, flush=True); render(renders / (view + '.png'), meshes, np.array(matrices[view]))
    if args.phase=='export':
        import importlib.util
        spec=importlib.util.spec_from_file_location('photo_texture',ROOT/'scripts/native-demos/photo-texture.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        module.evaluate(directory,meshes,matrices,manifest,fit)
    (directory / 'flame-attribution.json').write_text(json.dumps(ATTRIBUTION, indent=2) + '\n')


if __name__ == '__main__': main()
