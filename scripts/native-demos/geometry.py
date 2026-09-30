# SPDX-License-Identifier: GPL-3.0-or-later
"""Small local GLB writer and CPU rasterizer for actual triangle meshes.

Internal coordinates are metres, Z up, face -Y. GLB is metres, Y up,
face +Z. No model, online renderer or Blender process is used here.
"""
import json
import math
import struct
from pathlib import Path

import numpy as np
from PIL import Image


def normals(xyz, tri):
    n = np.zeros_like(xyz)
    faces = xyz[tri]
    face = np.cross(faces[:, 1] - faces[:, 0], faces[:, 2] - faces[:, 0])
    for corner in range(3):
        np.add.at(n, tri[:, corner], face)
    return n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-12)


def export(path, meshes):
    document = {'asset': {'version': '2.0', 'generator': 'Trama local triangle exporter'},
                'scene': 0, 'scenes': [{'nodes': []}], 'nodes': [], 'meshes': [],
                'materials': [], 'accessors': [], 'bufferViews': [], 'buffers': []}
    if meshes[0].get('provenance'):
        document['asset']['extras'] = meshes[0]['provenance']
    chunks = bytearray()

    def view(data, target=None):
        chunks.extend(b'\0' * ((-len(chunks)) % 4))
        record = {'buffer': 0, 'byteOffset': len(chunks), 'byteLength': len(data)}
        if target:
            record['target'] = target
        index = len(document['bufferViews'])
        document['bufferViews'].append(record)
        chunks.extend(data)
        return index

    def accessor(array, component, kind, target):
        array = np.ascontiguousarray(array, dtype='<u4' if component == 5125 else '<f4')
        record = {'bufferView': view(array.tobytes(), target), 'componentType': component,
                  'count': len(array), 'type': kind}
        if kind == 'VEC3':
            record.update(min=array.min(0).tolist(), max=array.max(0).tolist())
        index = len(document['accessors'])
        document['accessors'].append(record)
        return index

    for mesh in meshes:
        xyz, tri = mesh['xyz'], mesh['tri']
        if not len(tri) or not np.isfinite(xyz).all():
            raise ValueError('Empty or nonfinite actual geometry')
        rotation = np.array([[1, 0, 0], [0, 0, 1], [0, -1, 0]])
        material = {'name': mesh['name'], 'doubleSided': True,
                    'pbrMetallicRoughness': {'baseColorFactor': [*mesh.get('color', [.48, .31, .22]), 1],
                                             'metallicFactor': 0, 'roughnessFactor': .75}}
        attrs = {'POSITION': accessor(xyz @ rotation.T, 5126, 'VEC3', 34962),
                 'NORMAL': accessor((mesh['normals'] if 'normals' in mesh else normals(xyz, tri)) @ rotation.T, 5126, 'VEC3', 34962)}
        if mesh.get('texture') and 'uv' in mesh:
            texture = Path(mesh['texture'])
            image_index = len(document.setdefault('images', []))
            document['images'].append({'bufferView': view(texture.read_bytes()), 'mimeType': 'image/png'})
            texture_index = len(document.setdefault('textures', []))
            document['textures'].append({'source': image_index})
            material['pbrMetallicRoughness']['baseColorTexture'] = {'index': texture_index}
            material['pbrMetallicRoughness']['baseColorFactor'] = [1, 1, 1, 1]
            material['alphaMode'] = 'MASK'
            material['alphaCutoff'] = .3
            attrs['TEXCOORD_0'] = accessor(mesh['uv'], 5126, 'VEC2', 34962)
        material_index = len(document['materials'])
        document['materials'].append(material)
        index = len(document['meshes'])
        document['meshes'].append({'name': mesh['name'], 'primitives': [
            {'attributes': attrs, 'indices': accessor(tri.reshape(-1), 5125, 'SCALAR', 34963),
             'material': material_index, 'mode': 4}]})
        document['nodes'].append({'mesh': index, 'name': mesh['name']})
        document['scenes'][0]['nodes'].append(index)
    document['buffers'] = [{'byteLength': len(chunks)}]
    header = json.dumps(document, separators=(',', ':')).encode()
    header += b' ' * ((-len(header)) % 4)
    chunks.extend(b'\0' * ((-len(chunks)) % 4))
    data = (struct.pack('<III', 0x46546c67, 2, 12 + 8 + len(header) + 8 + len(chunks)) +
            struct.pack('<II', len(header), 0x4e4f534a) + header +
            struct.pack('<II', len(chunks), 0x004e4942) + chunks)
    Path(path).write_bytes(data)


