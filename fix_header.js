const fs = require('fs');
const files = ['hitachi.html', 'kiekert.html', 'demo.html'];

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');

  // Replace the button
  html = html.replace(
    /<button class="action-btn" onclick="window\.location\.href='overview\.html'"[^>]*>[\s\S]*?<\/button>/,
    `<button class="action-btn" onclick="window.location.href='index.html'" style="margin-right: 16px; background: transparent; border: 1px solid var(--border-highlight); color: var(--text-muted); display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; padding: 0;" title="Back to Fleet Overview">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    </button>`
  );

  // Remove "MasterBOM Telemetry" title
  html = html.replace(
    /<div class="brand-title">\s*MasterBOM Telemetry\s*<\/div>/,
    ''
  );

  fs.writeFileSync(file, html);
  console.log("Patched header in " + file);
}
