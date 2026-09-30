# SPDX-License-Identifier: GPL-3.0-or-later
"""Original reusable style recipes. Generated geometry is dedicated to CC0-1.0.

Roots are sampled on the actual supplied skin, not an invented head primitive.
These are stylized proposals requiring professional feasibility review.
"""
import numpy as np
import json
from pathlib import Path
from geometry import normals
from procedural_styles import sample_surface

VERSION = 'trama-surface-styles-v1'


def load_catalog(directory, kind):
    snapshot = Path(directory) / 'style-catalog.json'
    if snapshot.is_file(): return json.loads(snapshot.read_text())[kind]
    root = Path(__file__).resolve().parents[2]
    return json.loads((root / '.scratch/private/demo-assets' / (kind + '-catalog.json')).read_text())


def style_provenance(style):
    return {k: style[k] for k in ['id', 'creator', 'license', 'licenseUrl', 'acquisitionDate', 'recipe'] if k in style}


def definitions():
    hair = []
    families = [
        ('buzz', 'Close buzz', 3, 'short', 'low', 'uniform'),
        ('crew', 'Graduated crew', 16, 'short', 'low', 'crew'),
        ('ivy', 'Ivy side sweep', 28, 'short', 'moderate', 'part'),
        ('crop', 'Textured forward crop', 32, 'short', 'low', 'fringe'),
        ('side-part', 'Defined side part', 48, 'short', 'moderate', 'part'),
        ('slick', 'Slicked back layers', 65, 'medium', 'moderate', 'back'),
        ('quiff', 'Raised front quiff', 72, 'medium', 'high', 'quiff'),
        ('pompadour', 'Rounded pompadour', 90, 'medium', 'high', 'pomp'),
        ('shag', 'Layered medium shag', 115, 'medium', 'moderate', 'shag'),
        ('long', 'Long flowing layers', 235, 'long', 'high', 'long'),
    ]
    for family, label, length, category, care, shape in families:
        for texture in ['straight', 'wavy', 'curly', 'coily']:
            # Texture changes actual strand shape and volume, not only labels.
            identifier = 'trama-' + family + '-' + texture
            recipe = {'version': VERSION, 'family': shape, 'lengthMm': length,
                      'texture': texture, 'density': 'medium', 'hairline': 'natural'}
            if family == 'ivy' and texture == 'straight': recipe.update(hairline='receding', density='sparse')
            if family in ['quiff', 'pompadour'] or texture == 'coily': recipe['density'] = 'dense'
            hair.append({'id': identifier, 'kind': 'hair', 'label': label + ' / ' + texture,
                         'length': category, 'lengthMm': length, 'texture': texture,
                         'density': recipe['density'], 'coverage': recipe['hairline'],
                         'maintenance': care, 'recipe': recipe})
    beard = []
    styles = [
        ('light-stubble', 'Light even stubble', 'full', 1, 'straight', 'low'),
        ('heavy-stubble', 'Heavy stubble', 'full', 3, 'straight', 'moderate'),
        ('soft-stubble', 'Soft wavy stubble', 'full', 4, 'wavy', 'low'),
        ('short-boxed', 'Short boxed beard', 'boxed', 9, 'straight', 'moderate'),
        ('rounded-full', 'Rounded short full beard', 'full', 14, 'wavy', 'moderate'),
        ('curly-full', 'Curly full beard', 'full', 22, 'curly', 'moderate'),
        ('coily-full', 'Coily full beard', 'full', 26, 'coily', 'moderate'),
        ('medium-rounded', 'Medium rounded beard', 'full', 35, 'straight', 'high'),
        ('long-tapered', 'Long tapered beard', 'tapered', 65, 'straight', 'high'),
        ('long-curly', 'Long curly beard', 'tapered', 58, 'curly', 'high'),
        ('circle', 'Connected circle beard', 'circle', 8, 'straight', 'moderate'),
        ('goatee', 'Rounded chin goatee', 'goatee', 12, 'wavy', 'moderate'),
        ('anchor', 'Anchor beard', 'anchor', 9, 'straight', 'high'),
        ('van-dyke', 'Van Dyke beard and moustache', 'van-dyke', 14, 'straight', 'high'),
        ('moustache', 'Natural full moustache', 'moustache', 8, 'straight', 'moderate'),
        ('chevron', 'Chevron moustache', 'moustache', 13, 'straight', 'moderate'),
        ('beardstache', 'Moustache with short beard', 'beardstache', 5, 'straight', 'moderate'),
        ('chinstrap', 'Soft jawline chinstrap', 'chinstrap', 6, 'straight', 'high'),
        ('soul-patch', 'Small rounded soul patch', 'soul-patch', 5, 'straight', 'moderate'),
        ('limited-coverage', 'Limited cheek coverage beard', 'limited', 9, 'wavy', 'low'),
    ]
    for identifier, label, shape, length, texture, care in styles:
        beard.append({'id': 'trama-' + identifier, 'kind': 'beard', 'label': label,
                      'length': 'short' if length <= 4 else 'medium' if length <= 22 else 'long',
                      'lengthMm': length, 'texture': texture, 'density': 'sparse' if shape == 'limited' else 'medium',
                      'coverage': shape, 'maintenance': care,
                      'recipe': {'version': VERSION, 'family': shape, 'lengthMm': length, 'texture': texture}})
    return hair, beard


