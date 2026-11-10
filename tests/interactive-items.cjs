const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
(async()=>{
 const server=http.createServer((req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';
  const allowed=['index.html','sw.js','manifest.webmanifest','icon.svg','art/greenhouse.png','art/rooftop-pond.png','art/observatory-bench.png','art/star-dome.png'];
  if(!allowed.includes(name)){res.writeHead(404).end();return}
  res.setHeader('Content-Type',name.endsWith('.png')?'image/png':name.endsWith('.js')?'application/javascript':'text/html;charset=utf-8');
  res.end(fs.readFileSync(path.join(__dirname,'..',name)));
 }).listen(0,'127.0.0.1');
 await new Promise(r=>server.once('listening',r));
 const browser=await chromium.launch({executablePath:process.env.TEST_BROWSER_EXECUTABLE||undefined});
 const url='http://127.0.0.1:'+server.address().port+'/?admin=1';
 try{
  const page=await browser.newPage({serviceWorkers:'block',viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);
  await page.locator('.door-card').first().waitFor();
  await page.evaluate(async()=>{state.coins=5000;await save()});
  await page.getByRole('button',{name:'Reisezimmer',exact:true}).click();
  const catalogs=await page.evaluate(()=>Object.entries(ROOMS).map(([room,r])=>[room,r.items]));
  const results=[];
  for(const [room,items] of catalogs){
   await page.evaluate(room=>chooseRoom(room),room);
   for(const id of items){
    const before=await page.evaluate(()=>state.coins);
    const price=await page.evaluate(id=>ROOM_ITEMS[id].price,id);
    await page.locator('[data-shop-item='+id+']').click();
    assert.equal(await page.evaluate(()=>state.coins),before-price,id+' debit');
    assert.equal(await page.locator('#item-focus').getAttribute('data-focus-item'),id);
    assert.deepEqual(await page.evaluate(([room,id])=>itemUseState(room,id),[room,id]),{},id+' is not used automatically');
    for(const [other] of catalogs){
     if(other===room)continue;
     assert.equal(await page.evaluate(([room,id])=>roomItemOwned(room,id),[other,id]),false,id+' character isolation');
    }
    await page.evaluate(([room,id])=>buyRoomItem(room,id),[room,id]);
    assert.equal(await page.evaluate(()=>state.coins),before-price,id+' duplicate purchase');
    const kind=await page.evaluate(id=>ITEM_USES[id].kind,id);
    const primary=()=>page.locator('[data-use-item='+id+']');
    await primary().click();
    const placing=await page.evaluate(id=>!!ITEM_USES[id].place,id);
    if(placing){
     assert.equal(await page.locator('[data-world-item='+id+']').count(),1,id+' placed in world');
     if(id==='tickets')assert.equal(await page.locator('[data-rack-ticket]').count(),0,'rack starts empty');
     if(id!=='clock')await primary().click();
    }
    if(kind==='wear'){
     assert.equal(await page.locator('[data-equipped='+id+']').count(),1,id+' visible on actor');
     await primary().click();
     assert.equal(await page.locator('[data-equipped='+id+']').count(),0,id+' removable');
     await primary().click();
    }else if(kind==='light'){
     assert.equal(await page.locator('.room-world').evaluate(e=>e.classList.contains('room-lit')),true);
     await primary().click();
     assert.equal(await page.evaluate(([room,id])=>itemUseState(room,id).active,[room,id]),false);
     await primary().click();
    }else if(kind==='open'||kind==='insert'){
     assert.equal(await page.evaluate(([room,id])=>itemUseState(room,id).active,[room,id]),true);
     await primary().click();
     assert.equal(await page.evaluate(([room,id])=>itemUseState(room,id).active,[room,id]),false);
     await primary().click();
    }
    if(id==='clock'){
     const first=await page.locator('[data-clock-second]').getAttribute('transform');
     await page.waitForFunction(first=>document.querySelector('[data-clock-second]')?.getAttribute('transform')!==first,first,{timeout:2500});
    }
    if(id==='tickets'){
     await primary().click();await primary().click();
     assert.equal(await page.evaluate(()=>itemUseState('penguin','tickets').count),3);
     assert.equal(await page.locator('[data-rack-ticket]').count(),3,'three visible tickets');
    }
    if(id==='books')await page.getByRole('button',{name:'Weiterblättern',exact:true}).click();
    if(id==='storybox')await page.getByRole('button',{name:'Nächste Geschichte',exact:true}).click();
    if(id==='telescope'){
     const title=await page.locator('.telescope-view').innerText();
     await page.getByRole('button',{name:'Nächstes Himmelsziel',exact:true}).click();
     assert.notEqual(await page.locator('.telescope-view').innerText(),title);
    }
    if(id==='ruler'){
     assert.equal(await page.locator('[data-world-item=ruler]').innerText().then(s=>s.includes('12 cm')),true);
     await primary().click();
     assert.equal(await page.locator('[data-world-item=ruler]').innerText().then(s=>s.includes('8 cm')),true);
    }
    if(id==='penciljar'){
     const canvas=page.locator('#room-canvas');
     const box=await canvas.boundingBox();
     await page.mouse.move(box.x+box.width*.2,box.y+box.height*.4);
     await page.mouse.down();await page.mouse.move(box.x+box.width*.7,box.y+box.height*.6,{steps:8});await page.mouse.up();
     assert.equal(await page.evaluate(()=>itemUseState('rabbit','penciljar').strokes.length),1);
    }
    const expected=await page.evaluate(([room,id])=>JSON.parse(JSON.stringify(itemUseState(room,id))),[room,id]);
    await page.evaluate(()=>saveQueue);
    await page.reload();
    await page.locator('.door-card').first().waitFor();
    await page.getByRole('button',{name:'Reisezimmer',exact:true}).click();
    await page.locator('.room-world').waitFor();
    assert.deepEqual(await page.evaluate(([room,id])=>itemUseState(room,id),[room,id]),expected,id+' reload');
    assert.equal(await page.locator('#item-focus').getAttribute('data-focus-item'),id,id+' focused activity restored');
    assert.equal(await page.evaluate(()=>valid(state)),true,id+' valid saved format');
    await page.locator('[data-shop-item='+id+']').click();
    if(kind==='wear')assert.equal(await page.locator('[data-equipped='+id+']').count(),1,id+' restored equipment');
    else assert.equal(await page.locator('[data-world-item='+id+']').count(),id==='cushion'?0:1,id+' restored placement');
    if(id==='penciljar'){
     assert.equal(await page.locator('#room-canvas').count(),1,'drawing editor restored');
     assert.equal(await page.locator('#room-canvas').evaluate(canvas=>canvas.getContext('2d').getImageData(270,180,1,1).data[0]<100),true,'saved stroke painted on reload');
    }
    results.push(room+'/'+id);
    console.log('Checked '+room+'/'+id);
   }
   await page.screenshot({path:path.join(__dirname,'../../interactive-'+room+'.png'),fullPage:true});
  }
  // Removing a placed item retains ownership, interaction history and any drawing.
  await page.evaluate(()=>{chooseRoom('rabbit');focusRoomItem('rabbit','penciljar')});
  const strokes=await page.evaluate(()=>JSON.stringify(itemUseState('rabbit','penciljar').strokes));
  await page.getByRole('button',{name:'Wegräumen',exact:true}).click();
  assert.equal(await page.evaluate(()=>roomItemOwned('rabbit','penciljar')),true);
  assert.equal(await page.evaluate(()=>JSON.stringify(itemUseState('rabbit','penciljar').strokes)),strokes);
  await page.locator('[data-use-item=penciljar]').click();
  assert.equal(await page.evaluate(()=>JSON.stringify(itemUseState('rabbit','penciljar').strokes)),strokes);
  for(const width of [320,390,768]){
   await page.setViewportSize({width,height:844});
   for(const [room] of catalogs){
    await page.evaluate(room=>chooseRoom(room),room);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
    if(!overflow)console.log(await page.evaluate(()=>[...document.querySelectorAll('main *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>[e.tagName,e.className.baseVal||e.className,e.textContent.slice(0,60)])));
    assert.equal(overflow,true,room+' width '+width);
    const sizes=await page.locator('.world-item').evaluateAll(bs=>bs.map(b=>[b.getBoundingClientRect().width,b.getBoundingClientRect().height]));
    assert.equal(sizes.every(([w,h])=>w>=44&&h>=44),true,'touch targets');
   }
  }
  const childOne=await page.evaluate(()=>JSON.parse(JSON.stringify(state)));
  const second=await browser.newPage({serviceWorkers:'block'});
  await second.goto(url);await second.locator('.door-card').first().waitFor();
  await second.evaluate(()=>{route='room';render()});
  assert.equal(await second.locator('[data-equipped]').count(),0);
  assert.deepEqual(await second.evaluate(()=>state.roomUses||{}),{});
  await second.close();
  await page.evaluate(()=>{parentOpen=true;route='parent';tab='report';render()});
  assert.equal(await page.evaluate(()=>JSON.stringify(state.roomUses)),JSON.stringify(childOne.roomUses),'parent report retains uses');
  await page.evaluate(()=>{const copy=migrate(JSON.parse(JSON.stringify(state)));if(!valid(copy))throw Error('Invalid backup');state=copy;route='room';render()});
  assert.equal(await page.evaluate(()=>JSON.stringify(state.roomUses)),JSON.stringify(childOne.roomUses),'backup round trip');
  const offlineContext=await browser.newContext({serviceWorkers:'allow'});
  const offlinePage=await offlineContext.newPage();
  await offlinePage.goto(url);await offlinePage.locator('.door-card').first().waitFor();
  await offlinePage.evaluate(async copy=>{await saveQueue;state=copy;await save();await navigator.serviceWorker.ready},childOne);
  await offlinePage.reload();
  await offlinePage.waitForFunction(()=>navigator.serviceWorker.controller!==null);
  await offlineContext.setOffline(true);
  await offlinePage.reload();
  await offlinePage.locator('.door-card').first().waitFor();
  await offlinePage.getByRole('button',{name:'Reisezimmer',exact:true}).click();
  assert.equal(await offlinePage.evaluate(()=>JSON.stringify(state.roomUses)),JSON.stringify(childOne.roomUses),'offline restore');
  await offlinePage.evaluate(()=>{chooseRoom('rabbit');focusRoomItem('rabbit','penciljar')});
  assert.equal(await offlinePage.locator('#room-canvas').evaluate(canvas=>canvas.getContext('2d').getImageData(270,180,1,1).data[0]<100),true,'offline drawing restored');
  await offlineContext.close();
  assert.deepEqual(errors,[]);
  assert.equal(results.length,24);
  console.log('PASS: all '+results.length+' items purchased, interacted with and reloaded; equipment and placement restored; drawing retained; 44px targets; character and child-save isolation; backup round trip.');
  console.log(results.join(', '));
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
