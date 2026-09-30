import { h } from '../core/dom.js';
import { renderTable, statusBadge } from '../ui/table.js';
import { buildForm } from '../ui/form.js';
import { openModal, confirmDialog } from '../ui/modal.js';
import { money, dateTime } from '../core/format.js';
import { toastSuccess, toastError } from '../ui/toast.js';

export function OrdersView({ client }) {
  const root = h('div', { class: 'page' });
  const statusSel = h('select', { class: 'select', style: { width: '160px' } },
    ...[['', 'All statuses'], ['draft', 'Draft'], ['placed', 'Placed'], ['fulfilled', 'Fulfilled'], ['cancelled', 'Cancelled'], ['refunded', 'Refunded']]
      .map(([v, l]) => h('option', { value: v }, l)));
  const refresh = h('button', { class: 'btn btn--sm' }, 'Refresh');
  const create = h('button', { class: 'btn btn--primary btn--sm' }, '+ New order');
  const wrap = h('div', { class: 'card' }, h('div', { class: 'card__body card__body--flush' }));

  root.append(
    h('div', { class: 'page__head' },
      h('div', null, h('h1', null, 'Orders'), h('div', { class: 'sub' }, 'Track and fulfil sales orders')),
      h('div', { class: 'spacer' }), statusSel, refresh, create,
    ),
    wrap,
  );

  const actions = (r) => {
    const acts = [];
    if (r.status === 'draft') acts.push({ label: 'Place', onClick: () => transition('place', r) });
    if (r.status === 'placed') acts.push({ label: 'Fulfil', onClick: () => transition('fulfil', r) });
    if (['draft','placed'].includes(r.status)) acts.push({ label: 'Cancel', variant: 'danger', onClick: () => transition('cancel', r) });
    if (r.status === 'fulfilled') acts.push({ label: 'Refund', variant: 'danger', onClick: () => transition('refund', r) });
    return acts;
  };

  const COLS = [
    { key: 'id', label: 'ID', render: (r) => h('span', { class: 'mono text-xs' }, (r.id || '').slice(0, 8)) },
    { key: 'customer_id', label: 'Customer', render: (r) => r.customer_id || '—' },
    { key: 'status', label: 'Status', render: (r) => statusBadge(r.status) },
    { key: 'subtotal', label: 'Subtotal', align: 'right', render: (r) => money(r.subtotal, r.currency) },
    { key: 'tax', label: 'Tax', align: 'right', render: (r) => money(r.tax, r.currency) },
    { key: 'total', label: 'Total', align: 'right', render: (r) => money(r.total, r.currency) },
    { key: 'created_at', label: 'Created', render: (r) => dateTime(r.created_at) },
    { key: '_a', label: '', render: (r) => h('div', { class: 'row gap-1' },
      actions(r).map((a) => h('button', {
        class: `btn btn--sm ${a.variant ? `btn--${a.variant}` : ''}`,
        onClick: (e) => { e.stopPropagation(); a.onClick(); },
      }, a.label))) },
  ];

  const load = async () => {
    wrap.replaceChildren(renderTable({ columns: COLS, rows: [], loading: true }));
    try {
      const params = statusSel.value ? { status: statusSel.value } : {};
      const data = await client.listOrders(params);
      const rows = Array.isArray(data) ? data : data.items || [];
      wrap.replaceChildren(renderTable({ columns: COLS, rows, empty: 'No orders yet' }));
    } catch (e) { toastError(e.message); }
  };

  const transition = async (op, row) => {
    const ok = await confirmDialog({
      title: `${op[0].toUpperCase() + op.slice(1)} order`,
      message: `${op} order ${row.id.slice(0, 8)}?`,
      danger: op === 'cancel' || op === 'refund',
      confirmText: op[0].toUpperCase() + op.slice(1),
    });
    if (!ok) return;
    try {
      if (op === 'place') await client.placeOrder({ order_id: row.id });
      if (op === 'fulfil') await client.fulfilOrder(row.id);
      if (op === 'cancel') await client.cancelOrder(row.id);
      if (op === 'refund') await client.refundOrder(row.id);
      toastSuccess(`Order ${op}ed`);
      load();
    } catch (e) { toastError(e.message); }
  };

  const openCreate = () => {
    const schema = [
      { name: 'customer_id', label: 'Customer ID', required: true },
      { name: 'currency', label: 'Currency', value: 'USD', required: true },
      { name: 'items', label: 'Items (JSON)', type: 'textarea', required: true,
        placeholder: '[{"product_id":"…","sku":"…","quantity":1,"unit_price":100}]',
        help: 'Array of order items.' },
      { name: 'tax', label: 'Tax (minor units)', type: 'number', min: 0, value: 0 },
    ];
    openModal({
      title: 'New order', size: 'lg',
      body: (close) => buildForm(schema, async (v) => {
        try {
          const items = JSON.parse(v.items);
          const payload = { customer_id: v.customer_id, currency: v.currency, tax: v.tax, items };
          await client.placeOrder(payload);
          toastSuccess('Order placed');
          close(); load();
        } catch (e) { toastError(e.message); throw e; }
      }, { onCancel: close, submitLabel: 'Place order' }).el,
    });
  };

  statusSel.addEventListener('change', load);
  refresh.addEventListener('click', load);
  create.addEventListener('click', openCreate);
  load();
  const off = client.on('orders', load);
  return { el: root, dispose: off };
}