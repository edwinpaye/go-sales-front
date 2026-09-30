/**
 * h(tag, props, ...children) — small hyperscript.
 * Supports: className, onClick, style object, data-*, attributes.
 */
export function h(tag, props = null, ...children) {
  const el = document.createElement(tag);
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class' || k === 'className') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'html') el.innerHTML = v;
    else if (k in el && k !== 'list') { try { el[k] = v; } catch { el.setAttribute(k, v); } }
    else el.setAttribute(k, v);
  }
  append(el, children);
  return el;
}
function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false || c === true) continue;
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }
export function mount(el, node) { clear(el); el.appendChild(node); }
export function frag(...children) { const f = document.createDocumentFragment(); append(f, children); return f; }
export function icon(name, size = 18) {
  const paths = ICONS[name] || '';
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  el.setAttribute('viewBox', '0 0 24 24');
  el.setAttribute('width', size); el.setAttribute('height', size);
  el.setAttribute('fill', 'none'); el.setAttribute('stroke', 'currentColor');
  el.setAttribute('stroke-width', '1.8'); el.setAttribute('stroke-linecap', 'round'); el.setAttribute('stroke-linejoin', 'round');
  el.innerHTML = paths;
  return el;
}
const ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  products:  '<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>',
  stock:     '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/><circle cx="8" cy="7" r="1"/><circle cx="8" cy="12" r="1"/><circle cx="8" cy="17" r="1"/>',
  orders:    '<path d="M6 3h12l1 4H5l1-4z"/><path d="M3 7h18l-2 14H5L3 7z"/><path d="M9 11h6"/>',
  reports:   '<path d="M4 20V4"/><path d="M4 20h16"/><rect x="8" y="12" width="3" height="6"/><rect x="13" y="8" width="3" height="10"/><rect x="18" y="5" width="3" height="13"/>',
  monitor:   '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 22h8"/><path d="M12 18v4"/>',
  logout:    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
  user:      '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  search:    '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  plus:      '<path d="M12 5v14"/><path d="M5 12h14"/>',
  refresh:   '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
  close:     '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
  edit:      '<path d="M4 20h4l10-10-4-4L4 16z"/><path d="M14 6l4 4"/>',
  trash:     '<path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/>',
  bell:      '<path d="M6 8a6 6 0 1 1 12 0v5l2 3H4l2-3z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
  menu:      '<path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/>',
  chart:     '<path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-6"/>',
  warning:   '<path d="M12 3l10 18H2L12 3z"/><path d="M12 9v5"/><path d="M12 17h.01"/>',
  check:     '<path d="M20 6L9 17l-5-5"/>',
};