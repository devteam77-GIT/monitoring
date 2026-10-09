const fs = require('fs');
let html = fs.readFileSync('overview.html', 'utf8');

html = html.replace(/<div class="server-card" onclick="window\.location\.href='index\.html\?host=\${server\.host}'">/g, `<div class="server-card" onclick="window.location.href='\${server.id}.html'">`);

fs.writeFileSync('index.html', html);
console.log("Copied overview.html to index.html and updated links");
