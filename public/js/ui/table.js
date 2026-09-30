import { h, icon } from '../core/dom.js';

/**
 * Renders a data table.
 * columns: [{ key, label, align, width, render(row), sortable }]
 * rows: array of objects
 */
export function renderTable({ columns, rows, empty = 'No data', loading = false, keyField = 'id', onRowClick }) {
  const wrap = h('div', { class: 'table-wrap' });
  const table = h('table', { class: 'table' });
  const thead = h('thead', null,
    h('tr', null, columns.map((c) => h('th', {
      class: c.align === 'right' ? 'num' : c.align === 'center' ? 'text-center' : '',
      style: c.width ? { width: c.width } : null,
    }, c.label))),
  );
  const tbody = h('tbody');
  if (loading) {
    for (let i = 0; i < 6; i++) {
      tbody.appendChild(h('tr', null, columns.map(() => h('td', null, h('div', { class: 'skeleton', style: { height: '14px' } })))));
    }
  } else if (!rows?.length) {
    tbody.appendChild(h('tr', null, h('td', { colspan: columns.length, class: 'empty' }, empty)));
  } else {
    for (const row of rows) {
      const tr = h('tr', {
        onClick: onRowClick ? () => onRowClick(row) : undefined,
        style: onRowClick ? { cursor: 'pointer' } : null,
      }, columns.map((c) => h('td', {
        class: c.align === 'right' ? 'num' : c.align === 'center' ? 'text-center' : '',
      }, c.render ? c.render(row) : row[c.key] ?? '—')));
      tr.dataset.key = row[keyField];
      tbody.appendChild(tr);
    }
  }
  table.append(thead, tbody);
  wrap.appendChild(table);
  return wrap;
}

export const statusBadge = (status) => {
  const cls = `badge badge--${status}`;
  return h('span', { class: cls }, String(status || '').replace(/_/g, ' '));
};

export const actionsCell = (actions) =>
  h('div', { class: 'row gap-1' }, actions.map((a) =>
    h('button', {
      class: `btn btn--sm ${a.variant ? `btn--${a.variant}` : ''}`,
      title: a.title || a.label,
      onClick: (e) => { e.stopPropagation(); a.onClick(); },
    }, a.icon ? icon(a.icon, 14) : a.label)));