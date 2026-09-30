#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Render retained native measurements, never substitute a fit or an outcome."""
import importlib.util
import json
import os
from pathlib import Path
import numpy as np

ROOT=Path(__file__).resolve().parents[2]
os.environ['MPLBACKEND']='Agg'
os.environ['MPLCONFIGDIR']=str(ROOT/'.scratch/private/native-demos/matplotlib')
import matplotlib.pyplot as plt
spec=importlib.util.spec_from_file_location('cloudcompare_native',ROOT/'scripts/native-demos/process-cloudcompare.py')
cc=importlib.util.module_from_spec(spec);spec.loader.exec_module(cc)
log=ROOT/'.scratch/execution-log/assets'
imports=json.loads((ROOT/'.scratch/private/runtime/demo-asset-imports.json').read_text())
fig,axes=plt.subplots(3,3,figsize=(14,13),layout='constrained')
fig.suptitle('CloudCompare 2.13.2: retained native alignment and cross-route distances\nSynthetic Alex case, six unchanged photos. Fitted templates, no observed scan.',fontsize=16)
for column,candidate in enumerate(['blender-mpfb','makehuman','flame']):
    case=next(c for c in json.loads((log/f'cloudcompare-{candidate}-populated-results.json').read_text())['results'] if c['fictionalCase']=='alex-ramos')
    result=case['result']['component'];comparison=result['comparison']
    client=imports['cases']['alex-ramos']['clientId']
    directory=ROOT/'.scratch/private/runtime/processing'/client/case['jobId']
    before=cc.read_ply(directory/'comparison-before.ply');after=cc.read_ply(directory/'comparison-aligned.ply')
    d1=next(v for k,v in before[2].items() if 'distance' in k.lower())*1000
    d2=next(v for k,v in after[2].items() if 'distance' in k.lower())*1000
    for row,values in enumerate([d1,d2]):
        axis=axes[row,column];points=[before,after][row][0]*1000
        picture=axis.scatter(points[:,0],points[:,2],c=values,s=3,cmap='magma',vmin=0,vmax=20,rasterized=True)
        axis.set_aspect('equal');axis.set_xlabel('X (mm)');axis.set_ylabel('Z (mm)')
        axis.set_title(candidate+' vs '+comparison['referenceCandidate']+'\n'+('Before' if row==0 else 'After')+f' alignment: mean {values.mean():.3f}, max {values.max():.3f} mm',fontsize=10)
        fig.colorbar(picture,ax=axis,label='Native unsigned C2M distance (mm)')
    axis=axes[2,column]
    known=result['alignment']['iterations']
    axis.semilogy([i['iteration'] for i in known],[max(1e-9,i['inlierRmseMetres']*1000) for i in known],label='Known same-geometry perturbation')
    rows=comparison['nativeTrace'].splitlines()[1:]
    trace=[tuple(float(v.strip()) for v in line.strip().rstrip(';').split(';')) for line in rows]
    axis.semilogy([r[0] for r in trace],[max(1e-9,r[1]*1000) for r in trace],label='Different fitted reference')
    axis.set_xlabel('Native trace evaluation state');axis.set_ylabel('Native RMS (mm)');axis.grid(alpha=.25)
    axis.legend(fontsize=8);axis.set_title('Actual trace, including initial and stopping states',fontsize=10)
fig.savefig(log/'cloudcompare-native-distance-traces.png',dpi=130)
plt.close(fig)
print('Rendered actual retained unsigned distances and native trace states for three upstream comparisons.')
