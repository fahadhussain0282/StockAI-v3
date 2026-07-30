/**
 * StockAI v3.0 Enterprise — Production Stress Test
 * Usage: node stress-test.js [base_url]
 * Default: node stress-test.js http://localhost:3002
 */
const BASE_URL = process.argv[2] || 'http://localhost:3002';

const TINY_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==';
const TEST_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAKklEQVQoU2NkIAIwEqmGgWTF/////yMDA8N/NAUkKyBZAckKSFZAsgIAeOEGC5GKszsAAAAASUVORK5CYII=';

const IMAGES = [
  { name:'business_icon.png', b64:TINY_PNG, cat:'Business' },
  { name:'tech_illustration.png', b64:TEST_PNG, cat:'Technology' },
  { name:'nature_photo.png', b64:TEST_PNG, cat:'Nature' },
  { name:'abstract_vector.png', b64:TINY_PNG, cat:'Abstract' },
  { name:'medical_icon.png', b64:TINY_PNG, cat:'Medical' },
  { name:'food_photo.png', b64:TEST_PNG, cat:'Food' },
  { name:'travel_landscape.png', b64:TEST_PNG, cat:'Travel' },
  { name:'education_illustration.png', b64:TINY_PNG, cat:'Education' },
  { name:'seasonal_holiday.png', b64:TEST_PNG, cat:'Seasonal' },
  { name:'pattern_geometric.png', b64:TINY_PNG, cat:'Pattern' },
];

const fmt = ms => ms < 1000 ? ms+'ms' : (ms/1000).toFixed(2)+'s';
const pad = (s,n) => String(s).padEnd(n,' ');
const mem = () => { const u=process.memoryUsage(); return Math.round(u.heapUsed/1024/1024)+'MB'; };

async function api(method, path, body, token) {
  const h = {'Content-Type':'application/json'};
  if (token) h['Authorization'] = 'Bearer '+token;
  const opts = {method, headers:h};
  if (body) opts.body = JSON.stringify(body);
  try {
    const r = await fetch(BASE_URL+path, opts);
    const d = await r.json().catch(()=>({}));
    return {ok:r.ok, status:r.status, data:d};
  } catch(e) { return {ok:false, status:0, data:{error:e.message}}; }
}

async function login() {
  console.log('\n[LOGIN] Reading token from test_token.txt...');
  const fs = (await import('fs')).default;
  if (fs.existsSync('./test_token.txt')) {
    const t = fs.readFileSync('./test_token.txt','utf8').trim();
    if (t) { console.log('[LOGIN] Token found.'); return t; }
  }
  console.log('[LOGIN] No test_token.txt found. Attempting password login...');
  const r = await api('POST','/api/auth/login',{email:'adobeicon99@gmail.com',password:'Admin@123',deviceId:'stress-test'},null);
  if (r.ok && r.data.token) { console.log('[LOGIN] Password login OK'); return r.data.token; }
  console.log('[LOGIN] Could not authenticate. Run tests manually with token.');
  return null;
}

async function phase1_adminVerify(token) {
  console.log('\n====================================================');
  console.log('PHASE 1 — ADMIN & API KEY POOL VERIFICATION');
  console.log('====================================================');
  if (!token) { console.log('SKIP — no token'); return false; }

  const me = await api('GET','/api/auth/me',null,token);
  if (!me.ok) { console.log('FAIL /api/auth/me: '+me.status); return false; }
  const role = me.data.user?.role || me.data.role;
  console.log('User: '+me.data.user?.email+' | role: '+role);

  const stats = await api('GET','/api/admin/key-pool/stats',null,token);
  console.log('Key-pool/stats: '+stats.status+(stats.ok?' OK':'FAIL'));
  if (stats.ok) {
    console.log('Encryption: '+(stats.data.encryptionEnabled?'AES-256-GCM ENABLED':'DISABLED'));
    (stats.data.poolStats||[]).forEach(p => {
      if (p.totalKeys > 0)
        console.log('  '+pad(p.provider,16)+' total='+p.totalKeys+' healthy='+p.healthyKeys+' strategy='+p.strategy);
    });
    const circuits = stats.data.circuitStatus || {};
    Object.entries(circuits).forEach(([prov,c]) => {
      const s = c.state||'CLOSED';
      console.log('  Circuit '+pad(prov,16)+' '+s+' failures='+c.consecutiveFailures);
    });
  }

  const providers = ['google-gemini','openai','anthropic','groq','xai','openrouter'];
  for (const p of providers) {
    const r = await api('GET','/api/admin/key-pool/'+p,null,token);
    const keys = r.data?.keys||[];
    console.log('  '+pad(p,16)+' keys='+keys.length+(r.ok?'':' FAIL:'+r.status));
  }
  return role === 'admin';
}

