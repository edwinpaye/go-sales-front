import { bus } from './bus.js';

export function createRouter({ routes, notFound }) {
  const resolve = () => {
    const hash = location.hash.replace(/^#\/?/, '') || 'dashboard';
    const [path, queryStr] = hash.split('?');
    const segments = path.split('/').filter(Boolean);
    const query = Object.fromEntries(new URLSearchParams(queryStr || ''));
    for (const r of routes) {
      const m = match(r.path, segments);
      if (m) return { route: r, params: m, query, path };
    }
    return { route: { view: notFound }, params: {}, query, path };
  };
  const go = (p) => { if (location.hash !== `#/${p}`) location.hash = `#/${p}`; else bus.emit('route', resolve()); };
  window.addEventListener('hashchange', () => bus.emit('route', resolve()));
  return { resolve, go };
}
function match(pattern, segments) {
  const p = pattern.split('/').filter(Boolean);
  if (p.length !== segments.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(segments[i]);
    else if (p[i] !== segments[i]) return null;
  }
  return params;
}