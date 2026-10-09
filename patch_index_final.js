const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Fix initUrlParamsAndStorage
html = html.replace(
  /const btn = document.getElementById\('btnSimMode'\);\s*btn\.classList\.add\('off'\);\s*document\.getElementById\('simModeText'\)\.innerText = "OFF \(Live\)";/g,
  `const btn = document.getElementById('btnSimMode'); if(btn) btn.classList.add('off'); const txt = document.getElementById('simModeText'); if(txt) txt.innerText = "OFF (Live)";`
);

// Fix pollLiveN8nWebhook
const newFetch = `
        const cacheKey = 'fms_cache_live_' + state.serverHost;
        const cacheTimeKey = 'fms_cache_time_live_' + state.serverHost;
        const lastTime = localStorage.getItem(cacheTimeKey) || 0;
        let liveData = null;
        let resStatus = 200;
        let isOk = true;

        if (Date.now() - lastTime < 20000) {
           try {
             const cachedStr = localStorage.getItem(cacheKey);
             if (cachedStr) liveData = JSON.parse(cachedStr);
           } catch(e) { console.error(e); }
        }
        
        if (!liveData) {
           const res = await fetch(state.n8nWebhookUrl, {
             method: 'GET',
             headers: { 'Accept': 'application/json' }
           });
           resStatus = res.status;
           isOk = res.ok;
           if (res.ok) {
              liveData = await res.json();
              localStorage.setItem(cacheKey, JSON.stringify(liveData));
              localStorage.setItem(cacheTimeKey, Date.now());
           }
        }
`;
html = html.replace(/const cacheKey = 'fms_cache_live_[\s\S]*?localStorage\.setItem\(cacheTimeKey, Date\.now\(\)\);\s*\}/, newFetch.trim());

fs.writeFileSync('index.html', html);
console.log("Patched index.html with Final Fixes");
