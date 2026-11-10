"""Create a portable review copy with isolated sample progress."""
from pathlib import Path
import base64
import hashlib
import re

root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text('utf-8')
html=html.replace('<script>', "<script>const PREVIEW_COUNT=Number(new URLSearchParams(location.search).get('demo')||50);\n",1)
html=html.replace("PREFIX='tuerenland_'", "PREFIX='tuerenland_chapters17_preview_'+PREVIEW_COUNT+'_'")
html=html.replace('  const newVisit=', '''  if(!recovered){
    for(const task of tasks.slice(0,[0,46,48,49,50,57,58,63,64].includes(PREVIEW_COUNT)?PREVIEW_COUNT:50)){
      Object.assign(rec(task.id),{done:true,submitted:true,rewarded:true});
    }
    state.stars=discoveryCount();state.coins=state.stars*10;
  }
  const newVisit=''')
html=re.sub(r"if\(/\^https\?:\$/.test\(location.protocol\).*?(?=</script>)",'',html,flags=re.S)
html=html.replace('<link rel="manifest" href="manifest.webmanifest">','').replace('<link rel="icon" href="icon.svg">','')
for name in ['rooftop-pond','greenhouse','observatory-bench','star-dome']:
    data=base64.b64encode((root/'art'/f'{name}.png').read_bytes()).decode()
    # chapterPanel constructs its URL dynamically.
    html=html.replace('src="art/${image}.png"', 'src="${PREVIEW_ART[image]}"')
    html=html.replace('<script>',f'<script>\nvar PREVIEW_ART=Object.assign(typeof PREVIEW_ART===\'undefined\'?{{}}:PREVIEW_ART,{{"{name}":"data:image/png;base64,{data}"}});',1)
bar='<aside style="padding:12px;text-align:center;background:#fff3bb;font:15px sans-serif">Lokale Vorschau · Beispielstand · '
bar+=' · '.join(f'<a href="?demo={n}">{label}</a>' for n,label in [(0,'Anfang'),(46,'46'),(48,'48'),(49,'Vor dem Garten'),(50,'Dachgarten'),(57,'Vor dem Gewächshaus'),(58,'Gewächshaus'),(63,'Vor der Sternwarte'),(64,'Sternwarte')])
html=html.replace('<body>','<body>'+bar+'</aside>')
script=html.split('<script>')[1].split('</script>')[0]
digest=base64.b64encode(hashlib.sha256(script.encode()).digest()).decode()
html=re.sub(r"script-src 'sha256-[^']+'",f"script-src 'sha256-{digest}'",html)
(root/'preview.html').write_bytes(html.encode())
