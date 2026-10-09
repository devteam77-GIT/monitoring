const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(/const cacheKey = 'fms_cache_' \+ server\.id;\s*const cacheTimeKey = 'fms_cache_time_' \+ server\.id;\s*/, '');

fs.writeFileSync('index.html', html);