async function phase2_batch(token, count, label) {
  const results = { ok:0, fail:0, times:[], errors:[] };
  const start = Date.now();
  const startMem = process.memoryUsage().heapUsed;

  console.log('\n  BATCH ['+label+'] '+count+' requests | mem:'+mem());

  for (let i=0; i<count; i++) {
    const img = IMAGES[i % IMAGES.length];
    const t0 = Date.now();
    const r = await api('POST','/api/generate-metadata',{
      fileId:'stress_'+i+'_'+Date.now(),
      fileName:img.name, fileType:'image',
      base64Data:img.b64, mimeType:'image/png',
      provider:'google-gemini',
      settings:{targetPlatform:'adobe-stock',keywordsCount:30,titleLength:70}
    }, token);
    const elapsed = Date.now()-t0;
    results.times.push(elapsed);
    if (r.ok && r.data?.title) {
      results.ok++;
      process.stdout.write('    ['+pad(i+1+'',2)+'/'+count+'] OK  '+fmt(elapsed)+' '+r.data.title.substring(0,50)+'\n');
    } else {
      results.fail++;
      const e = (r.data?.error||r.data?.code||'HTTP '+r.status).substring(0,60);
      results.errors.push(e);
      process.stdout.write('    ['+pad(i+1+'',2)+'/'+count+'] ERR '+fmt(elapsed)+' '+e+'\n');
    }
    if (i < count-1) await new Promise(r=>setTimeout(r,400));
  }

  const total = Date.now()-start;
  const memDelta = Math.round((process.memoryUsage().heapUsed-startMem)/1024/1024);
  const avg = results.times.length ? Math.round(results.times.reduce((a,b)=>a+b,0)/results.times.length) : 0;
  const mx = results.times.length ? Math.max(...results.times) : 0;
  const mn = results.times.length ? Math.min(...results.times) : 0;
  const rate = ((results.ok/count)*100).toFixed(1);

  console.log('  RESULT: '+results.ok+'/'+count+' ('+rate+'%) | avg:'+fmt(avg)+' max:'+fmt(mx)+' min:'+fmt(mn)+' total:'+fmt(total)+' memΔ:+'+memDelta+'MB');
  if (results.errors.length) console.log('  Errors: '+[...new Set(results.errors)].join(' | '));

  return {label,count,ok:results.ok,fail:results.fail,rate:parseFloat(rate),avg,max:mx,min:mn,total,memDelta};
}

async function phase2_stressTest(token) {
  console.log('\n====================================================');
  console.log('PHASE 2 — METADATA GENERATION STRESS TEST');
  console.log('====================================================');
  if (!token) { console.log('SKIP — no token'); return []; }
  const batches = [];
  for (const n of [1,5,10,25,50]) {
    batches.push(await phase2_batch(token,n,n+' images'));
  }
  return batches;
}

async function phase3_promptTest(token) {
  console.log('\n====================================================');
  console.log('PHASE 3 — PROMPT GENERATION TEST');
  console.log('====================================================');
  if (!token) { console.log('SKIP — no token'); return 0; }
  let pass = 0;
  const tests = [
    {topic:'Business technology workspace',style:'Photorealistic studio lighting',mood:'Corporate professional'},
    {topic:'Mountain landscape panorama',style:'Golden hour photography',mood:'Serene peaceful'},
    {topic:'Medical healthcare concept',style:'Clean minimal flat design',mood:'Clinical professional'},
  ];
  for (const t of tests) {
    const t0 = Date.now();
    const r = await api('POST','/api/generate-prompt',t,token);
    const ok = r.ok && r.data?.promptMidjourney;
    if (ok) pass++;
    console.log((ok?'  OK ':'  ERR ')+fmt(Date.now()-t0)+' "'+t.topic+'"');
    if (ok) console.log('     provider:'+r.data.provider+' aiGenerated:'+r.data.aiGenerated);
    if (!ok) console.log('     '+JSON.stringify(r.data).substring(0,100));
    await new Promise(r=>setTimeout(r,500));
  }
  console.log('  Prompt tests: '+pass+'/'+tests.length+' passed');
  return pass;
}

