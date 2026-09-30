import { SalesSystemClient } from './core/client.js';
import { store } from './core/store.js';
import { bus } from './core/bus.js';
import { createRouter } from './core/router.js';
import { h, mount, icon } from './core/dom.js';
import { renderSidebar } from './ui/sidebar.js';
import { toastError } from './ui/toast.js';
import { renderLogin } from './views/login.js';
import { DashboardView } from './views/dashboard.js';
import { ProductsView } from './views/products.js';
import { StockView } from './views/stock.js';
import { OrdersView } from './views/orders.js';
import { ReportsView } from './views/reports.js';
import { MonitoringView } from './views/monitoring.js';

const app = document.getElementById('app');

// ---------------------------------------------------------------------
// Session persistence
// ---------------------------------------------------------------------
const STORAGE_KEY = 'sales-system.session';
const loadSession = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
};
const saveSession = (patch) => {
  const cur = loadSession();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cur, ...patch }));
};

const session = loadSession();

// ---------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------
const client = new SalesSystemClient({
  baseUrl: session.baseUrl
    || location.origin.replace(/:\d+$/, ':8080')
    || 'http://localhost:8080',
  token: session.token,
  refreshToken: session.refreshToken,
  logger: (...a) => console.debug('[client]', ...a),
  onSession: (ev) => {
    if (ev.type === 'logout' || ev.type === 'expired') {
      saveSession({ token: null, refreshToken: null });
      store.set({ user: null, connection: 'off' });
      showLoginView();
    }
  },
});

// persist refreshed tokens
const _origApply = client._applyTokens.bind(client);
client._applyTokens = (d) => {
  _origApply(d);
  saveSession({ token: d.access_token, refreshToken: d.refresh_token });
};

// ---------------------------------------------------------------------
// Connection state (leaf-only store updates — no rendering side-effects)
// ---------------------------------------------------------------------
client.onProtocol('open',  () => store.set({ connection: 'on' }));
client.onProtocol('close', () => store.set({ connection: 'off' }));
client.onProtocol('error', (p) => toastError(p?.message || 'Realtime error'));

// Bridge realtime events to the bus, registered ONCE for the app lifetime.
const KNOWN_TOPICS = ['orders', 'stock', 'products', 'users', 'notifications'];
KNOWN_TOPICS.forEach((t) =>
  client.on(t, (payload, env) => bus.emit('ws-event', { topic: t, payload, env })),
);

// ---------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------
const routes = [
  { path: '',           view: DashboardView },
  { path: 'dashboard',  view: DashboardView },
  { path: 'monitoring', view: MonitoringView },
  { path: 'products',   view: ProductsView },
  { path: 'stock',      view: StockView },
  { path: 'orders',     view: OrdersView },
  { path: 'reports',    view: ReportsView },
];
const router = createRouter({ routes, notFound: DashboardView });

// ---------------------------------------------------------------------
// Shell renderer
// ---------------------------------------------------------------------
let activeView = null;
let rafScheduled = false;

function clearView() {
  try { activeView?.dispose?.(); } catch (e) { console.warn('[dispose]', e); }
  activeView = null;
}

function scheduleRender() {
  if (rafScheduled) return;
  rafScheduled = true;
  requestAnimationFrame(() => { rafScheduled = false; renderShell(); });
}

function titleFor(path) {
  const map = {
    dashboard: 'Dashboard',
    monitoring: 'Monitoring',
    products: 'Products',
    stock: 'Stock',
    orders: 'Orders',
    reports: 'Reports',
  };
  return map[path] || 'Dashboard';
}

