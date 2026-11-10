"""Synchronize the chapter source with the single-script offline game and its CSP."""
from pathlib import Path
import base64
import hashlib
import re

ROOT = Path(__file__).resolve().parents[1]
page = ROOT / 'index.html'
html = page.read_text(encoding='utf-8')
source = (ROOT / 'src/chapters.js').read_text(encoding='utf-8').rstrip()
start, end = '/* BEGIN chapters.js */', '/* END chapters.js */'
left, rest = html.split(start)
_, right = rest.split(end)
html = left + start + '\n' + source + '\n' + end + right
script = html.split('<script>')[1].split('</script>')[0]
digest = base64.b64encode(hashlib.sha256(script.encode()).digest()).decode()
html, count = re.subn(r"script-src 'sha256-[^']+'", f"script-src 'sha256-{digest}'", html)
assert count == 1
page.write_bytes(html.encode())