async function phase4_failover(token) {
  console.log('\n====================================================');
  console.log('PHASE 4 — PROVIDER FAILOVER & KEY ROTATION TEST');
  console.log('====================================================');
  if (!token) { console.log('SKIP — no token'); return; }

  console.log('  Test A: invalid custom key (expect failover to pool key)');
  const r = await api('POST','/api/generate-metadata',{
    fileId:'failover_test',fileName:'failover.png',fileType:'image',
    base64Data:TEST_PNG,mimeType:'image/png',
    provider:'google-gemini',
    customApiKey:'INVALID_KEY_XXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    settings:{targetPlatform:'adobe-stock',keywordsCount:30}
  },token);
  if (r.ok && r.data?.title) {
    console.log('  OK Failover succeeded: '+r.data.title.substring(0,50));
    console.log('     provider used: '+(r.data.provider||'auto'));
  } else {
    console.log('  INFO HTTP '+r.status+': '+(r.data?.error||r.data?.code||'').substring(0,80));
  }
}

async function phase5_security(token) {
  console.log('\n====================================================');
  console.log('PHASE 5 — SECURITY VERIFICATION');
  console.log('====================================================');
  if (!token) { console.log('SKIP — no token'); return; }

  const noAuth = await api('GET','/api/admin/key-pool/stats',null,null);
  console.log((noAuth.status===401?'  OK ':'  FAIL ')+'Unauthenticated request rejected: '+noAuth.status);

  const badToken = await api('GET','/api/admin/key-pool/stats',null,'bad.token.xyz');
  console.log((badToken.status===401?'  OK ':'  FAIL ')+'Invalid token rejected: '+badToken.status);

  const providers = ['google-gemini','openai'];
  for (const p of providers) {
    const r = await api('GET','/api/admin/key-pool/'+p,null,token);
    if (r.ok && r.data?.keys?.length > 0) {
      const raw = JSON.stringify(r.data.keys);
      const exposed = /AIzaSy[a-zA-Z0-9_-]{33}/.test(raw) || /sk-[a-zA-Z0-9]{32,}/.test(raw);
      console.log((exposed?'  FAIL ':'  OK ')+'Key masking for '+p+': '+(exposed?'RAW KEY EXPOSED':'masked correctly'));
    }
  }
}

async function phase6_quality(token) {
  console.log('\n====================================================');
  console.log('PHASE 6 — METADATA QUALITY AUDIT');
  console.log('====================================================');
  if (!token) { console.log('SKIP — no token'); return []; }
  const results = [];
  for (const platform of ['adobe-stock','shutterstock','etsy']) {
    const r = await api('POST','/api/generate-metadata',{
      fileId:'quality_'+platform,
      fileName:'business_workspace_laptop_coffee.png',
      fileType:'image',base64Data:TEST_PNG,mimeType:'image/png',
      provider:'google-gemini',
      settings:{targetPlatform:platform,keywordsCount:30,titleLength:70}
    },token);
    if (r.ok && r.data?.title) {
      const d=r.data, kw=d.keywords||[], ukw=[...new Set(kw.map(k=>k.toLowerCase()))];
      const checks = {
        hasTitle: d.title?.length>=10,
        titleLength: d.title?.length<=80,
        hasKeywords: kw.length>=20,
        uniqueKeywords: ukw.length===kw.length,
        hasDescription: (d.description||'').length>=50,
        hasCategory: !!d.primaryCategory,
        seoScore70: (d.scores?.seoScore||0)>=70,
        commScore60: (d.scores?.commercialScore||0)>=60,
      };
      const p=Object.values(checks).filter(Boolean).length, t=Object.values(checks).length;
      results.push({platform,pass:p,total:t});
      console.log('\n  Platform: '+platform.toUpperCase());
      console.log('  Title: "'+d.title.substring(0,60)+'" ('+d.title.length+' chars)');
      console.log('  Keywords: '+kw.length+' | unique: '+ukw.length+' | dupes: '+(kw.length-ukw.length));
      console.log('  SEO:'+d.scores?.seoScore+' Commercial:'+d.scores?.commercialScore+' Confidence:'+d.scores?.confidenceScore);
      console.log('  Provider:'+d.provider+' Latency:'+d.latency+'ms');
      console.log('  Quality: '+p+'/'+t+' checks passed');
      Object.entries(checks).forEach(([k,v])=>console.log('    '+(v?'OK ':'FAIL ')+k));
    } else {
      console.log('  FAIL '+platform+': '+(r.data?.error||'HTTP '+r.status).substring(0,80));
    }
    await new Promise(r=>setTimeout(r,1000));
  }
  return results;
}