def scalp_height(points, recipe):
    x, y, z = points.T
    # Continuous forehead-to-temple-to-nape boundary. Ears remain outside roots.
    radial = np.maximum(np.sqrt(x * x + (y + .065) ** 2), .001)
    front = np.clip(-(y + .065) / radial, 0, 1)
    side = np.clip(np.abs(x) / radial, 0, 1)
    height = .015 + .080 * front + .060 * side ** 2
    height += .040 * np.clip((np.abs(x) - .066) / .010, 0, 1)
    if recipe.get('hairline') == 'receding':
        height += .035 * np.clip(np.abs(x) / .065, 0, 1) * front
    return height


def hair_profile(points, recipe):
    x, y, z = points.T
    length = recipe['lengthMm'] / 1000
    top = np.clip((z - .04) / .12, 0, 1)
    front = np.clip((-y - .035) / .075, 0, 1)
    family = recipe['family']
    profile = np.ones(len(points))
    if family in ['crew', 'fringe', 'part', 'quiff', 'pomp']:
        profile = .12 + .88 * top
    if family in ['quiff', 'pomp']: profile *= .45 + .65 * front
    if family == 'crew': profile *= .65 + .35 * front
    if family in ['long', 'shag']:
        # Short swept front guides leave the face clear; longer lateral and
        # rear roots fall beyond the skull rather than through facial skin.
        profile = np.where(y < -.055, np.minimum(.008 / length, 1), profile)
    return length * profile


def tube_paths(paths, widths, name, color):
    count, steps, _ = paths.shape
    tangents = np.gradient(paths, axis=1)
    tangents /= np.maximum(np.linalg.norm(tangents, axis=2, keepdims=True), 1e-12)
    side = np.cross(tangents, [0, 0, 1])
    bad = np.linalg.norm(side, axis=2) < .01
    side[bad] = np.cross(tangents[bad], [0, 1, 0])
    side /= np.maximum(np.linalg.norm(side, axis=2, keepdims=True), 1e-12)
    other = np.cross(tangents, side)
    vertices = np.stack([paths + widths[:, :, None] * (np.cos(a) * side + np.sin(a) * other)
                         for a in np.arange(3) * 2 * np.pi / 3], axis=2)
    base = np.arange(count)[:, None, None] * steps * 3 + np.arange(steps - 1)[None, :, None] * 3
    faces = []
    for corner in range(3):
        a = base[:, :, 0] + corner; b = base[:, :, 0] + (corner + 1) % 3
        faces.extend([np.stack([a, b, b + 3], axis=-1), np.stack([a, b + 3, a + 3], axis=-1)])
    return {'name': name, 'xyz': vertices.reshape(-1, 3),
            'tri': np.stack(faces, axis=2).reshape(-1, 3), 'color': color}


