const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Move the hostParam block UP
const hostBlock = `
        if (hostParam) {
          state.serverHost = hostParam;
          document.getElementById('serverHostDisplay').innerText = hostParam;
          
          if (hostParam.includes('demo')) {
            state.n8nWebhookUrl = 'https://fms.n8n.lexisolution.com/webhook/fms-demo-dashboard';
          } else if (hostParam.includes('kiekert')) {
            state.n8nWebhookUrl = 'https://fms.n8n.lexisolution.com/webhook/fms-kiekert-dashboard';
          }
        }
`;

html = html.replace(hostBlock, ''); // remove it from below
html = html.replace('const savedWebhook = localStorage.getItem(\'fms_n8n_webhook\');', hostBlock.trim() + '\n\n        const savedWebhook = localStorage.getItem(\'fms_n8n_webhook\');');

// Also prevent savedWebhook from overwriting Demo or Kiekert!
html = html.replace('} else if (savedWebhook) {', '} else if (savedWebhook && !hostParam) {');

fs.writeFileSync('index.html', html);
console.log("Patched index.html");