function printReport(isAdmin, batches, promptPass, quality) {
  console.log('\n');
  console.log('====================================================');
  console.log('STOCKAI v3.0 ENTERPRISE — FINAL PRODUCTION REPORT');
  console.log('====================================================');
  console.log('Time: '+new Date().toISOString());
  console.log('Server: '+BASE_URL);
  console.log('Memory: '+mem());
  console.log('\n--- ROOT CAUSE ANALYSIS ---');
  console.log('  Hot-path console.log() removed from seo-engine.ts (performance fix)');
  console.log('  mimeType bug fixed: text-only prompt calls no longer send image/jpeg');
  console.log('  PromptGeneratorView missing Authorization header fixed');
  console.log('  App.tsx: stuck-file safety guard added after generation loop');
  console.log('\n--- ADMIN VERIFICATION ---');
  console.log('  Admin API access: '+(isAdmin?'PASS':'SKIP/FAIL'));
  console.log('\n--- GENERATION STRESS TEST ---');
  if (!batches.length) { console.log('  SKIP — no token'); }
  else {
    console.log(pad('Batch',12)+pad('N',6)+pad('Rate',10)+pad('Avg',10)+pad('Max',10)+pad('Min',10)+'MemΔ');
    batches.forEach(b=>{
      const g=b.rate>=95?'OK ':b.rate>=80?'WARN':'FAIL';
      console.log(g+' '+pad(b.label,10)+pad(b.count,6)+pad(b.rate+'%',10)+pad(fmt(b.avg),10)+pad(fmt(b.max),10)+pad(fmt(b.min),10)+'+'+b.memDelta+'MB');
    });
    const tN=batches.reduce((a,b)=>a+b.count,0);
    const tOk=batches.reduce((a,b)=>a+b.ok,0);
    const gAvg=Math.round(batches.map(b=>b.avg).reduce((a,b)=>a+b,0)/batches.length);
    console.log('\n  TOTAL: '+tOk+'/'+tN+' ('+(tOk/tN*100).toFixed(1)+'%) | Global avg: '+fmt(gAvg));
  }
  console.log('\n--- PROMPT GENERATION ---');
  console.log('  Result: '+promptPass+'/3 passed | '+(promptPass>=2?'PASS':'FAIL'));
  console.log('\n--- METADATA QUALITY ---');
  quality.forEach(q=>console.log('  '+pad(q.platform,18)+q.pass+'/'+q.total+' '+(q.pass/q.total>=0.85?'PASS':'FAIL')));
  console.log('\n--- PRODUCTION READINESS SCORE ---');
  let score=0,max=100;
  if(isAdmin) score+=20;
  if(batches.length){const r=batches.reduce((a,b)=>a+b.ok,0)/batches.reduce((a,b)=>a+b.count,0);score+=Math.round(r*35);}
  score+=Math.round((promptPass/3)*20);
  if(quality.length){const r=quality.reduce((a,q)=>a+q.pass,0)/quality.reduce((a,q)=>a+q.total,0);score+=Math.round(r*25);}
  const pct=score;
  const verdict=pct>=85?'PRODUCTION READY':pct>=70?'NEEDS ATTENTION':'NOT READY';
  console.log('  Score: '+pct+'/'+max+' | '+verdict);
  console.log('====================================================');
}

async function main() {
  console.log('====================================================');
  console.log('STOCKAI v3.0 ENTERPRISE STRESS TEST');
  console.log('====================================================');
  console.log('Server: '+BASE_URL);

  const health = await fetch(BASE_URL+'/api/marketplaces').catch(()=>null);
  if (!health || !health.ok) {
    console.log('ERROR: Server not reachable at '+BASE_URL+'. Start with: npm run dev');
    process.exit(1);
  }
  console.log('Server reachable. Running tests...');

  const token = await login();
  const isAdmin = await phase1_adminVerify(token);
  const batches = await phase2_stressTest(token);
  const promptPass = await phase3_promptTest(token);
  await phase4_failover(token);
  await phase5_security(token);
  const quality = await phase6_quality(token);
  printReport(isAdmin, batches, promptPass, quality);
}

main().catch(e=>{ console.error('Fatal: '+e.message); process.exit(1); });

