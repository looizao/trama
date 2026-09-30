"""Loopback-only verification helpers using the mandated local demo account."""
import http.cookiejar
import json
from pathlib import Path
import struct
import urllib.error
import urllib.request
import zlib

RUNTIME=Path(__file__).resolve().parent.parent/'.scratch/private/runtime'

def diagnostic_png():
    """A small, valid colored square. This is never a client portrait."""
    def chunk(kind,data):
        return struct.pack('!I',len(data))+kind+data+struct.pack('!I',zlib.crc32(kind+data)&0xffffffff)
    rows=b''.join(b'\0'+bytes([40,100,70])*48 for _ in range(48))
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!IIBBBBB',48,48,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(rows))+chunk(b'IEND',b'')

class LocalDemoAPI:
    def __init__(self):
        self.studio=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        env=dict(line.split('=',1) for line in (RUNTIME/'local.env').read_text().splitlines())
        self.expect(200,self.request('/login',{'email':env['ADMIN_EMAIL'],'password':env['ADMIN_PASSWORD']}),'mandated local demo account login')
    def request(self,path,data=None,method=None,body=None,content_type='application/json',anonymous=False):
        if data is not None:body=json.dumps(data).encode()
        req=urllib.request.Request('http://127.0.0.1:8080/api'+path,data=body,method=method,headers={'Content-Type':content_type})
        opener=urllib.request.build_opener() if anonymous else self.studio
        try:
            with opener.open(req) as response:
                raw=response.read()
                return response.status,json.loads(raw) if 'application/json' in response.headers.get('Content-Type','') else raw
        except urllib.error.HTTPError as error:return error.code,json.load(error)
    @staticmethod
    def expect(expected,response,label):
        assert response[0]==expected,(label,response)
        print(f'PASS {label}: HTTP {expected}')
        return response[1]
