const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const fetchBlock = `
      try {
        const cacheKey = 'fms_cache_live_' + state.serverHost;
        const cacheTimeKey = 'fms_cache_time_live_' + state.serverHost;
        const lastTime = localStorage.getItem(cacheTimeKey) || 0;
        
        let liveData;
        let resStatus = 200;
        let isOk = true;

        if (Date.now() - lastTime < 20000) {
           liveData = JSON.parse(localStorage.getItem(cacheKey));
        } else {
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

        if (liveData) {
          window.setFMSData(liveData);
          if (state.simMode) {
            state.simMode = false;
            document.getElementById('btnSimMode').classList.add('off');
            document.getElementById('simModeText').innerText = "OFF (Live)";
          }
          document.getElementById('bridgeStatus').innerText = "n8n Live Webhook " + resStatus + " OK";
          document.getElementById('bridgeStatus').style.color = "#34d399";
        } else {
          document.getElementById('bridgeStatus').innerText = \`n8n HTTP \${resStatus}\`;
          document.getElementById('bridgeStatus').style.color = "#fbbf24";
        }
`;

html = html.replace(/try\s*\{\s*const res = await fetch\([\s\S]*?document\.getElementById\('bridgeStatus'\)\.style\.color = "#fbbf24";\s*\}/g, fetchBlock.trim());

fs.writeFileSync('index.html', html);
console.log("Patched index.html with Cache logic!");
