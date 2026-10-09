const fs = require('fs');

function patchHtml(filename) {
  let html = fs.readFileSync(filename, 'utf8');

  const fetchPatch = `
      try {
        const cacheKey = 'fms_cache_' + server.id;
        const cacheTimeKey = 'fms_cache_time_' + server.id;
        const lastTime = localStorage.getItem(cacheTimeKey) || 0;
        
        let data;
        let m;
        
        // If data is less than 20 seconds old, use cache!
        if (Date.now() - lastTime < 20000) {
           data = JSON.parse(localStorage.getItem(cacheKey));
           m = data.metrics || data;
        } else {
           const res = await fetch(server.webhook, { method: 'GET', headers: { 'Accept': 'application/json' } });
           if (!res.ok) throw new Error("HTTP " + res.status);
           data = await res.json();
           m = data.metrics || data;
           
           // Save to cache for other tabs
           localStorage.setItem(cacheKey, JSON.stringify(data));
           localStorage.setItem(cacheTimeKey, Date.now());
        }
  `;

  // Find the exact fetch line in overview.html and replace it
  html = html.replace(/try\s*\{\s*const res = await fetch\([^;]+;\s*if \(\!res\.ok\)[^;]+;\s*const data = await res\.json\(\);\s*const m = data\.metrics \|\| data;/g, fetchPatch.trim());

  fs.writeFileSync(filename, html);
  console.log("Patched " + filename);
}

patchHtml('overview.html');

let indexHtml = fs.readFileSync('index.html', 'utf8');
const indexFetchPatch = `
      if (!state.n8nWebhookUrl) return;
      try {
        const cacheKey = 'fms_cache_live_' + state.serverHost;
        const cacheTimeKey = 'fms_cache_time_live_' + state.serverHost;
        const lastTime = localStorage.getItem(cacheTimeKey) || 0;
        
        let liveData;
        if (Date.now() - lastTime < 20000) {
           liveData = JSON.parse(localStorage.getItem(cacheKey));
        } else {
           const res = await fetch(state.n8nWebhookUrl, {
             method: 'GET',
             headers: { 'Accept': 'application/json' }
           });
           if (!res.ok) throw new Error("HTTP " + res.status);
           liveData = await res.json();
           
           localStorage.setItem(cacheKey, JSON.stringify(liveData));
           localStorage.setItem(cacheTimeKey, Date.now());
        }
`;

indexHtml = indexHtml.replace(/if \(\!state\.n8nWebhookUrl\) return;\s*try\s*\{\s*const res = await fetch\([^}]+\}\);\s*if \(res\.ok\) \{\s*const liveData = await res\.json\(\);/g, indexFetchPatch.trim() + '\n        if (liveData) {');

fs.writeFileSync('index.html', indexHtml);
console.log("Patched index.html");
