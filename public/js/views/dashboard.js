import { h } from '../core/dom.js';
import { bus } from '../core/bus.js';
import { renderTable, statusBadge } from '../ui/table.js';
import { money, num, dateTime } from '../core/format.js';
import { toastError } from '../ui/toast.js';

export function DashboardView({ client, router }) {
  const root = h('div', { class: 'page' });
  const stats = h('div', { class: 'grid cols-4' });
  const lowStockCard = h('div', { class: 'card' });
  const recentOrdersCard = h('div', { class: 'card' });
  const liveCard = h('div', { class: 'card' });

  const refresh = h('button', { class: 'btn btn--sm' }, 'Refresh');
  root.append(
    h('div', { class: 'page__head' },
      h('div', null,
        h('h1', null, 'Dashboard'),
        h('div', { class: 'sub' }, 'Realtime overview of your sales operations'),
      ),
      h('div', { class: 'spacer' }),
      refresh,
    ),
    stats,
    h('div', { class: 'grid cols-2' }, lowStockCard, recentOrdersCard),
    liveCard,
  );

  // -------- live activity panel --------
  const log = h('div', { class: 'mono text-sm', style: { maxHeight: '220px', overflow: 'auto' } });
  const pushEvent = (topic, payload) => {
    log.prepend(h('div', null,
      `[${new Date().toLocaleTimeString()}] ${topic}: ${JSON.stringify(payload).slice(0, 120)}`,
    ));
    while (log.childElementCount > 100) log.lastChild.remove();
  };
  const offBus = bus.on('ws-event', ({ topic, payload }) => pushEvent(topic, payload));

  liveCard.replaceChildren(
    h('div', { class: 'card__head' },
      h('div', { class: 'card__title' }, 'Live activity'),
      h('div', { class: 'spacer' }),
      h('span', { class: 'pill' }, 'realtime'),
    ),
    h('div', { class: 'card__body' }, log),
  );

  // -------- data loading --------
  const load = async () => {
    refresh.disabled = true;
    try {
      const [dash, low, orders] = await Promise.all([
        client.adminDashboard().catch(() => ({})),
        client.lowStock(5).catch(() => []),
        client.listOrders({ limit: 8, sort: '-created_at' }).catch(() => ({ items: [] })),
      ]);
      renderStats(stats, dash || {});
      renderLowStock(lowStockCard, Array.isArray(low) ? low : (low?.items || []), () => router.go('stock'));
      renderRecentOrders(recentOrdersCard, orders?.items || (Array.isArray(orders) ? orders : []));
    } catch (e) {
      toastError(e.message || 'Failed to load dashboard');
    } finally {
      refresh.disabled = false;
    }
  };

  // -------- realtime: refresh dashboard with debounce --------
  let reloadTimer = null;
  const reloadSoon = () => {
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(load, 300);
  };

  const offOrders = client.on('orders', reloadSoon);
  const offStock  = client.on('stock',  reloadSoon);

  client.subscribe(['orders', 'stock', 'products']).catch(() => {});
  refresh.addEventListener('click', load);
  load();

  return {
    el: root,
    dispose: () => {
      offBus();
      offOrders();
      offStock();
      clearTimeout(reloadTimer);
    },
  };
}

function renderStats(container, d) {
  const items = [
    { label: 'Revenue',   value: money(d.revenue ?? d.total_revenue ?? 0, d.currency || 'USD'), delta: d.revenue_delta },
    { label: 'Orders',    value: num(d.orders ?? d.total_orders ?? 0), delta: d.orders_delta },
    { label: 'Products',  value: num(d.products ?? d.total_products ?? 0) },
    { label: 'Low stock', value: num(d.low_stock ?? 0) },
  ];
  container.replaceChildren(...items.map((s) =>
    h('div', { class: 'card' }, h('div', { class: 'card__body' },
      h('div', { class: 'stat' },
        h('div', { class: 'stat__label' }, s.label),
        h('div', { class: 'stat__value' }, s.value),
        s.delta != null && h('div', {
          class: `stat__delta ${s.delta >= 0 ? 'up' : 'down'}`,
        }, `${s.delta >= 0 ? '▲' : '▼'} ${Math.abs(s.delta)}%`),
      ),
    )),
  ));
}

function renderLowStock(card, rows, onViewAll) {
  card.replaceChildren(
    h('div', { class: 'card__head' },
      h('div', { class: 'card__title' }, 'Low stock'),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn btn--sm btn--ghost', onClick: onViewAll }, 'View all'),
    ),
    h('div', { class: 'card__body card__body--flush' },
      renderTable({
        columns: [
          { key: 'sku', label: 'SKU' },
          { key: 'name', label: 'Product' },
          { key: 'on_hand', label: 'On hand', align: 'right' },
          { key: 'reorder_level', label: 'Reorder at', align: 'right' },
        ],
        rows,
        empty: 'All stock levels are healthy',
      }),
    ),
  );
}

function renderRecentOrders(card, rows) {
  card.replaceChildren(
    h('div', { class: 'card__head' },
      h('div', { class: 'card__title' }, 'Recent orders'),
    ),
    h('div', { class: 'card__body card__body--flush' },
      renderTable({
        columns: [
          { key: 'id', label: 'ID', render: (r) => h('span', { class: 'mono text-xs' }, (r.id || '').slice(0, 8)) },
          { key: 'customer_id', label: 'Customer', render: (r) => r.customer_id || '—' },
          { key: 'status', label: 'Status', render: (r) => statusBadge(r.status) },
          { key: 'total', label: 'Total', align: 'right', render: (r) => money(r.total, r.currency) },
          { key: 'created_at', label: 'Created', render: (r) => dateTime(r.created_at) },
        ],
        rows,
        empty: 'No recent orders',
      }),
    ),
  );
}