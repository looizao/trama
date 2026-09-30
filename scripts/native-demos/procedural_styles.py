# SPDX-License-Identifier: GPL-3.0-or-later
"""Shared Trama-authored CC0 strand definitions sampled on actual native skin."""
import numpy as np

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
