const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

async function main() {
  const root = path.join(__dirname, '..');
  const server = http.createServer((req, res) => {
    const name = new URL(req.url, 'http://localhost').pathname.slice(1) || 'index.html';
    if (!['index.html', 'sw.js', 'icon.svg', 'manifest.webmanifest'].includes(name)) {
      res.writeHead(404).end();
      return;
    }
    const types = {'.html':'text/html; charset=utf-8','.js':'application/javascript','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
    res.setHeader('Content-Type', types[path.extname(name)]);
    fs.createReadStream(path.join(root, name)).pipe(res);
  }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const url = 'http://127.0.0.1:' + server.address().port + '/?admin=1';
  const browser = await chromium.launch({executablePath: process.env.TEST_BROWSER_EXECUTABLE || undefined, args:['--no-sandbox']});
  try {
    const context = await browser.newContext({viewport:{width:1280,height:800}});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(url);
    await page.locator('.door-card').first().waitFor();
    const cards = page.locator('.door-card');
    assert.equal(await cards.count(), 3);
    for (let i=0; i<3; i++) {
      await cards.nth(i).focus();
      await page.keyboard.press('Enter');
      assert.equal(await cards.nth(i).getAttribute('aria-pressed'), 'true');
      assert.equal(await cards.nth(i).locator('strong').innerText(), await page.locator('#preview h2').innerText());
      assert.equal(await cards.count(), 3);
      assert.equal(await page.evaluate(()=>state.offers.length), 0);
      assert.equal(await page.evaluate(()=>Object.keys(state.records).length), 0);
    }
    await page.setViewportSize({width:390,height:844});
    await page.locator('#open-chosen').click();
    await page.getByRole('button',{name:/Fahrt abkürzen/}).click();
    assert.equal(await page.evaluate(()=>state.offers.length), 1);
    await page.locator('.work-panel').waitFor();
    // A previous tablet save may have an unfinished introduction and builder step.
    await page.evaluate(async()=>{
      state.active='C3';route='activity';
      Object.assign(rec('C3'),{instructions:false,builder:[1,null,0],builderStep:1,draft:'Mein Entwurf'});
      await save();
    });
    await page.reload();
    await page.locator('.builder fieldset').first().waitFor();
    assert.equal(await page.locator('.builder fieldset').count(), 3);
    const choice = page.locator('.builder fieldset').nth(1).locator('button').nth(2);
    await choice.click();
    assert.equal(await choice.getAttribute('aria-pressed'), 'true');
    assert.deepEqual(await page.evaluate(()=>rec('C3').builder), [1,2,0]);
    await page.getByText('Eigene Worte ergänzen (freiwillig)',{exact:true}).click();
    assert.equal(await page.locator('details textarea').inputValue(), 'Mein Entwurf');
    await page.locator('.submit').click();
    await page.getByText('Entdeckung eingepackt!',{exact:true}).waitFor();
    await page.locator('.rating button').last().click();
    assert.deepEqual(await page.evaluate(()=>[rec('C3').rating,state.coins,state.stars]),[2,10,1]);

    for (const width of [320,390,768,1024,1366]) {
      await page.setViewportSize({width,height:width<500?844:768});
      const result=await page.evaluate(()=>{
        const failures=[];
        function check(label){
          if(document.documentElement.scrollWidth>innerWidth+1)failures.push(label+' overflow');
          if(document.querySelector('.page-controls,.screen-page,[inert]'))failures.push(label+' paginated controls');
        }
        for(const view of ['home','room','journal','ride']){
          route=view;render();check(view);
          if(view==='home'){
            const a=document.querySelector('.ink-frame').getBoundingClientRect();
            const b=document.querySelector('.choices').getBoundingClientRect();
            if(innerWidth>740 ? b.left<a.right||a.width<=b.width : b.top<a.bottom)failures.push('panel order');
          }
        }
        for(const t of tasks){
          route='activity';state.active=t.id;const r=rec(t.id);
          for(const submitted of [false,true]){
            r.submitted=submitted;render();check(t.id);
            if(t.options&&document.querySelectorAll('.answers button').length!==t.options.length)failures.push(t.id+' missing options');
            if(t.kind==='write'&&document.querySelectorAll('.builder fieldset').length!==3)failures.push(t.id+' missing building blocks');
            if(t.kind==='draw'&&!document.querySelector('#canvas')?.onpointerdown)failures.push(t.id+' unbound canvas');
          }
        }
        for(const name of ['report','settings','backup','creations']){
          parentOpen=true;route='parent';tab=name;render();check('parent '+name);
        }
        return failures;
      });
      assert.deepEqual(result,[],width+'px');
      console.log(width+'px: all 72 activities, submitted states and navigation checked');
    }
    await page.evaluate(async()=>{state.active=null;route='home';await save();await navigator.serviceWorker.ready});
    await page.reload();
    await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
    await context.setOffline(true);
    await page.reload();
    await page.locator('.door-card').first().waitFor();
    await page.locator('.door-card').nth(1).click();
    assert.equal(await page.locator('.door-card[aria-pressed=true]').count(),1);
    assert.deepEqual(errors,[]);
    console.log('Preview, keyboard, phone start, stored draft, builder, reward, rating and offline reload passed.');
  } finally {
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(err=>{console.error(err);process.exitCode=1});

