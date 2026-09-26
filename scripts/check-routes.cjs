const fs = require('node:fs');
const path = require('node:path');
const { getSortedRoutes } = require('next/dist/shared/lib/router/utils/sorted-routes');

// Next's production server sorts the entire route table on startup. Turbopack
// can build conflicting dynamic segments successfully, so validate before build.
const appDir = path.join(__dirname, '..', 'app');
const routes = [];
function walk(dir, segments = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name.startsWith('_')) continue;
      const invisible = /^\([^)]*\)$/.test(entry.name) || entry.name.startsWith('@');
      walk(path.join(dir, entry.name), invisible ? segments : [...segments, entry.name]);
    } else if (/^(page|route)\.(tsx?|jsx?)$/.test(entry.name)) {
      routes.push('/' + segments.join('/'));
    }
  }
}
walk(appDir);
getSortedRoutes(routes);
console.log(`Validated ${routes.length} app routes: no conflicting dynamic segments.`);