function renderShell() {
  const s = store.get();
  if (!s.user) { showLoginView(); return; }

  const current = router.resolve();

  const root = h('div', { class: 'app-shell', 'data-collapsed': 'false' });

  // ---- sidebar ----
  const sidebar = renderSidebar(current.path, {
    onNavigate: (p) => { location.hash = `#/${p}`; },
    onLogout: async () => {
      try { await client.logout(); } catch {}
      saveSession({ token: null, refreshToken: null });
      store.set({ user: null, connection: 'off' });
      showLoginView();
    },
  });

  // ---- topbar ----
  const conn = s.connection;
  const connCls = conn === 'on' ? 'on' : conn === 'connecting' ? 'connecting' : 'off';

  const connEl = h('span', { class: `conn conn--${connCls}` },
    h('span', { class: 'conn__dot' }),
    conn === 'on' ? 'Live' : conn === 'connecting' ? 'Connecting…' : 'Offline',
  );

  const topbar = h('header', { class: 'topbar' },
    h('button', {
      class: 'btn btn--ghost btn--icon',
      title: 'Toggle sidebar',
      onClick: () => {
        root.dataset.collapsed = root.dataset.collapsed === 'true' ? 'false' : 'true';
      },
    }, icon('menu')),
    h('div', { class: 'topbar__title' }, titleFor(current.path)),
    h('div', { class: 'topbar__spacer' }),
    connEl,
    h('div', { class: 'user-chip' },
      h('div', { class: 'user-chip__avatar' }, (s.user.username || '?')[0].toUpperCase()),
      h('div', { class: 'user-chip__meta' },
        h('div', { class: 'user-chip__name' }, s.user.username),
        h('div', { class: 'user-chip__role' }, s.user.role),
      ),
    ),
  );

  // ---- main view ----
  const main = h('main', { class: 'main' });
  clearView();

  const View = current.route.view;
  try {
    const instance = View({ client, router, params: current.params, query: current.query });
    activeView = instance;
    mount(main, instance.el);
  } catch (e) {
    console.error('[view mount failed]', e);
    mount(main, h('div', { class: 'empty-state' }, `Failed to load view: ${e.message}`));
  }

  root.append(sidebar, topbar, main);
  mount(app, root);
}

// ---------------------------------------------------------------------
// Login view wiring
// ---------------------------------------------------------------------
function showLoginView() {
  clearView();
  const view = renderLogin({
    onLogin: Object.assign(
      async (email, password) => {
        const data = await client.login(email, password, { connect: false });
        saveSession({
          token: data.access_token,
          refreshToken: data.refresh_token,
          email,
        });
        store.set({
          user: data.user || {
            username: email.split('@')[0],
            email,
            role: data.role || 'client',
          },
          connection: 'connecting',
        });

        // Kick off WS in background — DO NOT await, so UI paints immediately.
        client.connect().then(
          () => store.set({ connection: 'on' }),
          () => store.set({ connection: 'off' }),
        );

        // Ensure we land on the dashboard and paint the shell right now.
        if (!location.hash || location.hash === '#' || location.hash === '#/') {
          location.hash = '#/dashboard';
        }
        renderShell();
      },
      { register: (payload) => client.register(payload) },
    ),
  });
  mount(app, view);
}

// ---------------------------------------------------------------------
// Reactivity
// ---------------------------------------------------------------------
bus.on('route', scheduleRender);
window.addEventListener('hashchange', scheduleRender);

// Re-render ONLY when the user identity changes. Leaf updates
// (like `connection`) are handled in place by the topbar.
let lastUser = store.get().user;
store.subscribe((s) => {
  if (s.user !== lastUser) {
    lastUser = s.user;
    scheduleRender();
  }
});

// ---------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------
(async function boot() {
  if (session.token) {
    store.set({
      user: session.user || {
        username: session.email?.split('@')[0] || 'user',
        email: session.email,
        role: session.role || 'client',
      },
      connection: 'connecting',
    });
    renderShell();

    // Open socket in background.
    client.connect().then(
      () => store.set({ connection: 'on' }),
      () => store.set({ connection: 'off' }),
    );
  } else {
    showLoginView();
  }
})();

// ---------------------------------------------------------------------
// Safety net
// ---------------------------------------------------------------------
window.addEventListener('unhandledrejection', (e) => {
  const msg = e.reason?.message || 'Unexpected error';
  console.error('[unhandled]', e.reason);
  if (/401|SESSION_EXPIRED|no token/i.test(msg)) {
    saveSession({ token: null, refreshToken: null });
    store.set({ user: null });
    showLoginView();
  } else {
    toastError(msg);
  }
});