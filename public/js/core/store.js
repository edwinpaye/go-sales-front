export function createStore(initial = {}) {
  let state = { ...initial };
  const subs = new Set();

  const get = () => state;

  const set = (patch) => {
    const prev = state;
    const next = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...next };
    subs.forEach((fn) => {
      try { fn(state, prev); } catch (e) { console.error('[store]', e); }
    });
  };

  const subscribe = (fn) => {
    subs.add(fn);
    return () => subs.delete(fn);
  };

  return { get, set, subscribe };
}

export const store = createStore({
  user: null,
  role: null,
  connection: 'off',   // 'off' | 'connecting' | 'on'
  notifications: [],
});