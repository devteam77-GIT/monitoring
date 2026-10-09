const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldFunc = `    async function pollLiveN8nWebhook() {
      if (!state.n8nWebhookUrl) return;
      try {
        const res = await fetch(state.n8nWebhookUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          const liveData = await res.json();
          window.setFMSData(liveData);
          if (state.simMode) {
            state.simMode = false;
            document.getElementById('btnSimMode').classList.add('off');
            document.getElementById('simModeText').innerText = "OFF (Live)";
          }
          document.getElementById('bridgeStatus').innerText = "n8n Live Webhook 200 OK";
          document.getElementById('bridgeStatus').style.color = "#34d399";
        } else {
          document.getElementById('bridgeStatus').innerText = \`n8n HTTP \${res.status}\`;
          document.getElementById('bridgeStatus').style.color = "#fbbf24";
        }`;

const newFunc = `    async function pollLiveN8nWebhook() {
      if (!state.n8nWebhookUrl) return;
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
        }`;

html = html.replace(oldFunc, newFunc);
fs.writeFileSync('index.html', html);
console.log("Patched pollLiveN8nWebhook correctly!");
