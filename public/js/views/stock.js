import { h } from '../core/dom.js';
import { renderTable } from '../ui/table.js';
import { buildForm } from '../ui/form.js';
import { openModal } from '../ui/modal.js';
import { toastSuccess, toastError } from '../ui/toast.js';
import { num, dateTime } from '../core/format.js';

export function StockView({ client }) {
  const root = h('div', { class: 'page' });
  const lookup = h('input', { class: 'input', placeholder: 'SKU…' });
  const lookupBtn = h('button', { class: 'btn btn--sm' }, 'Look up');
  const body = h('div');

  root.append(
    h('div', { class: 'page__head' },
      h('div', null, h('h1', null, 'Stock'), h('div', { class: 'sub' }, 'Look up stock levels and record movements')),
      h('div', { class: 'spacer' }),
      lookup, lookupBtn,
    ),
    h('div', { class: 'card' }, h('div', { class: 'card__body card__body--flush' }, body)),
  );

  const doLookup = async () => {
    const sku = lookup.value.trim();
    if (!sku) return;
    body.replaceChildren(renderTable({ columns: COLS, rows: [], loading: true }));
    try {
      const stock = await client.getStockBySKU(sku);
      const history = await client.getStockHistory(stock.product_id, { limit: 25 });
      body.replaceChildren(
        renderTable({ columns: COLS, rows: [stock], empty: 'Not found' }),
        h('div', { class: 'card__head', style: { marginTop: 'var(--s-5)' } }, h('div', { class: 'card__title' }, 'Recent movements')),
        renderTable({ columns: HIST, rows: history.items || history || [], empty: 'No movements' }),
        h('div', { class: 'card__foot' },
          h('button', { class: 'btn btn--primary btn--sm', onClick: () => openStockAdjust({ client, productId: stock.product_id, sku, onDone: doLookup }) }, 'Record movement'),
        ),
      );
    } catch (e) { toastError(e.message); body.replaceChildren(h('div', { class: 'empty-state' }, 'Not found')); }
  };
  lookupBtn.addEventListener('click', doLookup);
  lookup.addEventListener('keydown', (e) => e.key === 'Enter' && doLookup());

  return { el: root };
}

const COLS = [
  { key: 'product_id', label: 'Product', render: (r) => h('span', { class: 'mono text-xs' }, (r.product_id || '').slice(0, 8)) },
  { key: 'on_hand', label: 'On hand', align: 'right', render: (r) => num(r.on_hand) },
  { key: 'reserved', label: 'Reserved', align: 'right', render: (r) => num(r.reserved) },
  { key: 'safety', label: 'Safety', align: 'right', render: (r) => num(r.safety) },
  { key: 'updated_at', label: 'Updated', render: (r) => dateTime(r.updated_at) },
];
const HIST = [
  { key: 'movement_type', label: 'Type' },
  { key: 'quantity', label: 'Qty', align: 'right' },
  { key: 'before_avail', label: 'Before', align: 'right' },
  { key: 'after_avail', label: 'After', align: 'right' },
  { key: 'reference', label: 'Reference' },
  { key: 'created_at', label: 'When', render: (r) => dateTime(r.created_at) },
];

export function openStockAdjust({ client, product, productId, sku, onDone }) {
  const pid = product?.id || productId;
  const schema = [
    { name: 'movement_type', label: 'Type', type: 'select', required: true, value: 'incoming',
      options: [
        { value: 'incoming', label: 'Incoming' },
        { value: 'outgoing', label: 'Outgoing' },
        { value: 'adjust', label: 'Adjustment' },
        { value: 'reserve', label: 'Reserve' },
        { value: 'release', label: 'Release' },
      ] },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1, value: 1 },
    { name: 'reference', label: 'Reference' },
    { name: 'note', label: 'Note', type: 'textarea' },
  ];
  openModal({
    title: `Record movement ${product?.sku || sku ? `— ${product?.sku || sku}` : ''}`,
    body: (close) => buildForm(schema, async (v) => {
      try {
        await client.stockMovement({ product_id: pid, ...v });
        toastSuccess('Movement recorded');
        close(); onDone?.();
      } catch (e) { toastError(e.message); throw e; }
    }, { onCancel: close }).el,
  });
}