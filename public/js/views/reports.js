import { h } from '../core/dom.js';
import { renderTable, statusBadge } from '../ui/table.js';
import { money, num, dateTime } from '../core/format.js';
import { toastError } from '../ui/toast.js';

const TABS = [
  { id: 'sales', label: 'Sales summary', load: (c) => c.salesSummary() },
  { id: 'top', label: 'Top products', load: (c) => c.topProducts({ limit: 20 }) },
  { id: 'valuation', label: 'Stock valuation', load: (c) => c.stockValuation() },
  { id: 'slow', label: 'Slow movers', load: (c) => c.slowMovers({ limit: 20 }) },
  { id: 'low', label: 'Low stock', load: (c) => c.lowStock(50) },
  { id: 'revenue', label: 'Revenue by day', load: (c) => c.revenueByDay({ days: 30 }) },
  { id: 'status', label: 'Orders by status', load: (c) => c.ordersByStatus() },
  { id: 'perf', label: 'Salesperson perf.', load: (c) => c.salespersonPerformance() },
  { id: 'audit', label: 'Movement audit', load: (c) => c.stockMovementAudit({ limit: 50 }) },
  { id: 'activity', label: 'User activity', load: (c) => c.userActivity({ limit: 50 }) },
];

export function ReportsView({ client }) {
  const root = h('div', { class: 'page' });
  const tabs = h('div', { class: 'tabs' });
  const body = h('div');
  root.append(h('div', { class: 'page__head' }, h('div', null, h('h1', null, 'Reports'), h('div', { class: 'sub' }, 'Analytics and audits'))), tabs, body);

  let active = TABS[0].id;
  const renderTabs = () => {
    tabs.replaceChildren(...TABS.map((t) => h('div', {
      class: 'tab', role: 'tab', 'aria-selected': active === t.id,
      onClick: () => { active = t.id; renderTabs(); loadTab(); },
    }, t.label)));
  };

  const loadTab = async () => {
    const t = TABS.find((x) => x.id === active);
    body.replaceChildren(renderTable({ columns: [{ key: 'x', label: 'Loading' }], rows: [], loading: true }));
    try {
      const data = await t.load(client);
      const rows = Array.isArray(data) ? data : (data.items || []);
      body.replaceChildren(renderTable({ columns: colsFor(active, data), rows, empty: 'No data' }));
    } catch (e) { toastError(e.message); body.replaceChildren(h('div', { class: 'empty-state' }, e.message)); }
  };

  renderTabs(); loadTab();
  return { el: root };
}

function colsFor(tab, sample) {
  if (tab === 'sales' && sample && !Array.isArray(sample)) {
    return Object.keys(sample).map((k) => ({ key: k, label: k, align: 'right' }));
  }
  if (tab === 'sales') return [
    { key: 'date', label: 'Date' },
    { key: 'revenue', label: 'Revenue', align: 'right', render: (r) => money(r.revenue, r.currency) },
    { key: 'orders', label: 'Orders', align: 'right', render: (r) => num(r.orders) },
  ];
  if (tab === 'top') return [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Product' },
    { key: 'quantity', label: 'Units', align: 'right', render: (r) => num(r.quantity ?? r.units) },
    { key: 'revenue', label: 'Revenue', align: 'right', render: (r) => money(r.revenue, r.currency) },
  ];
  if (tab === 'valuation') return [
    { key: 'currency', label: 'Currency' },
    { key: 'total', label: 'Total value', align: 'right', render: (r) => money(r.total ?? r.value, r.currency) },
  ];
  if (tab === 'slow' || tab === 'low') return [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Product' },
    { key: 'on_hand', label: 'On hand', align: 'right', render: (r) => num(r.on_hand) },
    { key: 'reorder_level', label: 'Reorder at', align: 'right', render: (r) => num(r.reorder_level) },
  ];
  if (tab === 'revenue') return [
    { key: 'date', label: 'Date' },
    { key: 'revenue', label: 'Revenue', align: 'right', render: (r) => money(r.revenue, r.currency) },
  ];
  if (tab === 'status') return [
    { key: 'status', label: 'Status', render: (r) => statusBadge(r.status) },
    { key: 'count', label: 'Count', align: 'right', render: (r) => num(r.count) },
  ];
  if (tab === 'perf') return [
    { key: 'salesperson_id', label: 'Salesperson', render: (r) => h('span', { class: 'mono text-xs' }, (r.salesperson_id || '').slice(0, 8)) },
    { key: 'orders', label: 'Orders', align: 'right', render: (r) => num(r.orders) },
    { key: 'revenue', label: 'Revenue', align: 'right', render: (r) => money(r.revenue, r.currency) },
  ];
  if (tab === 'audit') return [
    { key: 'product_id', label: 'Product', render: (r) => h('span', { class: 'mono text-xs' }, (r.product_id || '').slice(0, 8)) },
    { key: 'movement_type', label: 'Type' },
    { key: 'quantity', label: 'Qty', align: 'right' },
    { key: 'actor_id', label: 'Actor', render: (r) => h('span', { class: 'mono text-xs' }, (r.actor_id || '—').slice(0, 8)) },
    { key: 'created_at', label: 'When', render: (r) => dateTime(r.created_at) },
  ];
  if (tab === 'activity') return [
    { key: 'actor_id', label: 'Actor', render: (r) => h('span', { class: 'mono text-xs' }, (r.actor_id || '—').slice(0, 8)) },
    { key: 'action', label: 'Action' },
    { key: 'resource', label: 'Resource' },
    { key: 'success', label: 'OK', render: (r) => r.success ? '✔' : '✖' },
    { key: 'created_at', label: 'When', render: (r) => dateTime(r.created_at) },
  ];
  return Object.keys(sample?.[0] || {}).map((k) => ({ key: k, label: k }));
}