#!/usr/bin/env python3
"""Verify retained real browser catalog work; never recreate deleted material."""
from datetime import datetime, timezone
import hashlib
import io
import json
from pathlib import Path
import struct
from PIL import Image
from local_demo_http import LocalDemoAPI

ROOT=Path(__file__).resolve().parents[1]
api=LocalDemoAPI(); check=api.expect
base='/clients/a0b730e5-490f-488d-ae16-4f3812ee044f'
library=check(200,api.request('/demo-library'),'real reusable catalog')
provenance=[]
for kind,count in [('hair',40),('beard',20)]:
    styles=[s for s in library[kind] if s.get('recipe',{}).get('version')=='trama-surface-styles-v1']
    assert len(styles)==count
    for s in styles:
        assert s['license']=='CC0-1.0' and s['licenseVersion'] and s['creator'] and s['sourceUrl'] and s['acquisitionDate'] and s['attributionRequirement'] and s['modifications']
        assert {v['view'] for v in s['views']}=={'front','three-quarter','profile','back'}
        data=check(200,api.request(s['modelUrl'].removeprefix('/api')),'catalog GLB '+s['id'])
        assert struct.unpack('<4sII',data[:12])==(b'glTF',2,len(data))
        for view in s['views']:
            raw=check(200,api.request(view['renderUrl'].removeprefix('/api')),'real mannequin angle '+s['id']+'/'+view['view'])
            picture=Image.open(io.BytesIO(raw));picture.load();assert picture.size==(768,896)
        provenance.append({k:s[k] for k in ['id','kind','label','license','licenseVersion','licenseUrl','creator','sourceUrl','acquisitionDate','attributionRequirement','modifications','recipe']})
jobs=check(200,api.request(base+'/demo-jobs'),'actual native runs')
options=check(200,api.request(base+'/demo-options'),'retained browser options')
runs={j['id']:j for j in jobs}
retained=[]
for candidate in ['makehuman','blender-mpfb','flame','open3d','meshlab','cloudcompare']:
    option=next(o for o in options if o['state']['candidate']==candidate and o['state']['hairId']=='trama-quiff-wavy' and o['state']['beardId']=='trama-short-boxed' and o['previewUrl'] and runs[o['state']['modelRunId']]['result'].get('catalog',{}).get('version')=='trama-surface-styles-v1')
    assert option['parentId'] and option['revision']>=2
    parent=next(o for o in options if o['id']==option['parentId'])
    assert option['revision']==parent['revision']+1 and option['state']['modelRunId']==parent['state']['modelRunId']
    state=option['state'];recipe=state['refinement']
    assert recipe['version']=='style-mesh-v2' and recipe['hair']['lengthPercent']==90 and recipe['beard']['widthPercent']==90
    if candidate=='makehuman':assert len(recipe['strokes'])==1
    raw=check(200,api.request(option['previewUrl'].removeprefix('/api')),'actual saved '+candidate+' browser picture')
    picture=Image.open(io.BytesIO(raw));picture.load();assert picture.format=='JPEG' and picture.width==400
    check(401,api.request(option['previewUrl'].removeprefix('/api'),anonymous=True),'anonymous option picture denied')
    for kind,style in [('hair',state['hairId']),('beard',state['beardId'])]:
        raw=check(200,api.request(base+'/demo-jobs/'+state['modelRunId']+'/artifacts/'+kind+'/'+style),'actual retained '+candidate+' '+kind)
        assert struct.unpack('<4sII',raw[:12])==(b'glTF',2,len(raw))
    retained.append({'candidate':candidate,'optionId':option['id'],'parentId':option['parentId'],'revision':option['revision'],'runId':state['modelRunId'],'refinement':recipe,'picturePixels':picture.size,'headScope':runs[state['modelRunId']]['result'].get('geometry'),'supportDependency':runs[state['modelRunId']]['result'].get('component',{}).get('upstream')})
refs=check(200,api.request(base+'/style-references'),'retained private professional references')
assert {r['kind'] for r in refs}=={'hair','beard'} and len(refs)==2
for ref in refs:
    assert ref['creator']=='Trama original procedural generator' and ref['license']=='professional-owned'
    raw=check(200,api.request('/assets/'+ref['assetId']+'/content'),'retained original reference image')
    Image.open(io.BytesIO(raw)).verify()
    check(401,api.request('/assets/'+ref['assetId']+'/content',anonymous=True),'anonymous reference image denied')
check(401,api.request(base+'/style-references',anonymous=True),'anonymous professional references denied')
selections=check(200,api.request(base+'/expected-results'),'persisted expanded expected selection')
mh=next(o for o in retained if o['candidate']=='makehuman')
selected=next(s for s in selections if s['optionId']==mh['optionId'])
assert selected['version']==2 and len(selected['history'])==2 and selected['history'][0]['agreementMethod']=='synthetic-demonstration'
report={'date':datetime.now(timezone.utc).isoformat(),'scope':'Actual HTTP catalog, 60 models and 240 renders, native-file access, six real saved browser revisions and decoded private pictures, original client-scoped professional references, synthetic expected selection history. Native decoded geometry/edit and browser camera/reload checks are separate retained outputs. Professional acceptance and final route selection remain pending.','provenance':provenance,'retainedOptions':retained,'professionalReferences':refs,'syntheticSelectionVersion':selected['version'],'privacyChecks':'Anonymous saved proposal pictures, references and uploaded reference images denied. Studio isolation, source erasure/withdrawal and nonrecreation are verified by meaningful Go tests.'}
(ROOT/'.scratch/execution-log/assets/catalog-live-workflow-verification.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS 60 actual reusable assets, 240 actual renders, six retained edited browser revisions, private references and preserved synthetic expected history')
