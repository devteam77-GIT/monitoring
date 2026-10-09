const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const targetFunctionStart = "    async function pollLiveN8nWebhook() {";
const targetFunctionEnd = "      } catch (e) {";

const functionLines = html.split('\n');
let newLines = [];
let insideFunc = false;

for (let i = 0; i < functionLines.length; i++) {
  if (functionLines[i].includes("async function pollLiveN8nWebhook()")) {
    insideFunc = true;
    newLines.push("    async function pollLiveN8nWebhook() {");
    newLines.push("      if (!state.n8nWebhookUrl) return;");
    newLines.push("      try {");
    newLines.push("        const cacheKey = 'fms_cache_live_' + state.serverHost;");
    newLines.push("        const cacheTimeKey = 'fms_cache_time_live_' + state.serverHost;");
    newLines.push("        const lastTime = localStorage.getItem(cacheTimeKey) || 0;");
    newLines.push("        let liveData;");
    newLines.push("        let resStatus = 200;");
    newLines.push("        if (Date.now() - lastTime < 20000) {");
    newLines.push("           liveData = JSON.parse(localStorage.getItem(cacheKey));");
    newLines.push("        } else {");
    newLines.push("           const res = await fetch(state.n8nWebhookUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });");
    newLines.push("           resStatus = res.status;");
    newLines.push("           if (res.ok) {");
    newLines.push("              liveData = await res.json();");
    newLines.push("              localStorage.setItem(cacheKey, JSON.stringify(liveData));");
    newLines.push("              localStorage.setItem(cacheTimeKey, Date.now());");
    newLines.push("           }");
    newLines.push("        }");
    newLines.push("");
    newLines.push("        if (liveData) {");
    newLines.push("          window.setFMSData(liveData);");
    newLines.push("          if (state.simMode) {");
    newLines.push("            state.simMode = false;");
    newLines.push("            document.getElementById('btnSimMode').classList.add('off');");
    newLines.push("            document.getElementById('simModeText').innerText = 'OFF (Live)';");
    newLines.push("          }");
    newLines.push("          document.getElementById('bridgeStatus').innerText = 'n8n Live Webhook ' + resStatus + ' OK';");
    newLines.push("          document.getElementById('bridgeStatus').style.color = '#34d399';");
    newLines.push("        } else {");
    newLines.push("          document.getElementById('bridgeStatus').innerText = 'n8n HTTP ' + resStatus;");
    newLines.push("          document.getElementById('bridgeStatus').style.color = '#fbbf24';");
    newLines.push("        }");
    continue;
  }
  
  if (insideFunc && functionLines[i].includes("      } catch (e) {")) {
    insideFunc = false;
  }
  
  if (!insideFunc) {
    newLines.push(functionLines[i]);
  }
}

fs.writeFileSync('index.html', newLines.join('\\n'));
console.log("Safely patched index.html");
