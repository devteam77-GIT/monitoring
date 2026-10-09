const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Fix the syntax error:
html = html.replace(/onclick="window\.location\.href=`\$\{s\.id\}\.html`"/g, "onclick=\\"window.location.href='\${s.id}.html'\\"");

// Fix the fetch logic:
const fetchLogic = `
        const cacheKey = 'fms_cache_live_' + server.host;
        const cacheTimeKey = 'fms_cache_time_live_' + server.host;
        const lastTime = parseInt(localStorage.getItem(cacheTimeKey) || "0");
        
        let data = null;
        let m = null;
        
        if (Date.now() - lastTime < 25000) {
           try {
               const cachedStr = localStorage.getItem(cacheKey);
               if (cachedStr) {
                   data = JSON.parse(cachedStr);
                   m = data.metrics || data;
               } else {
                   // Lock acquired by another tab, skip this cycle
                   continue;
               }
           } catch(e) { console.error(e); }
        }
        
        if (!data) {
           localStorage.setItem(cacheTimeKey, Date.now().toString()); // Optimistic lock
           try {
               const res = await fetch(server.webhook, { method: 'GET', headers: { 'Accept': 'application/json' } });
               if (!res.ok) throw new Error("HTTP " + res.status);
               
               const textData = await res.text();
               if (!textData) throw new Error("Empty response body");
               
               data = JSON.parse(textData);
               m = data.metrics || data;
               
               localStorage.setItem(cacheKey, JSON.stringify(data));
               localStorage.setItem(cacheTimeKey, Date.now().toString());
           } catch (err) {
               localStorage.setItem(cacheTimeKey, "0"); // Release lock
               throw err;
           }
        }
`;

html = html.replace(/const cacheKey = 'fms_cache_live_[\s\S]*?localStorage\.setItem\(cacheTimeKey, Date\.now\(\)\);\s*\}/, fetchLogic.trim());

fs.writeFileSync('index.html', html);
console.log("Patched index.html");
