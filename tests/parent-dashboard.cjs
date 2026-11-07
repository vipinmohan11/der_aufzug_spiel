const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
(async()=>{
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html;charset=utf-8');res.end(fs.readFileSync(path.join(__dirname,'../index.html')))}).listen(0,'127.0.0.1');
 await new Promise(r=>server.once('listening',r));
 const browser=await chromium.launch({executablePath:process.env.TEST_BROWSER_EXECUTABLE||undefined});
 try{
  const page=await browser.newPage({serviceWorkers:'block',viewport:{width:1280,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/?admin=1');
  await page.locator('.door-card').first().waitFor();
  assert.equal(await page.locator('footer').isVisible(),false);
  assert.equal(await page.locator('#mode').isVisible(),false);
  await page.evaluate(()=>{state.owned=['gold','scarf','bowl'];state.coins=20;route='room';render()});
  assert.equal(await page.locator('.room-shop [data-ownership=unassigned]').count(),2);
  assert.equal(await page.locator('.room-shop [data-ownership=available]').count(),4);
  assert.equal(await page.locator('.room-shop [data-ownership=owned]').count(),0);
  for(const id of ['scarf','bowl'])await page.locator('[data-shop-item='+id+']').click();
  assert.equal(await page.locator('[data-room-item]').count(),2);
  assert.equal(await page.evaluate(()=>state.coins),20);
  for(const room of ['mouse','rabbit','pony']){
   await page.evaluate(room=>chooseRoom(room),room);
   assert.equal(await page.locator('.room-shop [data-ownership=available]').count(),6);
   assert.equal(await page.locator('[data-room-item]').count(),0);
  }
  await page.evaluate(()=>chooseRoom('mouse'));
  await page.locator('[data-shop-item=plant]').click();
  assert.equal(await page.evaluate(()=>state.coins),0);
  await page.evaluate(()=>chooseRoom('penguin'));
  assert.equal(await page.locator('[data-room-item]').count(),2);
  assert.equal(await page.locator('[data-room-item=scarf] .owned-label').innerText(),'✓ In diesem Zuhause');
  await page.screenshot({path:path.join(__dirname,'../../purchase-status.png'),fullPage:true});
  await page.evaluate(()=>{parentOpen=true;route='parent';tab='report';render()});
  assert.equal(await page.locator('footer').isVisible(),true);
  assert.equal(await page.locator('.progress-ring').getAttribute('aria-label'),'0 von 72 Aktivitäten abgeschlossen');
  assert.equal(await page.locator('.feedback-chart .empty-chart').count(),6);
  await page.evaluate(()=>{
   tasks.forEach((t,i)=>Object.assign(rec(t.id),{done:true,submitted:true,completed:Date.now()-i*60000,rating:i%3,firstCorrect:objective(t)?i%2===0:null}));
   state.offers=[{ids:['R1','I1','A1'],chosen:'R1',week:0,together:false}];
   render();
  });
  const before=await page.evaluate(()=>JSON.stringify(state));
  await page.evaluate(()=>render());
  assert.equal(await page.evaluate(()=>JSON.stringify(state)),before,'Dashboard is read-only');
  assert.equal(await page.locator('.progress-ring').getAttribute('aria-label'),'72 von 72 Aktivitäten abgeschlossen');
  assert.equal(await page.getByText('Alle Entdeckungen abgeschlossen',{exact:true}).count(),1);
  assert.equal(await page.locator('.topic-row').count(),6);
  assert.deepEqual(await page.locator('.topic-row>b').allTextContents(),Array(6).fill('12 / 12'));
  assert.equal(await page.locator('.feedback-chart .feedback-stack').count(),6);
  assert.equal(await page.locator('.choice-row>b').first().innerText(),'1 / 1');
  assert.equal(await page.locator('.objective-stack').count(),1);
  assert.equal(await page.locator('.objective-stack').getAttribute('aria-label'),await page.evaluate(()=>{const ts=tasks.filter(t=>objective(t));const n=ts.filter((t)=>state.records[t.id].firstCorrect).length;return n+' erste Lösungen passten, '+(ts.length-n)+' passten noch nicht'}));
  assert.equal(await page.locator('.purchase-audit').getByText('Schal, Futterschale',{exact:true}).count(),1);
  assert.equal(await page.locator('.purchase-audit').getByText('Zimmerpflanze',{exact:true}).count(),1);
  await page.screenshot({path:path.join(__dirname,'../../parent-dashboard.png'),fullPage:true});
  for(const width of [320,390,768]){
   await page.setViewportSize({width,height:844});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  }
  await page.evaluate(()=>{parentOpen=false;route='home';render()});
  assert.equal(await page.locator('footer').isVisible(),false);
  assert.deepEqual(errors,[]);
  console.log('PASS: two old purchases remain two; other rooms have six available items; clear scarf ownership; empty and complete dashboards; accurate chart counts; read-only report; child footer hidden; responsive charts.');
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