def hair_meshes(head, recipe, identifier):
    assert recipe['version'] == VERSION
    xyz, triangles = head['xyz'], head['tri']
    normal = normals(xyz, triangles)
    margin = xyz[:, 2] - scalp_height(xyz, recipe)
    faces = triangles[(margin[triangles] > -.001).all(1)]
    used, inverse = np.unique(faces, return_inverse=True)
    height = hair_profile(xyz[used], recipe)
    feather = np.clip(margin[used] / .02, 0, 1)
    # Real continuous scalp mesh closes coverage between separate strands.
    cap_height = np.minimum(height * .36, .018) if recipe['family'] in ['long', 'shag', 'back'] else height * .55
    cap_points = xyz[used] + normal[used] * (.001 + cap_height * feather)[:, None]
    if recipe['family'] == 'part': cap_points[:, 0] += height * .20 * feather
    if recipe['family'] == 'back': cap_points[:, 1] += height * .25 * feather
    texture_volume = {'straight': 0, 'wavy': .002, 'curly': .004, 'coily': .007}[recipe['texture']]
    cap_points += normal[used] * (texture_volume * feather * (.6 + .4 * np.sin(xyz[used, 0] * 330) * np.cos(xyz[used, 1] * 330)))[:, None]
    cap = {'name': identifier + '-scalp', 'xyz': cap_points,
           'tri': inverse.reshape(-1, 3), 'color': [.025, .013, .008]}
    points, normals_, rng = sample_surface(head, 28000, 419)
    mask = (points[:, 2] > scalp_height(points, recipe)) & (normals_[:, 2] > -.4)
    stride = 2 if recipe['family'] in ['long', 'shag'] else 3
    points, normals_ = points[mask][::stride], normals_[mask][::stride]
    if recipe.get('density') == 'sparse':
        points, normals_ = points[::2], normals_[::2]
    length = hair_profile(points, recipe) * rng.uniform(.85, 1.12, len(points))
    family, texture = recipe['family'], recipe['texture']
    if family in ['long', 'shag']: length = np.minimum(length, np.maximum(points[:, 2] + .11, .008))
    side = np.cross(normals_, [0, 0, 1]); bad = np.linalg.norm(side, axis=1) < .01
    side[bad] = np.cross(normals_[bad], [0, 1, 0])
    side /= np.maximum(np.linalg.norm(side, axis=1, keepdims=True), 1e-12)
    cross = np.cross(normals_, side)
    phase = rng.uniform(0, 2 * np.pi, len(points))
    paths = []; steps = 12 if texture in ['curly', 'coily'] else 8
    for step in range(steps):
        t = step / (steps - 1)
        outward = normals_ * (length * (.025 + .75 * t))[:, None]
        direction = np.zeros_like(points)
        if family == 'part': direction[:, 0] = length * .65 * t; direction[:, 1] = length * .20 * t
        elif family == 'back': direction[:, 1] = length * .85 * t; outward *= .45
        elif family == 'fringe': direction[:, 1] = -length * .45 * t; direction[:, 2] = -length * .28 * t
        elif family in ['quiff', 'pomp']: direction[:, 1] = length * .45 * t; direction[:, 2] = length * .15 * np.sin(t * np.pi / 2)
        elif family in ['long', 'shag']:
            direction[:, 2] = -length * t ** 1.6
            outward *= (1 - .70 * t)
            direction[:, 1] = length * .16 * t
            lateral = points[:, 1] >= -.055
            direction[lateral, 0] += np.sign(points[lateral, 0]) * .025 * t
            direction[lateral, 1] += .020 * t
        amplitude = {'straight': .0004, 'wavy': .004, 'curly': .009, 'coily': .0045}[texture]
        turns = {'straight': .3, 'wavy': 1.0, 'curly': 2.0, 'coily': 4.0}[texture]
        angle = phase + t * turns * 2 * np.pi
        curl = amplitude * np.sin(t * np.pi / 2) * (side * np.cos(angle)[:, None] + cross * np.sin(angle)[:, None])
        paths.append(points + outward + direction + curl)
    paths = np.stack(paths, axis=1)
    thickness = (.0024 if texture in ['curly', 'coily'] else .0017) if family in ['long', 'shag'] else (.0009 if texture != 'coily' else .0013)
    width = np.full((len(points), steps), thickness)
    width *= np.linspace(1, .4 if family in ['long', 'shag'] else .2, steps)
    strands = tube_paths(paths, width, identifier + '-strands', [.040, .021, .013])
    return [cap, strands]


