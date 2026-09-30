#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Compare visible image outlines with actual fitted renders, never hidden anatomy."""
import argparse
import hashlib
import json
from pathlib import Path
import time
import numpy as np
from PIL import Image,ImageDraw,ImageFilter

p=argparse.ArgumentParser();p.add_argument('directory',type=Path);d=p.parse_args().directory.resolve()
manifest=json.loads((d/'manifest.json').read_text());fit=json.loads((d/'fit.json').read_text())
started=time.monotonic();records=[]

def outline_mask(image):
    rgb=np.asarray(image.convert('RGB'),dtype=np.float32)
    patch=max(8,min(image.size)//32)
    corners=np.concatenate([rgb[:patch,:patch].reshape(-1,3),rgb[:patch,-patch:].reshape(-1,3),rgb[-patch:,:patch].reshape(-1,3),rgb[-patch:,-patch:].reshape(-1,3)])
    background=np.median(corners,axis=0)
    spread=float(np.quantile(np.linalg.norm(corners-background,axis=1),.95))
    mask=np.linalg.norm(rgb-background,axis=2)>18
    coverage=float(mask.mean())
    valid=spread<=8 and .01<coverage<.9
    return mask,{'backgroundRGB':background.tolist(),'cornerColorSpread95':spread,'foregroundFraction':coverage,'validUniformBackground':valid}

def boundary(mask):
    im=Image.fromarray(mask.astype(np.uint8)*255)
    return np.asarray(im.filter(ImageFilter.MaxFilter(3)))!=np.asarray(im.filter(ImageFilter.MinFilter(3)))

for item in manifest['inputs']:
    view=item['view'];source=(d/item['path']).resolve()
    if not source.is_relative_to(d) or not source.is_file():raise RuntimeError('Unavailable private source')
    rendered=d/'fitted-renders'/(view+'.png')
    observed=Image.open(source).convert('RGB').resize((768,896))
    proposed=Image.open(rendered).convert('RGB').resize(observed.size)
    observed_mask,observed_check=outline_mask(observed)
    fitted_mask,fitted_check=outline_mask(proposed)
    translation=fit.get('framingTranslations',{}).get(view,[0,0])
    # Use only the bounded image framing translation already retained by the
    # fit. No outline-derived calibration or geometry adjustment is claimed.
    dx,dy=-float(translation[0])*768,-float(translation[1])*896
    translated=Image.fromarray(fitted_mask.astype(np.uint8)*255).transform(observed.size,Image.Transform.AFFINE,(1,0,-dx,0,1,-dy),resample=Image.Resampling.NEAREST,fillcolor=0)
    fitted_mask=np.asarray(translated)>0
    intersection=int(np.count_nonzero(observed_mask&fitted_mask));union=int(np.count_nonzero(observed_mask|fitted_mask))
    valid=observed_check['validUniformBackground'] and fitted_check['validUniformBackground']
    overlay=np.asarray(observed).copy()
    overlay[boundary(observed_mask)]=[25,210,130]
    overlay[boundary(fitted_mask)]=[40,100,255]
    width=512;height=597
    figure=Image.new('RGB',(width*3,height+116),'#f4f3ee');draw=ImageDraw.Draw(figure)
    draw.text((12,10),f'{view}: observed image outline versus fitted neutral head',fill='#1e3529')
    for index,(image,label) in enumerate([(observed,'Authorized input image'),(proposed,'Actual neutral fitted render'),(Image.fromarray(overlay),'Green: input outline; blue: translated fit')]):
        draw.text((index*width+12,35),label,fill='#1e3529')
        figure.paste(image.resize((width,height)),(index*width,58))
    metric=intersection/union if valid and union else None
    draw.text((12,height+72),f'Image-mask overlap: {metric:.3f}' if metric is not None else 'Image-mask metric unavailable: background is not sufficiently uniform.',fill='#1e3529')
    draw.text((12,height+93),'Input outline includes hair, beard and neck. Hidden scalp/anatomy is inferred. This is not 3D error or likeness.',fill='#1e3529')
    figure.save(d/('silhouette-'+view+'.png'))
    records.append({'view':view,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'renderSha256':hashlib.sha256(rendered.read_bytes()).hexdigest(),'status':'available' if valid else 'unavailable','observedMask':observed_check,'fittedMask':fitted_check,'framingTranslationPixels':[dx,dy],'imageMaskIntersectionOverUnion':metric,'differentMaskPixels':int(np.count_nonzero(observed_mask^fitted_mask)) if valid else None,'imagePixels':768*896})

report={'version':'uniform-background-outline-v1','scope':'Visible image outlines compared with neutral fitted renders. Inputs are authorized images, including existing hair/beard. This diagnostic does not modify the head or reconstruct hidden anatomy.','maskMethod':'Median RGB of four corner patches; foreground color distance >18; 95th percentile corner spread <=8 and foreground coverage 1%-90%. Uniform-background diagnostic only, not a general portrait segmenter. Nonuniform backgrounds have unavailable metrics.','alignment':'Only the bounded image framing translation already retained by the landmark fit. Camera yaw, focal length and distance remain explicit assumptions.','limitations':['Observed outline includes hair and facial hair, so overlap is not skin/scalp accuracy or professional likeness.','The back has no facial framing translation and remains a template prior beneath observed hair.','Automatic outlines can omit colors close to the background or include shadows. Inspect the paired pictures; unavailable metrics are retained honestly.','No silhouette objective is added to the optimizer: fitting a bald scalp to a hair outline would create misleading anatomy.'],'views':records,'seconds':round(time.monotonic()-started,3)}
(d/'silhouette-report.json').write_text(json.dumps(report,indent=2)+'\n')
print('SILHOUETTE_DIAGNOSTIC',json.dumps({'views':len(records),'availableMasks':sum(r['status']=='available' for r in records),'seconds':report['seconds']}),flush=True)
