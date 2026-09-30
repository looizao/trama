#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Run MakeHuman's actual Human, targets and MHCLO fitting without Blender."""
import argparse
import gzip
import json
import os
from pathlib import Path
import sys
import types

ROOT = Path(__file__).resolve().parents[2]
interfaces = [line.split(':', 1)[0].strip() for line in Path('/proc/self/net/dev').read_text().splitlines() if ':' in line]
if any(interface != 'lo' for interface in interfaces):
    os.execvp('unshare', ['unshare', '--user', '--map-root-user', '--net', '--', sys.executable, str(Path(__file__).resolve()), *sys.argv[1:]])
os.umask(0o077)
import numpy as np
from geometry import export, render, camera

PRIVATE = ROOT / '.scratch/private'
SOURCE = PRIVATE / 'tools/makehuman-source/makehuman'
DATA = PRIVATE / 'tools/mpfb2/src/mpfb/data'
ASSETS = PRIVATE / 'source-assets/makehuman-system'
PARAMS = ['head/head-scale-horiz', 'head/head-scale-vert', 'head/head-scale-depth',
          'nose/nose-scale-horiz', 'nose/nose-scale-vert', 'nose/nose-scale-depth',
          'chin/chin-width', 'chin/chin-height', 'chin/chin-prominent',
          'mouth/mouth-scale-horiz', 'mouth/mouth-scale-vert', 'mouth/mouth-scale-depth']
VIEWS = [('front', 0), ('left-three-quarter', 45), ('right-three-quarter', -45),
         ('left-profile', 90), ('right-profile', -90), ('back', 180)]


def canonical(coords, origin):
    result = np.array(coords, dtype=float)[:, [0, 2, 1]] * [ .1, -.1, .1]
    result[:, 2] -= origin
    return result


def triangles(mesh, mask=None):
    faces = mesh.fvert if mask is None else mesh.fvert[mask]
    uv = mesh.fuvs if mask is None else mesh.fuvs[mask]
    first = faces[:, [0, 1, 2]]; second = faces[:, [0, 2, 3]]
    keep = faces[:, 2] != faces[:, 3]
    return np.concatenate([first, second[keep]]), np.concatenate([uv[:, [0, 1, 2]], uv[keep][:, [0, 2, 3]]])


def clip_head(xyz, faces, height=-.18):
    """Clip actual surface triangles and cap only the artificial neck plane.

    Retain original-vertex interpolation for every clipped vertex so the
    landmark fitting basis remains derived from actual native targets.
    """
    vertices, mapping, output = [], [], []
    known = {}

    def vertex(i, j=None):
        key = (i, i) if j is None else tuple(sorted([i, j]))
        if key not in known:
            if j is None:
                point = xyz[i]; fraction = 0
            else:
                fraction = (height - xyz[i, 2]) / (xyz[j, 2] - xyz[i, 2])
                point = xyz[i] * (1 - fraction) + xyz[j] * fraction
                point[2] = height
            known[key] = len(vertices); vertices.append(point)
            mapping.append((i, i if j is None else j, fraction))
        return known[key]

    for face in faces:
        polygon = []
        for k, i in enumerate(face):
            j = face[(k + 1) % 3]
            if xyz[i, 2] >= height:
                polygon.append(vertex(int(i)))
            if (xyz[i, 2] >= height) != (xyz[j, 2] >= height):
                polygon.append(vertex(int(i), int(j)))
        output.extend([polygon[0], polygon[k], polygon[k + 1]] for k in range(1, len(polygon) - 1))
    # The cut plane is a declared artificial boundary, not recovered anatomy.
    boundary = set()
    for face in output:
        for i, j in zip(face, face[1:] + face[:1]):
            if abs(vertices[i][2] - height) < 1e-8 and abs(vertices[j][2] - height) < 1e-8:
                edge = tuple(sorted([i, j]))
                if edge in boundary:
                    boundary.remove(edge)
                else:
                    boundary.add(edge)
    while boundary:
        start, current = boundary.pop(); loop = [start, current]
        while current != start:
            edge = next((edge for edge in boundary if current in edge), None)
            if edge is None:
                raise RuntimeError('Neck plane boundary did not form a closed loop')
            boundary.remove(edge); current = edge[1] if edge[0] == current else edge[0]; loop.append(current)
        loop = loop[:-1]
        # A flat artificial cap must not smooth its downward normal into the
        # original shoulder surface and create a scalloped lighting artifact.
        separate = []
        for i in loop:
            separate.append(len(vertices)); vertices.append(vertices[i].copy()); mapping.append(mapping[i])
        loop = separate
        center = np.mean([vertices[i] for i in loop], axis=0); index = len(vertices)
        vertices.append(center); mapping.append((-1, -1, 0))
        for i, j in zip(loop, loop[1:] + loop[:1]):
            cross = np.cross(vertices[i] - center, vertices[j] - center)
            output.append([index, i, j] if cross[2] < 0 else [index, j, i])
    return np.array(vertices), np.array(output), np.array(mapping)


