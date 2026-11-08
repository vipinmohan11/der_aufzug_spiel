const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
(async()=>{
 const server=http.createServer((req,res)=>{const file=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';if(!['index.html','sw.js','manifest.webmanifest','icon.svg'].includes(file)){res.writeHead(404).end();return}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':'text/html;charset=utf-8');res.end(fs.readFileSync(path.join(__dirname,'..',file)))}).listen(0,'127.0.0.1');
 await new Promise(r=>server.once('listening',r));
 const browser=await chromium.launch({executablePath:process.env.TEST_BROWSER_EXECUTABLE||undefined});
 try{
  for(const touch of [false,true]){
   const context=await browser.newContext({serviceWorkers:'block',hasTouch:touch,viewport:{width:touch?390:1366,height:1000}}),page=await context.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/?admin=1');await page.locator('.door-card').first().waitFor();
   await page.evaluate(async()=>{state.coins=5000;await save()});
   await page.getByRole('button',{name:'Reisezimmer',exact:true}).click();
   await page.evaluate(()=>{for(const id of ROOMS.penguin.items){buyRoomItem('penguin',id);useRoomItem('penguin',id)};render()});
   async function check(){return page.evaluate(()=>{const r=resolvedRoomLayouts('penguin'),all=[r.actor,...Object.values(r.items)];return all.every((a,i)=>validWorldLayout(a,i===0)&&all.slice(i+1).every(b=>!rectanglesOverlap(a,b)))})}
   assert.equal(await check(),true,'new items have free positions');
   assert.equal(await page.locator('[data-world-item] > span').count(),0,'no canvas names');
   await page.locator('[data-layout-toggle]').click();
   const cdp=await context.newCDPSession(page);
   async function gesture(start,end,cancel=false){
    if(touch){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:start.x,y:start.y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:end.x,y:end.y}]});await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]})}
    else{await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:1});if(cancel)await page.evaluate(()=>{const w=document.getElementById('room-world');w.dispatchEvent(new PointerEvent('pointercancel',{pointerId:1,bubbles:true}))});await page.mouse.up()}
   }
   async function move(id,candidate,action='move',cancel=false){
    const node=page.locator('[data-layout-target="'+id+'"]:not(.room-layout-handle)');await node.scrollIntoViewIfNeeded();await node.click({force:true});
    const handle=page.locator('.room-layout-handle[data-layout-action='+action+']');
    const box=await handle.boundingBox(),world=await page.locator('#room-world').boundingBox();
    const old=await page.evaluate(id=>{const r=resolvedRoomLayouts('penguin');return id==='actor'?r.actor:r.items[id]},id);
    const scale=world.width/1000,dx=action==='move'?candidate.x-old.x:candidate.size-old.size,dy=action==='move'?candidate.y-old.y:candidate.size-old.size;
    await gesture({x:box.x+22,y:box.y+22},{x:box.x+22+dx*scale,y:box.y+22+dy*scale},cancel);
   }
   const first=await page.evaluate(()=>resolvedRoomLayouts('penguin').items.clock);
   await move('clock',{...first,x:first.x+10,y:first.y+10});
   let saved=await page.evaluate(()=>itemUseState('penguin','clock').layout);assert.ok(Math.abs(saved.x-first.x-10)<1,'drag saved');
   await move('clock',{...saved,size:saved.size+15},'resize');saved=await page.evaluate(()=>itemUseState('penguin','clock').layout);assert.ok(Math.abs(saved.size-first.size-15)<1,'resize saved');
   const actor=await page.evaluate(()=>resolvedRoomLayouts('penguin').actor);
   await move('clock',{...saved,x:actor.x,y:actor.y});assert.equal(await page.locator('.layout-ghost').count(),1,'overlap has visible blocked feedback');assert.deepEqual(await page.evaluate(()=>itemUseState('penguin','clock').layout),saved);
   await move('clock',{...saved,x:-200,y:saved.y});assert.deepEqual(await page.evaluate(()=>itemUseState('penguin','clock').layout),saved,'bounds protected');
   await move('clock',{...saved,size:360},'resize');assert.equal(await check(),true,'resizing remains collision free');
   const beforeCancel=await page.evaluate(()=>itemUseState('penguin','clock').layout);
   await move('clock',{...beforeCancel,x:beforeCancel.x+10,y:beforeCancel.y+10},'move',true);assert.deepEqual(await page.evaluate(()=>itemUseState('penguin','clock').layout),beforeCancel,'cancel restores');
   await move('actor',{...actor,x:actor.x+15,y:actor.y+5});
   await move('actor',{...actor,x:actor.x+15,y:actor.y+5,size:actor.size-30},'resize');
   assert.equal(await check(),true);
   assert.equal(await page.locator('[data-equipped=scarf]').count(),1);
   assert.equal(await page.locator('[data-layout-target=actor] [data-flipper-layer]').count(),1,'flippers in actor composite');
   const stored=await page.evaluate(()=>({uses:state.roomUses,actors:state.roomActorLayouts,owned:state.owned}));
   await page.locator('[data-layout-toggle]').click();
   const count=await page.evaluate(()=>itemUseState('penguin','bowl').count||0);await page.locator('[data-world-item=bowl]').click();assert.equal(await page.evaluate(()=>itemUseState('penguin','bowl').count),count+1,'tap still feeds');
   const expected=await page.evaluate(()=>JSON.stringify({uses:state.roomUses,actors:state.roomActorLayouts,owned:state.owned}));
   await page.reload();await page.locator('.door-card').first().waitFor();await page.getByRole('button',{name:'Reisezimmer',exact:true}).click();
   assert.equal(await page.evaluate(()=>JSON.stringify({uses:state.roomUses,actors:state.roomActorLayouts,owned:state.owned})),expected,'reopening restores layout and items');
   for(const width of [320,390,768,1024,1366]){
    await page.setViewportSize({width,height:1000});await page.locator('[data-layout-toggle]').click();await page.locator('[data-world-item=clock]').click();
    const geometry=await page.evaluate(()=>{const w=document.getElementById('room-world').getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,items:[...document.querySelectorAll('#room-world [data-layout-target]:not(.room-layout-handle)')].map(n=>{const b=n.getBoundingClientRect();return {inside:b.left>=w.left-.1&&b.top>=w.top-.1&&b.right<=w.right+.1&&b.bottom<=w.bottom+.1,square:Math.abs(b.width-b.height)<1,size:b.width}}),handles:[...document.querySelectorAll('.room-layout-handle')].map(n=>n.getBoundingClientRect().width)}});
    assert.equal(geometry.overflow,false,width+' overflow');assert.ok(geometry.items.every(b=>b.inside&&b.square&&b.size>=44),width+' item geometry');assert.ok(geometry.handles.every(s=>s>=44),width+' touch handles');
    await page.locator('[data-layout-toggle]').click();
   }
   await page.setViewportSize({width:touch?390:1366,height:1000});await page.locator('#room-world').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(__dirname,'../../layout-'+(touch?'phone':'desktop')+'.png'),fullPage:true});
   // An older save with no layout remains owned and gets deterministic free slots.
   await page.evaluate(()=>{for(const id of Object.keys(state.roomUses.penguin))delete state.roomUses.penguin[id].layout;delete state.roomActorLayouts;render()});assert.equal(await check(),true);assert.equal(await page.evaluate(()=>state.owned.length),stored.owned.length);
   for(const room of ['penguin','mouse','rabbit','pony']){
    await page.evaluate(room=>{chooseRoom(room);for(const id of ROOMS[room].items){if(!roomItemOwned(room,id))buyRoomItem(room,id);if(!itemUseState(room,id).placed&&ITEM_USES[id].kind!=='wear')useRoomItem(room,id)};state.owned.push('room:'+room+':plant','room:'+room+':lamp');useRoomItem(room,'plant');useRoomItem(room,'lamp');render()},room);
    assert.equal(await page.evaluate(room=>{const r=resolvedRoomLayouts(room),all=[r.actor,...Object.values(r.items)];return visibleRoomItemIds(room).length===Object.keys(r.items).length&&all.every((a,i)=>validWorldLayout(a,i===0)&&all.slice(i+1).every(b=>!rectanglesOverlap(a,b)))},room),true,room+' full room including legacy rewards');
   }
   assert.deepEqual(errors,[]);console.log((touch?'Touch':'Mouse')+' placement, resizing, blocked positions, reload and responsive checks passed');await context.close();
  }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});