def beard_mask(points, normal, mouth_z, family):
    x, y, z = points.T; r = z - mouth_z
    chin = (x / .064) ** 2 + ((r + .025) / .060) ** 2
    lip = (x / .027) ** 2 + (r / .008) ** 2
    upper = .030 - np.abs(x) * .42
    mask = (chin < 1) & (r < upper) & (r > -.078) & (y < -.045) & (normal[:, 1] < .20) & (lip > 1.2)
    moustache = ((x / .034) ** 2 + ((r - .013 + np.abs(x) * .08) / .007) ** 2 < 1) & (r > .006)
    goatee = ((x / .034) ** 2 + ((r + .030) / .034) ** 2 < 1) & (r < -.009)
    if family == 'moustache': mask &= moustache
    elif family == 'goatee': mask &= goatee
    elif family == 'circle': mask &= moustache | goatee | ((np.abs(x) > .021) & (np.abs(x) < .031) & (r < .014) & (r > -.035))
    elif family == 'van-dyke': mask &= moustache | goatee
    elif family == 'anchor': mask &= moustache | ((r < -.023) & ((x / .047) ** 2 + ((r + .033) / .02) ** 2 < 1)) | ((np.abs(x) < .010) & (r < -.010))
    elif family == 'soul-patch': mask &= ((x / .010) ** 2 + ((r + .018) / .012) ** 2 < 1)
    elif family == 'chinstrap': mask &= (r < -.028) & (r > -.056) & (np.abs(x) > .013)
    elif family == 'boxed': mask &= r > -.058
    elif family == 'limited': mask &= (np.abs(x) < .034) | ((np.abs(x) > .050) & (r < -.018))
    return mask, moustache


def beard_meshes(head, mouth_z, recipe, identifier):
    assert recipe['version'] == VERSION
    points, normal, rng = sample_surface(head, 260000, 7301)
    mask, moustache = beard_mask(points, normal, mouth_z, recipe['family'])
    points, normal, moustache = points[mask][::2], normal[mask][::2], moustache[mask][::2]
    if not len(points): raise RuntimeError('Actual fitted lower-face coverage is empty')
    length = np.full(len(points), recipe['lengthMm'] / 1000)
    if recipe['family'] == 'beardstache': length[moustache] = .014
    if recipe['family'] == 'tapered': length *= np.clip(1 - np.abs(points[:, 0]) / .065, .2, 1)
    length *= rng.uniform(.8, 1.1, len(points))
    side = np.cross(normal, [0, 0, 1]); side /= np.maximum(np.linalg.norm(side, axis=1, keepdims=True), 1e-12)
    cross = np.cross(normal, side); phase = rng.uniform(0, 2 * np.pi, len(points))
    texture = recipe['texture']; amplitude = {'straight': .00015, 'wavy': .0012, 'curly': .0028, 'coily': .0018}[texture]
    paths = []
    for step in range(6):
        t = step / 5; angle = phase + t * (4 if texture == 'coily' else 2) * np.pi
        curl = amplitude * t * (side * np.cos(angle)[:, None] + cross * np.sin(angle)[:, None])
        paths.append(points + normal * (.0005 + length * t * .65)[:, None] + np.array([0, 0, -1]) * (length * t * .70)[:, None] + curl)
    width = np.full((len(points), 6), .00040) * np.linspace(1, .2, 6)
    strands = tube_paths(np.stack(paths, axis=1), width, identifier, [.042, .023, .013])
    return [strands]
