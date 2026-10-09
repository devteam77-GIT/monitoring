const fs = require('fs');
let template = fs.readFileSync('dashboard_template.html', 'utf8');

// Remove the URL params logic
template = template.replace(/function initUrlParamsAndStorage\(\) \{[\s\S]*?\}\s*function saveSettings/, 'function saveSettings');
// Replace the DOMContentLoaded call to initUrlParamsAndStorage
template = template.replace(/initUrlParamsAndStorage\(\);/, '');

// Fix the "Fleet Overview" buttons to point back to index.html
template = template.replace(
  /<div style="display: flex; flex-direction: column; gap: 2px;">\s*<button class="action-btn" onclick="window\.location\.href='overview\.html'"[\s\S]*?<\/button>\s*<\/div>/,
  `<div style="display: flex; flex-direction: column; gap: 2px;">
          <button class="action-btn" onclick="window.location.href='index.html'" style="margin-right: 16px; background: transparent; border: 1px solid var(--border-highlight); color: var(--text-muted); display: flex; align-items: center; gap: 8px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Home
          </button>
        </div>`
);
template = template.replace(/<button class="action-btn" onclick="window\.location\.href='overview\.html'"[^>]*>.*?<\/button>/s, '');


const servers = [
  { id: 'hitachi', host: 'hitachi.master-bom.com', webhook: 'https://fms.n8n.lexisolution.com/webhook/fms-live-dashboard' },
  { id: 'kiekert', host: 'kiekert.master-bom.com', webhook: 'https://fms.n8n.lexisolution.com/webhook/fms-kiekert-dashboard' },
  { id: 'demo', host: 'demo.master-bom.com', webhook: 'https://fms.n8n.lexisolution.com/webhook/fms-demo-dashboard' }
];

for (const s of servers) {
  let fileHtml = template;
  
  // Hardcode the state variables
  fileHtml = fileHtml.replace(
    /serverHost:\s*'[^']*'/,
    `serverHost: '${s.host}'`
  );
  fileHtml = fileHtml.replace(
    /n8nWebhookUrl:\s*'[^']*'/,
    `n8nWebhookUrl: '${s.webhook}'`
  );
  
  // Also update the DOM id='serverHostDisplay' initialization
  fileHtml = fileHtml.replace(
    /<span id="serverHostDisplay">.*?<\/span>/,
    `<span id="serverHostDisplay">${s.host}</span>`
  );

  // Add the explicit start call that used to be in initUrlParamsAndStorage
  fileHtml = fileHtml.replace(
    /window\.addEventListener\('DOMContentLoaded', \(\) => \{/,
    `window.addEventListener('DOMContentLoaded', () => {
      document.getElementById('n8nWebhookInput').value = state.n8nWebhookUrl;
      document.getElementById('bridgeStatus').innerText = "n8n Poller Active";
      pollLiveN8nWebhook();
      setInterval(pollLiveN8nWebhook, 30000);
      state.simMode = false;
      const btn = document.getElementById('btnSimMode');
      if (btn) btn.classList.add('off');
      const txt = document.getElementById('simModeText');
      if (txt) txt.innerText = "OFF (Live)";`
  );

  fs.writeFileSync(`${s.id}.html`, fileHtml);
}
console.log("Generated individual server files.");
