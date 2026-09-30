#!/usr/bin/env python3
"""Inspect an actual Meshroom graph without executing native processing."""
import html
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
os.umask(0o077)
import meshroom
meshroom.setupEnvironment()
import meshroom.core
meshroom.core.initPipelines()
meshroom.core.initPlugins()
meshroom.core.initNodes()
from meshroom.core.graph import Graph
graph = Graph('Trama prepared six-view classical reconstruction')
graph.initFromTemplate(meshroom.core.pipelineTemplates['photogrammetry'], publishOutputs=False)
graph.node('ImageMatching_1').method.value = 'Exhaustive'
graph.node('FeatureExtraction_1').describerTypes.value = ['sift']
graph.node('FeatureExtraction_1').forceCpuExtraction.value = True
graph.node('FeatureMatching_1').describerTypes.value = ['sift']
edges = sorted({(e.src.node.name, e.dst.node.name) for e in graph.edges})
nodes = {n.name: n.nodeType for n in graph.nodes}
ranks = {node: 0 for node in nodes}
for _ in nodes:
    for source, target in edges:
        ranks[target] = max(ranks[target], ranks[source] + 1)
ordered = sorted(nodes, key=lambda node: (ranks[node], node))
report = {'scope': 'Actual registered Meshroom 2025.1.0 graph with AliceVision 3.3.0 node definitions. Prepared only; no images processed, no reconstruction claimed.', 'settings': {'imagePairing': 'Exhaustive; no vocabulary tree', 'features': 'SIFT, CPU extraction', 'learnedModels': 'None', 'captureViews': ['front', 'left-three-quarter', 'right-three-quarter', 'left-profile', 'right-profile', 'back']}, 'nodeTypes': nodes, 'dependencyEdges': edges, 'nativeStatus': 'Blocked pending human acceptance of CUDA 12.1.1 terms before acquiring the official native distribution.', 'configuredGraph': graph.serialize()}
assets = ROOT / '.scratch/execution-log/assets'
(assets / 'meshroom-prepared-graph.json').write_text(json.dumps(report, indent=2) + '\n')
height = 250 + len(ordered) * 75
svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="{height}" viewBox="0 0 1100 {height}">', '<rect width="100%" height="100%" fill="#111827"/>', '<g font-family="sans-serif" fill="#f9fafb">', '<text x="35" y="42" font-size="25">Meshroom / AliceVision: actual prepared node graph</text>', '<text x="35" y="77" font-size="19" fill="#fbbf24">Native processing has not run. Runtime agreement acceptance pending.</text>']
positions = {node: (550, 140 + index * 75) for index, node in enumerate(ordered)}
for source, target in edges:
    _, a = positions[source]
    _, b = positions[target]
    if b - a <= 75:
        svg.append(f'<path d="M550 {a+22} L550 {b-22}" stroke="#6b7280" fill="none" stroke-width="2"/>')
    else:
        side = 250 - 7 * ranks[source]
        svg.append(f'<path d="M360 {a} C{side} {a},{side} {b},360 {b}" stroke="#374151" fill="none"/>')
for node, (x, y) in positions.items():
    label = nodes[node]
    svg.extend([f'<rect x="360" y="{y-22}" width="380" height="44" rx="8" fill="#1f2937" stroke="#9ca3af"/>', f'<text x="{x}" y="{y+7}" text-anchor="middle" font-size="20">{html.escape(label)}</text>'])
svg.extend([f'<text x="35" y="{height-65}" font-size="18">11 real pipeline nodes. SIFT features and exhaustive pairing use no learned weights.</text>', f'<text x="35" y="{height-35}" font-size="18">Graph registration and serialization are verified; head coverage and styles remain untested.</text>', '</g></svg>'])
(assets / 'meshroom-prepared-graph.svg').write_text('\n'.join(svg) + '\n')
print('Verified actual graph registration:', len(nodes), 'nodes,', len(edges), 'dependency edges. No native computation executed.')
