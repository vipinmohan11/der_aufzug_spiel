const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const current=fs.readFileSync(path.join(root,'index.html'),'utf8');
const previous=process.env.UPGRADE_BASELINE_HTML?fs.readFileSync(process.env.UPGRADE_BASELINE_HTML,'utf8'):current;
function taskList(html){
 return JSON.parse(vm.runInNewContext(html.slice(html.indexOf('const CLUSTERS'),html.indexOf('const BUILDERS'))+';JSON.stringify(tasks)'));
}
const afterTasks=taskList(current);
const originalDigest=require('node:crypto').createHash('sha256').update(JSON.stringify(afterTasks.slice(0,48))).digest('hex');
assert.equal(originalDigest,'8cc5a377a5a6f0ca861f1006bfa7288805b3b3b0fd09669b8ab81e092755e9e3');
assert.equal(afterTasks.length,72);
assert.equal(new Set(afterTasks.map(t=>t.id)).size,72);
for(const t of afterTasks){
 if(t.kind==='quiz')assert.ok(t.correct>=0&&t.correct<t.options.length);
 if(t.solution)assert.deepEqual([...t.solution].sort(),t.items.map((_,i)=>i));
}
(async()=>{
 let upgraded=false;
 const server=http.createServer((req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';
  res.setHeader('Content-Type','text/html;charset=utf-8');
  if(name==='index.html')res.end(upgraded?current:previous);
  else res.writeHead(404).end();
 }).listen(0,'127.0.0.1');
 await new Promise(r=>server.once('listening',r));
 const browser=await chromium.launch({executablePath:process.env.TEST_BROWSER_EXECUTABLE||undefined,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({serviceWorkers:'block',viewport:{width:1280,height:900}});
  await page.goto('http://127.0.0.1:'+server.address().port+'/?admin=1');
  await page.locator('.door-card').first().waitFor();
  await page.evaluate(async()=>{
   state.coins=123;state.stars=12;state.owned=['gold','blue','scarf','bowl','plant','lamp'];
   state.color='blue';state.theme='mint';state.petName='Pip';state.lastBackup=1700000000000;
   for(const t of tasks.filter(t=>t.w===0)){const r=rec(t.id);r.done=true;r.submitted=true;r.rewarded=true;r.rating=2}
   Object.assign(rec('A2'),{draft:'Mein Bild bleibt',strokes:[[[10,20],[30,40]]],portrait:{show:true,hair:2,eyes:1,mouth:0}});
   Object.assign(rec('C3'),{builder:[1,0,2],builderFirst:[1,0,2],draft:'Meine Idee bleibt',instructions:true,interactions:6});
   state.active='C3';state.security={salt:'test-salt',pin:await hash('4321','test-salt'),recovery:await hash('SAMPLE-CODE','test-salt')};
   state.blind.note='Private Beobachtung';state.survey={note:'Erhalten'};state.settings.together=true;
   state.currentOffer={id:'existing-offer',ids:['C3','R3','A3'],week:0,at:1,together:false};
   route='room';await save();render();
  });
  const oldState=await page.evaluate(()=>JSON.parse(JSON.stringify(state)));
  upgraded=true;
  await page.reload();
  await page.locator('.builder').waitFor();
  const newState=await page.evaluate(()=>JSON.parse(JSON.stringify(state)));
  for(const field of ['updated','revision']){delete oldState[field];delete newState[field]}
  assert.deepEqual(newState,oldState,'Every existing save field survives upgrade');
  assert.equal(await page.evaluate(async()=>state.security.pin===await hash('4321',state.security.salt)),true);
  await page.getByRole('button',{name:'Reisezimmer',exact:true}).click();
  assert.equal(await page.locator('[data-room-item]').count(),0);
  assert.equal(await page.locator('.legacy-item').count(),4);
  assert.equal(await page.evaluate(()=>state.coins),123);
  const assignments=[['penguin','scarf'],['penguin','bowl'],['rabbit','plant'],['pony','lamp']];
  for(const [room,id] of assignments){
    await page.evaluate(room=>chooseRoom(room),room);
    assert.equal(await page.locator('[data-room-item]').count(),room==='penguin'&&id==='bowl'?1:0);
    assert.equal(await page.locator('#character-room .scene-art').getAttribute('src'),await page.evaluate(room=>ASSETS[room],room));
    await page.evaluate(([room,id])=>placeExistingItem(room,id),[room,id]);
    assert.equal(await page.locator('[data-room-item='+id+']').count(),1);
    assert.equal(await page.evaluate(()=>state.coins),123);
  }
  await page.evaluate(()=>chooseRoom('mouse'));
  assert.equal(await page.locator('[data-room-item=bowl]').count(),0);
  assert.equal(await page.locator('[data-room-item=worklamp]').count(),0);
  await page.getByRole('button',{name:'Werkbanklampe 20 Münzen · kaufen',exact:true}).click();
  assert.equal(await page.locator('[data-room-item=worklamp]').count(),1);
  assert.equal(await page.evaluate(()=>state.coins),103);
  await page.evaluate(()=>buyRoomItem('mouse','worklamp'));
  assert.equal(await page.evaluate(()=>state.coins),103);
  await page.getByRole('button',{name:'Zahnradmodell 25 Münzen · kaufen',exact:true}).click();
  assert.equal(await page.evaluate(()=>state.coins),78);
  await page.evaluate(()=>buyRoomItem('rabbit','gears'));
  assert.equal(await page.evaluate(()=>state.coins),78);
  await page.reload();
  await page.getByRole('button',{name:'Reisezimmer',exact:true}).click();
  assert.equal(await page.locator('[data-room-item]').count(),2);
  assert.equal(await page.evaluate(()=>state.coins),78);
  for(const id of ['scarf','bowl','plant','lamp','gold','blue'])assert.equal(await page.evaluate(id=>state.owned.includes(id),id),true);
  assert.equal(await page.evaluate(()=>rec('A2').draft),'Mein Bild bleibt');
  assert.equal(await page.evaluate(()=>rec('C3').draft),'Meine Idee bleibt');
  assert.equal(await page.evaluate(()=>valid(migrate(JSON.parse(JSON.stringify(state))))),true);
  await page.screenshot({path:path.join(root,'../character-rooms-desktop.png'),fullPage:true});
  await page.setViewportSize({width:320,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:path.join(root,'../character-rooms-mobile.png'),fullPage:true});
  const freshPage=await browser.newPage({serviceWorkers:'block'});
  await freshPage.goto('http://127.0.0.1:'+server.address().port+'/?admin=1');
  await freshPage.locator('.door-card').first().waitFor();
  for(const room of ['penguin','mouse','rabbit','pony']){
    await freshPage.evaluate(room=>{route='room';chooseRoom(room)},room);
    assert.equal(await freshPage.locator('[data-room-item]').count(),0);
    assert.equal(await freshPage.locator('.legacy-item').count(),0);
    await freshPage.evaluate(room=>buyRoomItem(room,ROOMS[room].items[0]),room);
    assert.equal(await freshPage.evaluate(()=>state.coins),0);
    assert.deepEqual(await freshPage.evaluate(()=>state.owned),['gold']);
  }
  await freshPage.close();
  await page.evaluate(()=>{state.currentOffer=null;route='home';render()});
  assert.equal(await page.locator('.door-card').count(),3);
  assert.equal(await page.evaluate(()=>offer().ids.every(id=>tasks.find(t=>t.id===id).w>0)),true);
  console.log('PASS: 48 original activities identical; 24 new activities; full legacy save retained; PIN valid; prior purchases assigned for free; separate room purchases; no free items; purchase once; phone layout; later activities available on day one.');
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
