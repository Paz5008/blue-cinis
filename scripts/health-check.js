#!/usr/bin/env node
/* Simple health check script for pages and APIs.
   Usage: BASE_URL=http://localhost:3000 node scripts/health-check.js */

const base = process.env.BASE_URL || 'http://localhost:3000';
const allowHealthIssues = ['1','true','yes'].includes(String(process.env.ALLOW_HEALTH_ISSUES || '').toLowerCase());

const routes = [
  { path: '/api/health', type: 'health' },
  { path: '/', type: 'html' },
  { path: '/galerie', type: 'html' },
  { path: '/artistes', type: 'html' },
  { path: '/blog', type: 'html' },
  { path: '/evenements', type: 'html' },
  { path: '/api/artworks/featured', type: 'json', shape: 'artworks' },
  { path: '/api/events/upcoming', type: 'json', shape: 'events' },
];

function assertArtworks(data) {
  if (!Array.isArray(data)) throw new Error('Expected array for artworks');
  if (data.length === 0) return;
  const a = data[0];
  ['id','title','price'].forEach(k => { if (!(k in a)) throw new Error(`artwork missing ${k}`); });
}
function assertEvents(data) {
  if (!Array.isArray(data)) throw new Error('Expected array for events');
  if (data.length === 0) return;
  const e = data[0];
  ['id','title','date'].forEach(k => { if (!(k in e)) throw new Error(`event missing ${k}`); });
}

(async () => {
  const fetchFn = global.fetch || (await import('node-fetch')).default;
  let failures = 0;
  for (const r of routes) {
    const url = base.replace(/\/$/, '') + r.path;
    try {
      const res = await fetchFn(url, { redirect: 'manual' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (r.type === 'health') {
        const data = await res.json();
        if (!data || data.ok !== true) {
          const msg = 'Health endpoint not OK: ' + JSON.stringify(data);
          if (allowHealthIssues) {
            console.warn('WARN', r.path, '-', msg);
          } else {
            throw new Error(msg);
          }
        }
        if (Array.isArray(data.alerts) && data.alerts.length > 0) {
          for (const alert of data.alerts) {
            const prefix = alert.severity === 'critical' ? 'ALERT' : 'WARN';
            console.log(prefix, `runtime:${alert.key}`, '-', alert.reason);
          }
        }
      } else if (r.type === 'json') {

        const data = await res.json();
        if (r.shape === 'artworks') assertArtworks(data);
        if (r.shape === 'events') assertEvents(data);
      } else {
        const text = await res.text();
        if (!text || text.length < 10) throw new Error('Empty HTML');
      }
      console.log('OK', r.path);
    } catch (e) {
      failures++;
      console.error('FAIL', r.path, '-', e.message || e);
    }
  }
  if (failures > 0) {
    console.error(`Health check failed with ${failures} error(s).`);
    process.exit(1);
  }
  console.log('All checks passed.');
})();
