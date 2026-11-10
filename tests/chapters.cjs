const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const script=html.split('<script>')[1].split('</script>')[0];
assert.ok(html.includes("script-src 'sha256-"+crypto.createHash('sha256').update(script).digest('base64')+"'"));
assert.equal(html.includes('\ufffd'),false);
assert.ok(html.includes(fs.readFileSync(path.join(root,'src/chapters.js'),'utf8').trim()));
async function main(){
 const server=http.createServer((req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';
  if(!['index.html','sw.js','icon.svg','manifest.webmanifest',...['greenhouse','rooftop-pond','observatory-bench','star-dome'].map(n=>'art/'+n+'.png')].includes(name))return res.writeHead(404).end();
  const type={'.html':'text/html;charset=utf-8','.js':'application/javascript','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
  res.setHeader('Content-Type',type[path.extname(name)]);res.end(fs.readFileSync(path.join(root,name)));
 }).listen(0,'127.0.0.1');
 await new Promise(r=>server.once('listening',r));
 const browser=await chromium.launch({executablePath:process.env.TEST_BROWSER_EXECUTABLE});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/?admin=1');
  await page.locator('.door-card').first().waitFor();
  await page.evaluate(()=>{window.cspFailures=[];document.addEventListener('securitypolicyviolation',e=>cspFailures.push(e.violatedDirective))});
  async function seed(n){await page.evaluate(async n=>{
   state=fresh();state.started=Date.now()-30*86400000;state.visits=[day()];
   for(const t of tasks.slice(0,n)){Object.assign(rec(t.id),{done:true,submitted:true,rewarded:true,draft:'Grüße 🌻 – für dich',rating:2});}
   state.stars=n;state.coins=n*10;state.currentOffer=null;state.active=null;route='home';await save();render();await saveQueue;
  },n)}
  for(const [n,family,home] of [[46,'lift','Aufzug'],[48,'lift','Aufzug'],[50,'garden','Dachgarten'],[58,'garden','Dachgarten'],[64,'space','Sternwarte']]){
   await seed(n);
   assert.equal(await page.locator('body').getAttribute('data-chapter'),family);
   assert.equal(await page.locator('button[data-route=home]').innerText(),home);
   if(n<50)assert.match(await page.locator('.page-title').innerText(),n===46?/frischer Erde/:/Seerosen/);
   else {
    await page.locator('.chapter-scene img').first().evaluate(img=>img.decode());
    const offer=await page.evaluate(()=>JSON.stringify(state.currentOffer));
    await page.reload();await page.locator('.door-card').first().waitFor();
    assert.equal(await page.evaluate(()=>JSON.stringify(state.currentOffer)),offer);
    assert.equal(await page.locator('dialog[open]').count(),0);
    await page.screenshot({path:path.join(root,'../chapter-'+n+'.png'),fullPage:true});
   }
  }
  // Legacy records and current offers retain their destinations, with every field preserved.
  await seed(64);
  const legacy=await page.evaluate(async()=>{
   delete state.currentOffer.chapterScene;route='room';await save();render();await saveQueue;return clone(state);
  });
  await page.reload();await page.waitForFunction(()=>storageReady);
  const restored=await page.evaluate(()=>clone(state));
  for(const field of ['revision','updated','writeToken']){delete legacy[field];delete restored[field]}
  assert.deepEqual(restored,legacy);
  assert.equal(await page.evaluate(()=>offeredScene(tasks[0])),null);
  assert.equal(await page.evaluate(()=>offeredScene(tasks.find(t=>state.currentOffer.ids.includes(t.id)))),null);
  assert.equal(await page.evaluate(()=>valid(migrate(clone(state)))),true);
  const report=await page.evaluate(()=>JSON.stringify(report('raw')));
  await page.evaluate(()=>{route='journal';render();route='room';render();route='home';render()});
  assert.equal(await page.evaluate(()=>JSON.stringify(report('raw'))),report);
  // Normal submit entry point awards once and celebrates each new chapter once.
  for(const milestone of [50,58,64]){
   await seed(milestone-1);
   const id=await page.evaluate(()=>tasks.find(t=>t.kind==='write'&&!state.records[t.id]?.done).id);
   await page.evaluate(id=>{start(id);endLift();builderSelect(0,0);builderSelect(1,1);builderSelect(2,2)},id);
   await page.locator('.submit').click();await page.locator('.chapter-welcome').waitFor();
   assert.equal(await page.evaluate(()=>discoveryCount()),milestone);
   assert.equal(await page.evaluate(()=>state.coins),milestone*10);
   await page.screenshot({path:path.join(root,'../milestone-'+milestone+'.png'),fullPage:true});
   await page.getByRole('button',{name:'Weiter',exact:true}).click();
   await page.evaluate(()=>submit());assert.equal(await page.locator('dialog[open]').count(),0);
   assert.equal(await page.evaluate(()=>state.stars),milestone);
   await page.reload();await page.waitForFunction(()=>storageReady);
   assert.equal(await page.locator('dialog[open]').count(),0);
  }
  await seed(64);
  await page.setViewportSize({width:320,height:844});
  for(const route of ['home','journal','room']){
   await page.evaluate(route=>nav(route),route);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,route+' fits phone');
  }
  await page.evaluate(()=>nav('home'));await page.screenshot({path:path.join(root,'../chapter-mobile.png'),fullPage:true});
  await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
  await context.setOffline(true);await page.reload();await page.waitForFunction(()=>storageReady);
  await page.locator('.chapter-scene img').first().evaluate(img=>img.decode());
  assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.cspFailures||[]),[]);
  console.log('PASS: 46/48/50/58/64 thresholds; original destinations; complete legacy save and currentOffer persistence; scoring/report stability; normal milestone submit and reload; Unicode; phone layout; artwork; CSP hash; offline cache.');
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r))}
}
main().catch(e=>{console.error(e);process.exitCode=1});
