const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

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
                   continue;
               }
           } catch(e) {}
        }
        
        if (!data) {
           localStorage.setItem(cacheTimeKey, Date.now().toString());
           try {
               const res = await fetch(server.webhook, { method: 'GET', headers: { 'Accept': 'application/json' } });
               if (!res.ok) throw new Error("HTTP " + res.status);
               
               const textData = await res.text();
               if (!textData) throw new Error("Empty body");
               
               data = JSON.parse(textData);
               m = data.metrics || data;
               
               localStorage.setItem(cacheKey, JSON.stringify(data));
               localStorage.setItem(cacheTimeKey, Date.now().toString());
           } catch (err) {
               localStorage.setItem(cacheTimeKey, "0");
               throw err;
           }
        }
`;

html = html.replace(/const lastTime = localStorage\.getItem\(cacheTimeKey\) \|\| 0;[\s\S]*?localStorage\.setItem\(cacheTimeKey, Date\.now\(\)\);\s*\}/, fetchLogic.trim());

fs.writeFileSync('index.html', html);
console.log("Patched fetch logic");
