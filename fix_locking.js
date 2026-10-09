const fs = require('fs');
const files = ['hitachi.html', 'kiekert.html', 'demo.html'];

const pollBlock = `
    async function pollLiveN8nWebhook() {
      if (!state.n8nWebhookUrl) return;
      try {
        const cacheKey = 'fms_cache_live_' + state.serverHost;
        const cacheTimeKey = 'fms_cache_time_live_' + state.serverHost;
        const lastTime = parseInt(localStorage.getItem(cacheTimeKey) || "0");
        let liveData = null;
        let resStatus = 200;

        if (Date.now() - lastTime < 25000) {
           try {
             const cachedStr = localStorage.getItem(cacheKey);
             if (cachedStr) {
                 liveData = JSON.parse(cachedStr);
             } else {
                 return;
             }
           } catch(e) { console.error(e); }
        }
        
        if (!liveData) {
           localStorage.setItem(cacheTimeKey, Date.now().toString());
           const res = await fetch(state.n8nWebhookUrl, {
             method: 'GET',
             headers: { 'Accept': 'application/json' }
           });
           resStatus = res.status;
           if (res.ok) {
              liveData = await res.json();
              localStorage.setItem(cacheKey, JSON.stringify(liveData));
              localStorage.setItem(cacheTimeKey, Date.now().toString());
           } else {
              localStorage.setItem(cacheTimeKey, "0");
           }
        }

        if (liveData) {
          window.setFMSData(liveData);
          document.getElementById('bridgeStatus').innerText = "n8n Live Webhook 200 OK";
          document.getElementById('bridgeStatus').style.color = "#34d399";
        } else {
          document.getElementById('bridgeStatus').innerText = \`n8n HTTP \${resStatus}\`;
          document.getElementById('bridgeStatus').style.color = "#fbbf24";
        }
      } catch (err) {
        console.warn("Live webhook poll error:", err);
        document.getElementById('bridgeStatus').innerText = "n8n Webhook Offline";
        document.getElementById('bridgeStatus').style.color = "#f87171";
      }
    }
`;

for (const file of files) {
      let html = fs.readFileSync(file, 'utf8');
      html = html.replace(/async function pollLiveN8nWebhook\(\) \{[\s\S]*?\}\s*function saveSettings/, pollBlock.trim() + '\n\n    function saveSettings');
      fs.writeFileSync(file, html);
      console.log('Patched', file);
}