def proxy_mesh(h, identifier, category, origin):
    import proxy
    import files3d
    path = ASSETS / category / identifier / (identifier + '.mhclo')
    fitted = proxy.loadProxy(h, str(path), type='Eyes' if category == 'eyes' else 'Hair')
    if fitted is None:
        raise RuntimeError('Actual MakeHuman proxy did not load: ' + identifier)
    mesh = files3d.loadMesh(fitted.obj_file, maxFaces=fitted.max_pole)
    if mesh is False:
        raise RuntimeError('Actual MakeHuman proxy mesh did not load: ' + identifier)
    tri, uvtri = triangles(mesh)
    # Separate seam vertices while preserving actual MHCLO-fitted coordinates.
    pairs, inverse = np.unique(np.column_stack([tri.reshape(-1), uvtri.reshape(-1)]), axis=0, return_inverse=True)
    xyz = canonical(fitted.getCoords(), origin)[pairs[:, 0]]
    uv = mesh.texco[pairs[:, 1]].copy(); uv[:, 1] = 1 - uv[:, 1]
    texture = fitted.material.diffuseTexture
    if texture and not Path(texture).is_file():
        raise RuntimeError('Required CC0 proxy texture missing: ' + texture)
    return {'name': identifier, 'xyz': xyz, 'tri': inverse.reshape(-1, 3), 'uv': uv,
            'texture': texture, 'color': [.04, .02, .01]}


def sample_surface(mesh, density, seed):
    rng = np.random.default_rng(seed)
    face = mesh['xyz'][mesh['tri']]
    cross = np.cross(face[:, 1] - face[:, 0], face[:, 2] - face[:, 0])
    areas = np.linalg.norm(cross, axis=1) / 2
    count = np.maximum(np.rint(areas * density).astype(int), 1)
    indices = np.repeat(np.arange(len(face)), count)
    bary = rng.random((len(indices), 2)); reverse = bary.sum(1) > 1; bary[reverse] = 1 - bary[reverse]
    selected = face[indices]
    points = selected[:, 0] + (selected[:, 1] - selected[:, 0]) * bary[:, 0, None] + (selected[:, 2] - selected[:, 0]) * bary[:, 1, None]
    normal = cross[indices] / np.maximum(areas[indices, None] * 2, 1e-12)
    return points, normal, rng