def camera(yaw, settings, width=768, height=896):
    angle = math.radians(yaw)
    distance = settings['cameraDistance']
    position = np.array([distance * math.sin(angle), -distance * math.cos(angle), settings['cameraHeight']])
    forward = np.array([0, 0, .025]) - position
    forward /= np.linalg.norm(forward)
    right = np.cross(forward, [0, 0, 1]); right /= np.linalg.norm(right)
    up = np.cross(right, forward)
    view = np.eye(4); view[:3, :3] = np.array([right, up, -forward]); view[:3, 3] = -view[:3, :3] @ position
    # Blender's portrait AUTO sensor fit uses the longer sensor dimension.
    focal_px = max(width, height) * settings['focalLength'] / 36
    near, far = .01, 100
    projection = np.zeros((4, 4))
    projection[0, 0] = 2 * focal_px / width; projection[1, 1] = 2 * focal_px / height
    projection[2, 2] = -(far + near) / (far - near)
    projection[2, 3] = -2 * far * near / (far - near); projection[3, 2] = -1
    return projection @ view


def render(path, meshes, matrix, width=768, height=896):
    """Perspective-correct UVs, smooth lighting, actual depth and alpha tests."""
    pixels = np.full((height, width, 3), [218, 225, 228], dtype=np.uint8)
    depth = np.full((height, width), np.inf)
    light = np.array([-.4, -.8, .8]); light /= np.linalg.norm(light)
    for mesh in meshes:
        xyz, tri = mesh['xyz'], mesh['tri']
        p = np.column_stack([xyz, np.ones(len(xyz))]) @ matrix.T
        screen = np.column_stack([(p[:, 0] / p[:, 3] + 1) * width / 2,
                                  (1 - p[:, 1] / p[:, 3]) * height / 2])
        brightness = .48 + .52 * np.maximum((mesh['normals'] if 'normals' in mesh else normals(xyz, tri)) @ light, 0)
        texture = np.asarray(Image.open(mesh['texture']).convert('RGBA')) if mesh.get('texture') else None
        color = np.array(mesh.get('color', [.48, .31, .22]))
        # Linear materials are converted to display sRGB approximately here.
        color = np.power(color, 1 / 2.2) * 255
        for face in tri:
            if (p[face, 3] <= 0).any():
                continue
            s = screen[face]
            left, top = np.maximum(np.floor(s.min(0)).astype(int), 0)
            right, bottom = np.minimum(np.ceil(s.max(0)).astype(int), [width - 1, height - 1])
            if left > right or top > bottom:
                continue
            a, b, c = s
            denominator = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
            if abs(denominator) < 1e-8:
                continue
            y, x = np.mgrid[top:bottom + 1, left:right + 1]; x = x + .5; y = y + .5
            w0 = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / denominator
            w1 = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / denominator
            bary = np.stack([w0, w1, 1 - w0 - w1], axis=-1)
            z = bary @ (p[face, 2] / p[face, 3])
            valid = (bary >= -1e-5).all(-1) & (z < depth[top:bottom + 1, left:right + 1])
            if not valid.any():
                continue
            corrected = bary / p[face, 3]; corrected /= corrected.sum(-1, keepdims=True)
            shade = corrected @ brightness[face]
            rgb = shade[..., None] * color
            if texture is not None:
                uv = corrected @ mesh['uv'][face]
                tx = np.clip((uv[..., 0] * (texture.shape[1] - 1)).astype(int), 0, texture.shape[1] - 1)
                ty = np.clip((uv[..., 1] * (texture.shape[0] - 1)).astype(int), 0, texture.shape[0] - 1)
                rgba = texture[ty, tx]; valid &= rgba[..., 3] >= 77
                rgb = rgba[..., :3] * shade[..., None]
            pixels[top:bottom + 1, left:right + 1][valid] = np.clip(rgb[valid], 0, 255).astype(np.uint8)
            depth[top:bottom + 1, left:right + 1][valid] = z[valid]
    Image.fromarray(pixels).save(path)
    return depth
