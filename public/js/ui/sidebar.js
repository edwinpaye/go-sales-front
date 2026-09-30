import { h, icon } from '../core/dom.js';
import { store } from '../core/store.js';

const NAV = [
  { section: 'Overview' },
  { path: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: 'monitoring', label: 'Monitoring', icon: 'monitor' },
  { section: 'Catalog' },
  { path: 'products', label: 'Products', icon: 'products' },
  { path: 'stock', label: 'Stock', icon: 'stock' },
  { section: 'Operations' },
  { path: 'orders', label: 'Orders', icon: 'orders' },
  { path: 'reports', label: 'Reports', icon: 'reports' },
];

export function renderSidebar(currentPath, { onNavigate, onLogout }) {
  const aside = h('aside', { class: 'sidebar' });
  aside.appendChild(h('div', { class: 'sidebar__brand' },
    h('div', { class: 'sidebar__logo' }, 'SS'),
    h('div', { class: 'sidebar__title' }, 'Sales System'),
  ));
  const nav = h('nav', { class: 'sidebar__nav' });
  for (const item of NAV) {
    if (item.section) { nav.appendChild(h('div', { class: 'sidebar__section' }, item.section)); continue; }
    const active = currentPath === item.path || currentPath.startsWith(item.path + '/');
    nav.appendChild(h('a', {
      class: 'sidebar__link',
      href: `#/${item.path}`,
      'aria-current': active ? 'page' : null,
      onClick: (e) => { e.preventDefault(); onNavigate(item.path); },
    }, icon(item.icon), h('span', { class: 'label' }, item.label)));
  }
  aside.appendChild(nav);

  const user = store.get().user;
  const footer = h('div', { class: 'sidebar__footer' },
    h('div', { class: 'user-chip' },
      h('div', { class: 'user-chip__avatar' }, (user?.username || '?').slice(0, 1).toUpperCase()),
      h('div', { class: 'user-chip__meta' },
        h('div', { class: 'user-chip__name' }, user?.username || 'Unknown'),
        h('div', { class: 'user-chip__role' }, user?.role || ''),
      ),
      h('button', { class: 'btn btn--ghost btn--icon', title: 'Sign out', onClick: onLogout }, icon('logout', 16)),
    ),
  );
  aside.appendChild(footer);
  return aside;
}