def beard_mesh(head, mouth_z, kind, length):
    points, normals, rng = sample_surface(head, 3000000, 7301)
    x, y, z = points.T; relative = z - mouth_z
    covered = (relative > -.038) & (relative < .025 - np.abs(x) * .30) & (y < -.015) & (normals[:, 1] < .25)
    covered &= ~((np.abs(x) < .029) & (relative > -.012) & (relative < .006))
    if kind == 'moustache':
        covered &= (np.abs(x) < .033) & (relative > .004) & (relative < .016)
    elif kind == 'goatee':
        covered &= (np.abs(x) < .033) & ((relative < -.012) | (relative > .006))
    elif kind == 'chinstrap':
        covered &= (relative < -.025) & (np.abs(x) > .013)
    points, normals = points[covered], normals[covered]
    if not len(points):
        raise RuntimeError('Actual fitted lower-face surface produced no beard')
    tangent = np.cross(normals, [0, 0, 1]); tangent /= np.maximum(np.linalg.norm(tangent, axis=1, keepdims=True), 1e-12)
    cross = np.cross(normals, tangent)
    radius = .00016 if length < .004 else .00025
    start = points + normals * .0002
    vertices = np.empty((len(points), 4, 3))
    for corner in range(3):
        angle = corner * 2 * np.pi / 3
        vertices[:, corner] = start + radius * (tangent * np.cos(angle) + cross * np.sin(angle))
    vertices[:, 3] = start + normals * length * rng.uniform(.75, 1.15, (len(points), 1)) + [0, 0, -length * .45]
    offsets = np.arange(len(points))[:, None, None] * 4
    tri = (offsets + np.array([[0, 1, 3], [1, 2, 3], [2, 0, 3]])).reshape(-1, 3)
    return {'name': kind, 'xyz': vertices.reshape(-1, 3), 'tri': tri, 'color': [.045, .025, .015]}


def coils_mesh(head):
    points, normals, rng = sample_surface(head, 65000, 419)
    mask = (points[:, 2] > .095) & (normals[:, 2] > -.2)
    points, normals = points[mask], normals[mask]
    tangent = np.cross(normals, [0, 0, 1])
    bad = np.linalg.norm(tangent, axis=1) < .01; tangent[bad] = np.cross(normals[bad], [0, 1, 0])
    tangent /= np.maximum(np.linalg.norm(tangent, axis=1, keepdims=True), 1e-12)
    cross = np.cross(normals, tangent)
    length = rng.uniform(.032, .05, (len(points), 1)); radius = rng.uniform(.002, .004, (len(points), 1))
    phase = rng.uniform(0, 2 * np.pi, (len(points), 1)); vertices = []
    for step in range(16):
        t = step / 15; angle = phase + t * 6 * np.pi
        center = points + normals * length * t + radius * (tangent * np.cos(angle) + cross * np.sin(angle))
        for corner in range(4):
            ring = corner * np.pi / 2
            vertices.append(center + .00065 * (tangent * np.cos(ring) + cross * np.sin(ring)))
    xyz = np.stack(vertices, axis=1).reshape(-1, 3)
    faces = []
    for step in range(15):
        for corner in range(4):
            a = step * 4 + corner; b = step * 4 + (corner + 1) % 4
            faces.extend([[a, b, b + 4], [a, b + 4, a + 4]])
    tri = (np.arange(len(points))[:, None, None] * 64 + np.array(faces)).reshape(-1, 3)
    return {'name': 'rounded-coils', 'xyz': xyz, 'tri': tri, 'color': [.028, .014, .009]}


