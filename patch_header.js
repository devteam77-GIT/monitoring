const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const overviewButton = `
        <button class="action-btn" onclick="window.location.href='overview.html'" style="margin-right: 16px; background: transparent; border: 1px solid var(--border-highlight); color: var(--text-muted); display: flex; align-items: center; gap: 8px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Fleet Overview
        </button>
`;

html = html.replace('<div class="brand-title-wrap">', overviewButton + '\n        <div class="brand-title-wrap">');

fs.writeFileSync('index.html', html);
console.log("Patched header in index.html");
