#!/usr/bin/env python3
"""Exercise the running loopback app with a disposable fictional client."""
import base64
import http.cookiejar
import json
from pathlib import Path
import urllib.error
import urllib.request

runtime = Path(__file__).resolve().parent.parent / '.scratch/private/runtime'
env = dict(line.split('=', 1) for line in (runtime / 'local.env').read_text().splitlines())
base = 'http://127.0.0.1:8080'
studio = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
client = urllib.request.build_opener()

def request(path, data=None, method=None, opener=studio, body=None, content_type='application/json'):
    if data is not None:
        body = json.dumps(data).encode()
    req = urllib.request.Request(base + '/api' + path, data=body, method=method, headers={'Content-Type': content_type})
    try:
        with opener.open(req) as response:
            raw = response.read()
            return response.status, json.loads(raw) if 'application/json' in response.headers.get('Content-Type', '') else raw
    except urllib.error.HTTPError as error:
        return error.code, json.load(error)

def expect(status, response, label):
    assert response[0] == status, (label, response)
    print(f'PASS {label}: HTTP {status}')
    return response[1]

expect(401, request('/clients', opener=client), 'anonymous studio access denied')
expect(200, request('/login', {'email': env['ADMIN_EMAIL'], 'password': env['ADMIN_PASSWORD']}), 'mandated local demo account login')
record = expect(201, request('/clients', {'name': 'Disposable Privacy Workflow Client', 'email': 'fictional@example.test', 'notes': 'Disposable synthetic verification record, no real person.'}), 'fictional client created')
cid = record['id']
expect(403, request(f'/clients/{cid}/assets', body=b'no image', method='POST'), 'upload denied without acknowledgement')

def acknowledge():
    link = expect(201, request(f'/clients/{cid}/permission-link', method='POST'), 'client acknowledgement link created')
    path = link['path']
    notice = expect(200, request(path, opener=client), 'notice available without client account')
    expect(400, request(path, {'name': 'Wrong Name', 'acknowledged': True, 'noticeVersion': notice['noticeVersion']}, opener=client), 'wrong-name acknowledgement rejected')
    expect(200, request(path, {'name': record['name'], 'acknowledged': True, 'noticeVersion': notice['noticeVersion']}, opener=client), 'affirmative client entry recorded')
    expect(404, request(path, opener=client), 'used link invalidated')

image = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/iXcAAAAASUVORK5CYII=')
def upload():
    boundary = 'trama-disposable-local-fixture'
    body = (f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="fixture.png"\r\nContent-Type: image/png\r\n\r\n').encode() + image + f'\r\n--{boundary}--\r\n'.encode()
    return expect(201, request(f'/clients/{cid}/assets', body=body, content_type=f'multipart/form-data; boundary={boundary}'), 'authorized diagnostic image uploaded')

acknowledge()
asset = upload()
loaded = expect(200, request(f'/assets/{asset["id"]}/content'), 'authorized content read')
assert loaded == image
expect(400, request(f'/assets/{asset["id"]}', {'confirmed': False}, 'DELETE'), 'unconfirmed removal rejected')
impact = expect(200, request(f'/clients/{cid}/deletion-impact'), 'withdrawal impact available')
assert impact['mediaCount'] == 1
expect(200, request(f'/clients/{cid}/withdraw', {'confirmed': True}), 'withdrawal completed')
expect(404, request(f'/assets/{asset["id"]}/content'), 'withdrawn media inaccessible')
assert expect(200, request(f'/clients/{cid}/assets'), 'reload confirms media removal') == []
expect(403, request(f'/clients/{cid}/assets', body=b'no image', method='POST'), 'withdrawal blocks fresh uploads')
acknowledge()
upload()
expect(200, request(f'/clients/{cid}', {'confirmed': True}, 'DELETE'), 'entire fictional journey deleted')
expect(404, request(f'/clients/{cid}'), 'deleted client cannot reopen')
history = expect(200, request('/privacy-requests'), 'completion history survives client deletion')
assert any(item['action'] == 'client deletion' and item['status'] == 'completed' for item in history)
assert all('name' not in item and 'image' not in item for item in history)
print('PASS local privacy workflow, reload and failure checks. No external services used.')