def main():
    parser = argparse.ArgumentParser(); parser.add_argument('phase', choices=['prepare', 'export']); parser.add_argument('directory', type=Path)
    args = parser.parse_args(); directory = args.directory.resolve()
    manifest = json.loads((directory / 'manifest.json').read_text())
    user = directory / 'makehuman-user'; user.mkdir(exist_ok=True)
    os.environ['MH_HOME_LOCATION'] = str(user)
    sys.path[:0] = [str(SOURCE / p) for p in ['', 'core', 'lib', 'apps', 'shared', 'apps/gui']]
    os.chdir(SOURCE)
    import files3d
    import human
    from core import G
    # Only the upstream progress display needs an application adapter. Human,
    # target application, rest coordinates and proxy fitting remain native.
    G.app = types.SimpleNamespace(progress=lambda *args, **kwargs: None)
    h = human.Human(files3d.loadMesh(str(DATA / '3dobjs/base.obj')))
    target_dir = directory / 'makehuman-targets'; target_dir.mkdir(exist_ok=True)

    def target(name):
        destination = target_dir / name.replace('/', '_').removesuffix('.gz')
        if not destination.exists():
            with gzip.open(DATA / 'targets' / name, 'rb') as source:
                destination.write_bytes(source.read())
        return str(destination)

    # Declared neutral default, never a fictional case's morph parameters.
    for race in ['african', 'asian', 'caucasian']:
        for gender in ['female', 'male']:
            h.setDetail(target(f'macrodetails/{race}-{gender}-young.target.gz'), 1 / 6)
    for gender in ['female', 'male']:
        h.setDetail(target(f'macrodetails/universal-{gender}-young-averagemuscle-averageweight.target.gz'), .5)
    if args.phase == 'export':
        for name, value in json.loads((directory / 'fit.json').read_text())['targets'].items():
            h.setDetail(target(name), value)
    h.applyAllTargets(update=False)
    full = h.getRestposeCoordinates()
    origin = float(full[:, 1].max() * .1 - .18)
    xyz = canonical(full, origin)
    faces, _ = triangles(h.meshData, h.staticFaceMask)
    head_xyz, head_tri, mapping = clip_head(xyz, faces)
    head = {'name': 'Standalone MakeHuman fitted template' if args.phase == 'export' else 'Standalone MakeHuman neutral template',
            'xyz': head_xyz, 'tri': head_tri, 'color': [.48, .31, .22]}
    eyes = proxy_mesh(h, 'low-poly', 'eyes', origin)
    if args.phase == 'export':
        with np.load(directory / 'basis.npz') as basis:
            predicted = basis['xyz'].copy()
            heights = basis['frameHeights'].copy()
            for name, value in json.loads((directory / 'fit.json').read_text())['targets'].items():
                index = np.flatnonzero(basis['names'] == name)
                if len(index) != 1:
                    raise RuntimeError('Unknown fitted native target')
                predicted += basis['deltas'][index[0]] * value
                heights += basis['frameDeltas'][index[0]] * value
            predicted[:, 2] -= (heights.max() - basis['frameHeights'].max()) * basis['frameMask']
            i, j, _ = basis['mapping'].T; i = i.astype(int); j = j.astype(int)
            valid = (i >= 0) & (i == j) & (basis['xyz'][:, 2] > -.18 + 1e-8)
            error = np.linalg.norm(predicted[valid] - xyz[i[valid]], axis=1)
            check = {'basisVersion': str(basis['basisVersion']), 'mappedVertices': int(valid.sum()),
                     'maximumErrorMetres': float(error.max()), 'meanErrorMetres': float(error.mean()),
                     'toleranceMetres': .00001, 'passed': bool(error.max() <= .00001),
                     'measurement': 'Optimization-basis prediction compared against actual native Human.applyAllTargets and actual crown recentering. Artificial plane intersections and cap vertices are excluded.'}
        (directory / 'target-basis-check.json').write_text(json.dumps(check, indent=2) + '\n')
        if not check['passed']:
            raise RuntimeError('Actual MakeHuman target application differs from fitting basis')
    render_dir = directory / ('neutral-renders' if args.phase == 'prepare' else 'fitted-renders'); render_dir.mkdir(exist_ok=True)
    cameras = {}
    for view, yaw in VIEWS:
        cameras[view] = camera(yaw, manifest['settings'])
        render(render_dir / (view + '.png'), [head, eyes], cameras[view])
        print('MAKEHUMAN_RENDER', view, flush=True)
    (directory / 'cameras.json').write_text(json.dumps({view: matrix.tolist() for view, matrix in cameras.items()}))
    if args.phase == 'prepare':
        deltas, names, frame_deltas = [], [], []
        for parameter in PARAMS:
            for sign in ['decr', 'incr']:
                name = parameter + '-' + sign + '.target.gz'; values = np.zeros_like(full)
                with open(target(name)) as source:
                    for line in source:
                        if line.strip() and not line.startswith('#'):
                            row = line.split(); values[int(row[0])] = [float(value) for value in row[1:4]]
                i, j, fraction = mapping.T; i = i.astype(int); j = j.astype(int)
                delta = canonical(values[i] * (1 - fraction[:, None]) + values[j] * fraction[:, None], 0)
                # The actual highest vertex can change after morphing. Keep
                # all native heights so the optimizer predicts the same max,
                # rather than assuming the neutral crown remains highest.
                frame_deltas.append(values[:, 1] * .1)
                on_plane = np.abs(head_xyz[:, 2] + .18) < 1e-8
                delta[on_plane, 2] = 0
                delta[i < 0] = 0
                deltas.append(delta); names.append(name)
        np.savez_compressed(directory / 'basis.npz', xyz=head['xyz'], tri=head['tri'],
                            deltas=np.array(deltas), names=np.array(names), params=np.array(PARAMS),
                            mapping=mapping, basisVersion=np.array('makehuman-metre-z-up-v2'),
                            frameHeights=full[:, 1].astype(float) * .1, frameDeltas=np.array(frame_deltas),
                            frameMask=(head_xyz[:, 2] > -.18 + 1e-8))
        export(directory / 'neutral.glb', [head, eyes])
    else:
        export(directory / 'head.glb', [head, eyes])
        (directory / 'hair').mkdir(exist_ok=True); (directory / 'beard').mkdir(exist_ok=True)
        styles = json.loads((PRIVATE / 'demo-assets/hair-catalog.json').read_text())
        for style in styles:
            name = style['id']
            mesh = coils_mesh(head) if name == 'rounded-coils' else proxy_mesh(h, name, 'hair', origin)
            export(directory / 'hair' / (name + '.glb'), [mesh])
        # The original shared beard definitions are sampled on the actual
        # fitted lower face. These are new compatible meshes, not canned ones.
        lip_points=[c['nativeVertexIndex'] for c in json.loads((directory/'fit.json').read_text())['semanticCorrespondences'] if c['view']=='front' and c['landmarkIndex'] in [13,14]]
        if len(lip_points)!=2:
            raise RuntimeError('Front visible lip correspondences required for beard placement; rig joints are not surface landmarks')
        with np.load(directory/'basis.npz') as basis:
            lip_mapping=basis['mapping'][lip_points]
        if np.any(lip_mapping[:,0]!=lip_mapping[:,1]) or np.any(lip_mapping[:,0]<0):
            raise RuntimeError('Visible lips must map to actual native skin vertices, not artificial neck intersections')
        native_lips=lip_mapping[:,0].astype(int)
        mouth_z=float(xyz[native_lips,2].mean())
        attachment={'version':'makehuman-visible-lips-v2','method':'Neutral front upper/lower lip correspondences 13 and 14 mapped through the retained clipping map to actual native Human vertices after fitting. Neither rig mouth joints nor potentially reordered neck-clipped indices are used as visible lip positions.','lipBasisVertices':lip_points,'nativeLipVertices':native_lips.tolist(),'mouthHeightMetres':mouth_z,'limitations':'Landmark-to-template correspondence and procedural coverage remain approximate; inspect lip boundaries, cheeks and all angles.'}
        (directory/'makehuman-style-attachment.json').write_text(json.dumps(attachment,indent=2)+'\n')
        for kind, length in {'stubble': .0017, 'full': .012, 'goatee': .009, 'moustache': .007, 'chinstrap': .006}.items():
            export(directory / 'beard' / (kind + '.glb'), [beard_mesh(head, mouth_z, kind, length)])
        (directory / 'makehuman-shape.json').write_text(json.dumps({
            'software': 'MakeHuman 1.3.0', 'sourceCommit': '1f508f6083b2f823dab15de924b3bde72e08d77c',
            'nativeHumanVertices': len(full), 'headVertices': len(head['xyz']), 'headTriangles': len(head['tri']),
            'hair': len(styles), 'beard': 5, 'units': 'metres', 'interchange': 'GLB Y up, face +Z', 'styleAttachment':attachment,
            'processing': 'Native Human.applyAllTargets and proxy.getCoords; CPU triangle rasterizer; no Blender.',
            'limitations': ['Neck ends at an artificial clipped plane with a flat cap, not reconstructed underside anatomy.', 'Hair uses the native unsmoothed MHCLO topology; clipping and professional acceptance must be reviewed.',
                            'Head is entirely fitted or inferred from a CC0 prior; hidden surfaces are not observed geometry.']}, indent=2) + '\n')
    print('MAKEHUMAN_COMPLETE', args.phase, len(head['xyz']), len(head['tri']), flush=True)


if __name__ == '__main__':
    main()
