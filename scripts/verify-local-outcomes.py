#!/usr/bin/env python3
"""Check live retained outcomes without repopulating or restoring deleted work."""
from datetime import datetime, timezone
import hashlib
import io
import json
from pathlib import Path
import struct
from PIL import Image
from local_demo_http import LocalDemoAPI

ROOT=Path(__file__).resolve().parents[1];runtime=ROOT/'.scratch/private/runtime'
imports=json.loads((runtime/'demo-asset-imports.json').read_text())
known=json.loads((runtime/'outcome-demo-imports.json').read_text())
api=LocalDemoAPI();check=api.expect
evidence=[];images={}
for key,entry in known.items():
    case=imports['cases'][key];base='/clients/'+case['clientId']
    visits=check(200,api.request(base+'/outcome-visits'),'retained '+key+' visits')
    assert api.request(base+'/outcome-visits',anonymous=True)[0]==401
    selections=check(200,api.request(base+'/expected-results'),'original '+key+' agreement history')
    options=check(200,api.request(base+'/demo-options'),'preserved '+key+' explored options')
    for phase in ['post-cut','follow-up']:
        v=next(v for v in visits if v['id']==entry[phase])
        assert v['synthetic'] and v['kind']==phase and v['expectedOptionId'] and v['expectedEventId']
        assert len(v['views']['baseline'])==len(v['views']['actual'])==8
        assert v['views']['baseline']!=v['views']['actual']
        selected=next(s for s in selections if s['consultationId']==v['consultationId'])
        event=next(e for e in selected['history'] if e['id']==v['expectedEventId'])
        assert event['sequence']==v['expectedVersion'] and event['optionId']==v['expectedOptionId'] and event['agreementMethod']=='synthetic-demonstration'
        option=next(o for o in options if o['id']==v['expectedOptionId'])
        assert option['previewUrl']
        raw=check(200,api.request(option['previewUrl'].removeprefix('/api')),'actual retained expected browser render')
        picture=Image.open(io.BytesIO(raw));picture.load();assert picture.format=='JPEG' and picture.width==400
        state=option['state'];native=base+'/demo-jobs/'+state['modelRunId']+'/artifacts/head/model'
        raw=check(200,api.request(native),'actual selected native expected head')
        assert struct.unpack('<4sII',raw[:12])==(b'glTF',2,len(raw))
        for phaseViews in v['views'].values():
            for view,id in phaseViews.items():
                if id not in images:
                    status,raw=api.request('/assets/'+id+'/content');assert status==200
                    picture=Image.open(io.BytesIO(raw));picture.load();assert picture.size==(768,896)
                    assert api.request('/assets/'+id+'/content',anonymous=True)[0]==401
                    images[id]={'id':id,'pixels':picture.size,'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw)}
        if phase=='follow-up':assert v['previousVisitId']==entry['post-cut'] and v['occurredOn']>next(x for x in visits if x['id']==entry['post-cut'])['occurredOn']
        evidence.append({'fictionalCase':key,'id':v['id'],'kind':phase,'occurredOn':v['occurredOn'],'expectedVersion':v['expectedVersion'],'expectedOptionId':v['expectedOptionId'],'expectedEventId':v['expectedEventId'],'previousVisitId':v['previousVisitId'],'synthetic':True,'baselineViews':v['views']['baseline'],'actualViews':v['views']['actual'],'nativeCandidate':state['candidate'],'nativeRunId':state['modelRunId']})
report={'date':datetime.now(timezone.utc).isoformat(),'scope':'Six live retained simulated visits, exact original expected-selection events, six actual native heads and real saved expected render pictures, 72 unique authorized source photographs decoded through the app. All inputs/outcomes are synthetic; not accuracy or actual haircut evidence. Professional acceptance and route choice pending.','checks':'Anonymous visits and every unique photo denied; post-cut/follow-up ordering and original snapshot sources retained. Source replacement, target changes, idempotent retry, cross-studio boundaries, erasure and withdrawal tested separately in meaningful Go tests.','visits':evidence,'photographs':list(images.values())}
assert len(evidence)==6 and len(images)==72
(ROOT/'.scratch/execution-log/assets/outcomes-live-verification.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS six real retained outcome records, original expected events, native geometry, saved pictures and 72 decoded private synthetic source photographs')
