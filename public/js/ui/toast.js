import { h } from '../core/dom.js';

export function toast(message, { type = 'info', title, duration = 4000 } = {}) {
  const root = document.getElementById('toasts');
  const el = h('div', { class: `toast toast--${type}` },
    title && h('div', { class: 'toast__title' }, title),
    h('div', { class: 'toast__msg' }, message),
  );
  root.appendChild(el);
  const t = setTimeout(remove, duration);
  el.addEventListener('click', remove);
  function remove() { clearTimeout(t); el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; setTimeout(() => el.remove(), 180); }
}
export const toastSuccess = (m, o) => toast(m, { ...o, type: 'success' });
export const toastError   = (m, o) => toast(m, { ...o, type: 'error' });
export const toastWarning = (m, o) => toast(m, { ...o, type: 'warning' });