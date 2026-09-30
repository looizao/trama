"""Loopback-only verification helpers using the mandated local demo account."""
import http.cookiejar
import json
import os
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
        env=dict(line.split('=',1) for line in (RUNTIME/'local.env').read_text().splitlines())
        # Private loopback-only session reuse avoids repeated successful logins
        # consuming the app's real brute-force limit during sequential checks.
        cookie_path=RUNTIME/'verification-session.cookies'
        jar=http.cookiejar.MozillaCookieJar(str(cookie_path))
        if cookie_path.exists():
            if cookie_path.is_symlink() or cookie_path.stat().st_mode & 0o077:
                raise RuntimeError('verification session file must be private and not a symlink')
            jar.load(ignore_discard=True)
        self.studio=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
        status,user=self.request('/me')
        if status==200:
            if user.get('email')!=env['ADMIN_EMAIL']:
                raise RuntimeError('cached session is not the mandated local demo account')
            print('PASS mandated local demo account session reuse: HTTP 200')
            return
        if status!=401:
            raise RuntimeError(f'local session verification failed: HTTP {status}')
        jar.clear()
        self.expect(200,self.request('/login',{'email':env['ADMIN_EMAIL'],'password':env['ADMIN_PASSWORD']}),'mandated local demo account login')
        temporary=cookie_path.with_suffix('.tmp')
        fd=os.open(temporary,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        os.close(fd)
        try:
            jar.save(str(temporary),ignore_discard=True)
            os.replace(temporary,cookie_path)
        finally:
            temporary.unlink(missing_ok=True)
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
