import { h } from '../core/dom.js';
import { renderTable, statusBadge } from '../ui/table.js';
import { buildForm } from '../ui/form.js';
import { openModal, confirmDialog } from '../ui/modal.js';
import { money } from '../core/format.js';
import { toastSuccess, toastError } from '../ui/toast.js';

export function ProductsView({ client }) {
  const root = h('div', { class: 'page' });
  const search = h('input', { class: 'input', placeholder: 'Search by name or SKU…' });
  const statusSel = h('select', { class: 'select', style: { width: '160px' } },
    ...[['', 'All statuses'], ['active', 'Active'], ['draft', 'Draft'], ['suspended', 'Suspended'], ['discontinued', 'Discontinued']]
      .map(([v, l]) => h('option', { value: v }, l)));
  const tableWrap = h('div');

  const refresh = h('button', { class: 'btn btn--sm' }, 'Refresh');
  const create = h('button', { class: 'btn btn--primary btn--sm' }, '+ New product');

  root.append(
    h('div', { class: 'page__head' },
      h('div', null, h('h1', null, 'Products'), h('div', { class: 'sub' }, 'Manage your catalog')),
      h('div', { class: 'spacer' }),
      search, statusSel, refresh, create,
    ),
    h('div', { class: 'card' }, h('div', { class: 'card__body card__body--flush' }, tableWrap)),
  );

  // Plain array — actions are in scope here, no need for a factory.
  const COLS = [
    { key: 'sku', label: 'SKU', render: (r) => h('span', { class: 'mono' }, r.sku) },
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status', render: (r) => statusBadge(r.status) },
    { key: 'price_amount', label: 'Price', align: 'right', render: (r) => money(r.price_amount, r.currency) },
    { key: 'reorder_level', label: 'Reorder', align: 'right' },
    {
      key: '_actions', label: '',
      render: (r) => h('div', { class: 'row gap-1' },
        rowActions(r).map((x) => h('button', {
          class: `btn btn--sm ${x.variant ? `btn--${x.variant}` : ''}`,
          title: x.label,
          onClick: (e) => { e.stopPropagation(); x.onClick(); },
        }, x.label)),
      ),
    },
  ];

  const rowActions = (row) => [
    { label: 'Edit',  onClick: () => openEditor(row) },
    { label: 'Stock', onClick: () => openStock(row) },
    { label: 'Delete', variant: 'danger', onClick: () => removeProduct(row) },
  ];

  const load = async () => {
    tableWrap.replaceChildren(renderTable({ columns: COLS, rows: [], loading: true }));
    try {
      const params = {};
      if (search.value.trim()) params.search = search.value.trim();
      if (statusSel.value) params.status = statusSel.value;
      const data = await client.listProducts(params);
      const rows = Array.isArray(data) ? data : (data.items || data.data || []);
      tableWrap.replaceChildren(renderTable({
        columns: COLS,
        rows,
        empty: 'No products found',
      }));
    } catch (e) {
      toastError(e.message);
      tableWrap.replaceChildren(h('div', { class: 'empty-state' }, e.message));
    }
  };

  const openEditor = (row = null) => {
    const schema = [
      { name: 'sku', label: 'SKU', required: true, value: row?.sku },
      { name: 'name', label: 'Name', required: true, value: row?.name },
      { name: 'description', label: 'Description', type: 'textarea', value: row?.description },
      { name: 'price_amount', label: 'Price (minor units)', type: 'number', required: true, min: 0, value: row?.price_amount ?? 0 },
      { name: 'currency', label: 'Currency', value: row?.currency || 'USD', required: true },
      { name: 'reorder_level', label: 'Reorder level', type: 'number', min: 0, value: row?.reorder_level ?? 0 },
      {
        name: 'status', label: 'Status', type: 'select', value: row?.status || 'draft',
        options: ['draft', 'active', 'suspended', 'discontinued'].map((v) => ({ value: v, label: v })),
      },
    ];
    openModal({
      title: row ? 'Edit product' : 'New product',
      body: (close) => buildForm(schema, async (values) => {
        try {
          if (row) await client.updateProduct(row.id, values);
          else await client.createProduct(values);
          toastSuccess(row ? 'Product updated' : 'Product created');
          close();
          load();
        } catch (e) { toastError(e.message); throw e; }
      }, { onCancel: close }).el,
    });
  };

  const openStock = (row) =>
    import('./stock.js').then(({ openStockAdjust }) =>
      openStockAdjust({ client, product: row, onDone: load }));

  const removeProduct = async (row) => {
    const ok = await confirmDialog({
      title: 'Delete product',
      message: `Delete ${row.name}? This cannot be undone.`,
      danger: true,
      confirmText: 'Delete',
    });
    if (!ok) return;
    try { await client.deleteProduct(row.id); toastSuccess('Product deleted'); load(); }
    catch (e) { toastError(e.message); }
  };

  search.addEventListener('input', debounce(load, 300));
  statusSel.addEventListener('change', load);
  refresh.addEventListener('click', load);
  create.addEventListener('click', () => openEditor(null));

  load();

  const off = client.on('products', () => load());
  return { el: root, dispose: off };
}

function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}