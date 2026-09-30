import { h } from '../core/dom.js';

export function openModal({ title, body, footer, size = 'md', onClose } = {}) {
  const root = document.getElementById('modal-root');
  const backdrop = h('div', { class: 'modal-backdrop', role: 'dialog', 'aria-modal': 'true' });
  const modal = h('div', { class: `modal ${size === 'lg' ? 'modal--lg' : ''}` });
  const close = () => { backdrop.remove(); document.removeEventListener('keydown', onKey); onClose?.(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  modal.appendChild(h('div', { class: 'modal__head' },
    h('div', { class: 'modal__title' }, title),
    h('button', { class: 'btn btn--ghost btn--icon', 'aria-label': 'Close', onClick: close }, '✕'),
  ));
  modal.appendChild(h('div', { class: 'modal__body' }, typeof body === 'function' ? body(close) : body));
  if (footer) modal.appendChild(h('div', { class: 'modal__foot' }, typeof footer === 'function' ? footer(close) : footer));
  backdrop.appendChild(modal);
  backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) close(); });
  document.addEventListener('keydown', onKey);
  root.appendChild(backdrop);
  return { close, el: modal };
}

export function confirmDialog({ title = 'Confirm', message, confirmText = 'Confirm', danger = false }) {
  return new Promise((resolve) => {
    const m = openModal({
      title,
      body: h('p', { class: 'muted' }, message),
      footer: (close) => [
        h('button', { class: 'btn', onClick: () => { close(); resolve(false); } }, 'Cancel'),
        h('button', {
          class: `btn ${danger ? 'btn--danger' : 'btn--primary'}`,
          onClick: () => { close(); resolve(true); },
        }, confirmText),
      ],
      onClose: () => resolve(false),
    });
    void m;
  });
}