export const money = (amount, currency = 'USD') => {
  // Backend stores price_amount as BIGINT (minor units).
  const n = Number(amount || 0) / 100;
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n); }
  catch { return `${currency} ${n.toFixed(2)}`; }
};
export const num = (n) => new Intl.NumberFormat().format(n ?? 0);
export const dateTime = (d) => d ? new Date(d).toLocaleString() : '—';
export const date = (d) => d ? new Date(d).toLocaleDateString() : '—';
export const relTime = (d) => {
  if (!d) return '—';
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};
export const titleCase = (s) => s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '';