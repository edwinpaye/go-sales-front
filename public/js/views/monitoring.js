import { h } from '../core/dom.js';
import { store } from '../core/store.js';
import { bus } from '../core/bus.js';
import { renderTable } from '../ui/table.js';
import { dateTime } from '../core/format.js';

export function MonitoringView({ client }) {
  const root = h('div', { class: 'page' });
  const events = [];
  const tableHost = h('div', { class: 'card' });
  const meta = h('div', { class: 'grid cols-4' });

  const ping = h('button', { class: 'btn btn--sm' }, 'Ping');
  root.append(
    h('div', { class: 'page__head' },
      h('div', null,
        h('h1', null, 'Monitoring'),
        h('div', { class: 'sub' }, 'Realtime connection and event stream'),
      ),
      h('div', { class: 'spacer' }),
      ping,
    ),
    meta,
    tableHost,
  );

  const rerenderMeta = () => {
    const s = store.get();
    meta.replaceChildren(
      card('Connection', s.connection),
      card('User', s.user?.username || '—'),
      card('Role', s.user?.role || '—'),
      card('Events', String(events.length)),
    );
  };
  rerenderMeta();

  const refreshTable = () => {
    tableHost.replaceChildren(
      h('div', { class: 'card__head' },
        h('div', { class: 'card__title' }, 'Event stream'),
      ),
      h('div', { class: 'card__body card__body--flush' },
        renderTable({
          columns: [
            { key: 'time', label: 'Time', render: (r) => dateTime(r.time) },
            { key: 'topic', label: 'Topic' },
            {
              key: 'payload', label: 'Payload',
              render: (r) => h('span', {
                class: 'mono text-xs truncate',
                style: { maxWidth: '560px', display: 'inline-block' },
              }, JSON.stringify(r.payload)),
            },
          ],
          rows: events.slice(0, 200),
          empty: 'No events yet. Subscribe to topics to see updates.',
        }),
      ),
    );
  };
  refreshTable();

  const offBus = bus.on('ws-event', (ev) => {
    events.unshift({ time: Date.now(), ...ev });
    if (events.length > 500) events.pop();
    refreshTable();
  });

  // Update meta cards on store changes.
  const offStore = store.subscribe(() => rerenderMeta());

  ping.addEventListener('click', () => {
    const id = globalThis.crypto?.randomUUID?.() || String(Date.now());
    client.ws?.send(JSON.stringify({ type: 'ping', id, timestamp: new Date().toISOString() }));
  });

  return {
    el: root,
    dispose: () => { offBus(); offStore(); },
  };
}

function card(label, value) {
  return h('div', { class: 'card' },
    h('div', { class: 'card__body' },
      h('div', { class: 'stat' },
        h('div', { class: 'stat__label' }, label),
        h('div', { class: 'stat__value', style: { fontSize: 'var(--fs-xl)' } }, value),
      ),
    ),
  );
}