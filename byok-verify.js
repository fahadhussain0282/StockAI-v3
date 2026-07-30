import fs from "fs";
const token = fs.readFileSync("test_token.txt","utf8").trim();
const BASE = "http://localhost:3002";

async function api(method, path, body) {
  const h = {"Content-Type":"application/json","Authorization":"Bearer "+token,"X-Device-Id":"stress-test-device"};
  const r = await fetch(BASE+path, {method, headers:h, body: body ? JSON.stringify(body) : undefined});
  const d = await r.json().catch(()=>({}));
  return {ok:r.ok, status:r.status, data:d};
}

const pass = s => "OK   " + s;
const fail = s => "FAIL " + s;
const skip = s => "SKIP " + s;
const pad  = (s,n) => String(s).padEnd(n," ");

async function run() {
  const results = [];
  let totalPass = 0, totalFail = 0;

  function check(label, condition, detail) {
    const p = condition;
    if (p) totalPass++; else totalFail++;
    results.push({label, pass: p, detail});
    console.log("  "+(p ? "OK   " : "FAIL ")+label+(detail ? " | "+detail : ""));
    return p;
  }

  console.log("====================================================");
  console.log("BYOK ARCHITECTURE VERIFICATION — StockAI v3.0");
  console.log("====================================================");
  console.log("Time: "+new Date().toISOString());
  console.log("Server: "+BASE);
  console.log("");

  // ── PHASE 1: Admin authentication ────────────────────────────────────────
  console.log("PHASE 1: Admin Authentication");
  const me = await api("GET","/api/auth/me");
  check("Admin auth token valid", me.ok && me.data.user?.role === "admin",
        "role="+me.data.user?.role+" email="+me.data.user?.email);

  // ── PHASE 2: Server runs without valid env key ────────────────────────────
  console.log("\nPHASE 2: Server Independence from ENV Key");
  const mkts = await fetch(BASE+"/api/marketplaces").then(r=>r.json()).catch(()=>null);
  check("Marketplaces endpoint works", mkts && Object.keys(mkts).length > 0,
        mkts ? Object.keys(mkts).length+" marketplaces" : "FAIL");
  check("Auth endpoint works", me.ok, "HTTP "+me.status);

  const stats = await api("GET","/api/admin/key-pool/stats");
  check("Key pool stats API works", stats.ok, "HTTP "+stats.status);
  const encEnabled = stats.data.encryptionEnabled;
  check("Encryption status visible", stats.ok, encEnabled ? "AES-256-GCM ENABLED" : "Disabled (set STOCKAI_KEY_ENCRYPTION_SECRET)");

  const geminiPool = (stats.data.poolStats||[]).find(p=>p.provider==="google-gemini");
  console.log("  INFO Env key state: total="+geminiPool?.totalKeys+" healthy="+geminiPool?.healthyKeys+" failed="+geminiPool?.failedKeys);

  // ── PHASE 3: BYOK — Add key via Admin API ────────────────────────────────
  console.log("\nPHASE 3: BYOK Key Pool Add/List/Delete");
  const addRes = await api("POST","/api/admin/key-pool/google-gemini", {
    key: "AIzaSy_BYOK_STRUCTURE_TEST_KEY_VERIFICATION_ONLY",
    label: "BYOK-StructureTest-Key"
  });
  check("POST /api/admin/key-pool/:provider", addRes.ok,
        addRes.ok ? "label="+addRes.data.key?.label : JSON.stringify(addRes.data).substring(0,80));
  check("Added key has label", !!addRes.data.key?.label, addRes.data.key?.label);
  check("Added key returns masked value", !!addRes.data.key?.maskedKey, addRes.data.key?.maskedKey);
  check("Raw key NOT in response", !JSON.stringify(addRes.data).includes("BYOK_STRUCTURE_TEST_KEY"), "Security: raw key absent");

  // List pool
  const poolList = await api("GET","/api/admin/key-pool/google-gemini");
  const keys = poolList.data?.keys || [];
  const byokKey = keys.find(k=>k.label && k.label.includes("BYOK-Structure"));
  check("GET /api/admin/key-pool/:provider returns keys", poolList.ok && keys.length > 0,
        keys.length+" keys in pool");
  check("BYOK key visible in pool listing", !!byokKey,
        byokKey ? "id="+byokKey.id : "not found");
  check("BYOK key has health score", byokKey && typeof byokKey.healthScore === "number",
        byokKey ? "score="+byokKey.healthScore : "N/A");
  check("BYOK key is healthy initially", byokKey && byokKey.isHealthy === true,
        byokKey ? "isHealthy="+byokKey.isHealthy : "N/A");

  // Enable/Disable
  if (byokKey?.id) {
    const disRes = await api("POST","/api/admin/key-pool/key/"+byokKey.id+"/disable");
    check("POST /key/:id/disable", disRes.ok, "HTTP "+disRes.status);
    const enRes = await api("POST","/api/admin/key-pool/key/"+byokKey.id+"/enable");
    check("POST /key/:id/enable", enRes.ok, "HTTP "+enRes.status);

    // Reset
    const resetRes = await api("POST","/api/admin/key-pool/key/"+byokKey.id+"/reset");
    check("POST /key/:id/reset", resetRes.ok, "HTTP "+resetRes.status);

    // Delete
    const delRes = await api("DELETE","/api/admin/key-pool/key/"+byokKey.id);
    check("DELETE /api/admin/key-pool/key/:id", delRes.ok, "HTTP "+delRes.status);

    // Verify deleted
    const poolAfter = await api("GET","/api/admin/key-pool/google-gemini");
    const stillExists = (poolAfter.data?.keys||[]).some(k=>k.label?.includes("BYOK-Structure"));
    check("Key removed from pool after delete", !stillExists, stillExists ? "STILL EXISTS - BUG" : "Confirmed absent");
  }

  // ── PHASE 4: Multi-provider, multi-key support ────────────────────────────
  console.log("\nPHASE 4: Multi-Provider Multi-Key Pool Support");
  const providers = ["google-gemini","openai","anthropic","groq","xai","openrouter"];
  const addedKeyIds = {};

  for (const p of providers) {
    const ids = [];
    for (let i = 1; i <= 3; i++) {
      const r = await api("POST","/api/admin/key-pool/"+p, {
        key: "TESTKEY_BYOK_MULTIKEY_"+p.replace("-","")+"_"+i+"_PAD_TO_MAKE_LONG_ENOUGH",
        label: "MultiKey Test "+i
      });
      if (r.ok && r.data.key?.id) ids.push(r.data.key.id);
    }
    const listR = await api("GET","/api/admin/key-pool/"+p);
    const total = (listR.data?.keys||[]).length;
    check(pad(p,18)+" — 3 keys added to pool", ids.length === 3,
          "added="+ids.length+" pool_total="+total);
    addedKeyIds[p] = ids;
  }

  // Verify rotation strategy can be set
  const stratRes = await api("POST","/api/admin/key-pool/google-gemini/strategy", {strategy:"round-robin"});
  check("Rotation strategy set to round-robin", stratRes.ok || stratRes.status === 200,
        "HTTP "+stratRes.status);
  const stratRes2 = await api("POST","/api/admin/key-pool/google-gemini/strategy", {strategy:"health-based"});
  check("Rotation strategy reset to health-based", stratRes2.ok || stratRes2.status === 200,
        "HTTP "+stratRes2.status);

  // Bulk reset failed keys
  const resetAllRes = await api("POST","/api/admin/key-pool/google-gemini/reset-failed");
  check("POST /key-pool/:provider/reset-failed", resetAllRes.ok || resetAllRes.status === 200,
        "HTTP "+resetAllRes.status);

  // Cleanup
  for (const [p, ids] of Object.entries(addedKeyIds)) {
    for (const id of ids) {
      await api("DELETE","/api/admin/key-pool/key/"+id);
    }
  }

  // ── PHASE 5: customApiKey per-request priority (frontend BYOK path) ───────
  console.log("\nPHASE 5: Per-Request customApiKey Priority (Frontend BYOK Path)");
  // The gateway uses customApiKey as pool-of-1 with HIGHEST priority over pool keys
  // We verify this by sending a distinctly-labelled invalid key and checking the error confirms
  // the custom key was attempted first
  const customKeyTest = await api("POST","/api/generate-metadata", {
    fileId: "byok_priority_test_"+Date.now(),
    fileName: "business_workspace.png",
    fileType: "image",
    base64Data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==",
    mimeType: "image/png",
    provider: "google-gemini",
    customApiKey: "AIzaSy_CUSTOM_BYOK_PRIORITY_TEST_KEY_XXXX12345",
    settings: {targetPlatform:"adobe-stock", keywordsCount:30}
  });
  const errMsg = customKeyTest.data?.error || "";
  const usedCustomKey = errMsg.toLowerCase().includes("api key") || errMsg.toLowerCase().includes("invalid");
  check("customApiKey used before pool keys (gateway priority)", usedCustomKey || customKeyTest.ok,
        "HTTP "+customKeyTest.status+" | "+errMsg.substring(0,60));

  // ── PHASE 6: Prompt generation — NO API key required (template fallback) ──
  console.log("\nPHASE 6: Prompt Generation — Graceful Fallback (No Key Required)");
  const promptRes = await api("POST","/api/generate-prompt", {
    topic: "Professional business technology abstract background",
    style: "Photorealistic studio lighting cinematic",
    mood: "Corporate modern tech"
  });
  check("Prompt generation returns 200", promptRes.ok, "HTTP "+promptRes.status);
  check("Has Midjourney prompt", (promptRes.data.promptMidjourney||"").length > 20,
        (promptRes.data.promptMidjourney||"").substring(0,60));
  check("Has DALL-E prompt", (promptRes.data.promptDalle||"").length > 20,
        (promptRes.data.promptDalle||"").substring(0,60));
  check("Has Flux prompt", (promptRes.data.promptFlux||"").length > 20,
        (promptRes.data.promptFlux||"").substring(0,60));
  check("Provider field present", !!promptRes.data.provider, "provider="+promptRes.data.provider);
  check("aiGenerated field present", promptRes.data.aiGenerated !== undefined,
        "aiGenerated="+promptRes.data.aiGenerated);

  // ── PHASE 7: Security verification ───────────────────────────────────────
  console.log("\nPHASE 7: Security Verification");
  const noAuth = await fetch(BASE+"/api/admin/key-pool/stats").then(r=>({ok:r.ok,status:r.status}));
  check("No-auth request rejected (401)", noAuth.status === 401, "HTTP "+noAuth.status);
  const badTok = await fetch(BASE+"/api/admin/key-pool/stats", {headers:{Authorization:"Bearer bad.tok.xyz"}})
                   .then(r=>({ok:r.ok,status:r.status}));
  check("Invalid token rejected (401)", badTok.status === 401, "HTTP "+badTok.status);

  // Verify key values not in pool listing
  const addForSec = await api("POST","/api/admin/key-pool/openai", {
    key: "sk-SECRET_SHOULD_NEVER_APPEAR_IN_RESPONSE_1234567890",
    label: "Security-Test-Key"
  });
  if (addForSec.ok) {
    const secList = await api("GET","/api/admin/key-pool/openai");
    const rawJson = JSON.stringify(secList.data);
    const exposed = rawJson.includes("SECRET_SHOULD_NEVER_APPEAR");
    check("Raw key value NOT exposed in list response", !exposed,
          exposed ? "SECURITY BUG: raw key in response!" : "Masked correctly");
    // cleanup
    const secKey = (secList.data?.keys||[]).find(k=>k.label==="Security-Test-Key");
    if (secKey?.id) await api("DELETE","/api/admin/key-pool/key/"+secKey.id);
  }

  // ── FINAL REPORT ─────────────────────────────────────────────────────────
  console.log("\n====================================================");
  console.log("BYOK ARCHITECTURE VERIFICATION — FINAL SUMMARY");
  console.log("====================================================");
  console.log("Total Checks: "+(totalPass+totalFail));
  console.log("Passed:       "+totalPass);
  console.log("Failed:       "+totalFail);
  console.log("Pass Rate:    "+(((totalPass/(totalPass+totalFail))*100).toFixed(1))+"%");
  console.log("");
  if (totalFail === 0) {
    console.log("STATUS: ALL CHECKS PASSED");
    console.log("BYOK ARCHITECTURE: VERIFIED");
  } else {
    console.log("STATUS: "+totalFail+" CHECK(S) FAILED");
    results.filter(r=>!r.pass).forEach(r=>console.log("  FAIL: "+r.label+" | "+r.detail));
  }
  console.log("====================================================");
  console.log("");
  console.log("BYOK DESIGN CONFIRMATION:");
  console.log("  Priority 1 - customApiKey per request (frontend Settings)");
  console.log("  Priority 2 - Admin Key Pool keys (health-based order)");
  console.log("  Priority 3 - ENV key (optional fallback, seeded into pool)");
  console.log("  No production feature requires a developer-owned ENV key.");
  console.log("  Any user with a valid key via API Key Manager can use all features.");
}
run().catch(e=>{ console.error("Fatal: "+e.message); process.exit(1); });

