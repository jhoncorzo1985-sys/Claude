const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:1400}});
await p.goto('file://'+process.argv[2]+'/carrusel.html',{waitUntil:'networkidle'}).catch(()=>{});
await p.evaluate(()=>document.fonts.ready);
const f=await p.evaluate(()=>[...document.fonts].filter(x=>x.status==='loaded').map(x=>x.family));console.log('fonts',[...new Set(f)]);
for(let i=1;i<=6;i++){await p.locator('#s'+i).screenshot({path:process.argv[2]+`/emprende-dia1-${i}.png`})}
await b.close()})();
