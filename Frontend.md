# Enterprise Sales System — Complete Vanilla JS Frontend

Below is a production-grade, single-page vanilla JavaScript application that works with your `SalesSystemClient` and PostgreSQL schema. It's organized into clean modules, uses a centralized CSS design system, and includes authentication, dashboard, CRUD for all entities, real-time monitoring, notifications, and resilience patterns.

## Project Structure

```
sales-ui/
├── index.html
├── css/
│   ├── tokens.css        # Design tokens (colors, spacing, typography)
│   ├── base.css          # Reset + base elements
│   ├── layout.css        # Shell, sidebar, topbar, content grid
│   ├── components.css    # Buttons, cards, tables, forms, modals, toasts
│   └── utilities.css     # Helpers
├── js/
│   ├── core/
│   │   ├── client.js     # Improved SalesSystemClient (fixed bugs)
│   │   ├── store.js      # Reactive store + pub/sub
│   │   ├── router.js     # Hash router
│   │   ├── dom.js        # h() hyperscript + helpers
│   │   ├── bus.js        # Event bus
│   │   └── format.js     # Money, dates, numbers
│   ├── ui/
│   │   ├── toast.js
│   │   ├── modal.js
│   │   ├── table.js
│   │   ├── form.js
│   │   └── sidebar.js
│   ├── views/
│   │   ├── login.js
│   │   ├── dashboard.js
│   │   ├── products.js
│   │   ├── stock.js
│   │   ├── orders.js
│   │   ├── reports.js
│   │   └── monitoring.js
│   └── app.js
└── README.md
```

---

## `index.html`

```html
<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Sales System</title>
<link rel="stylesheet" href="css/tokens.css" />
<link rel="stylesheet" href="css/base.css" />
<link rel="stylesheet" href="css/layout.css" />
<link rel="stylesheet" href="css/components.css" />
<link rel="stylesheet" href="css/utilities.css" />
</head>
<body>
  <div id="app" class="app-shell" aria-live="polite"></div>
  <div id="toasts" class="toast-stack" role="status" aria-live="polite"></div>
  <div id="modal-root"></div>
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

---

## `css/tokens.css`

```css
:root {
  /* Color primitives */
  --c-bg-0: #0b0e14;
  --c-bg-1: #12151d;
  --c-bg-2: #171b25;
  --c-bg-3: #1e2430;
  --c-bg-4: #262d3b;
  --c-border: #2a3140;
  --c-border-strong: #3a4354;

  --c-text-0: #e6ecf5;
  --c-text-1: #b7c0d0;
  --c-text-2: #8993a7;
  --c-text-3: #5c657a;

  --c-accent:      #6c8cff;
  --c-accent-2:    #8aa3ff;
  --c-accent-soft: #6c8cff22;
  --c-success:     #35c98a;
  --c-success-soft:#35c98a22;
  --c-warning:     #f0b34b;
  --c-warning-soft:#f0b34b22;
  --c-danger:      #ff5d6c;
  --c-danger-soft: #ff5d6c22;
  --c-info:        #4bc4e5;
  --c-info-soft:   #4bc4e522;

  /* Typography */
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Inter, Helvetica, Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --fs-xs: 11.5px;
  --fs-sm: 12.5px;
  --fs-md: 13.5px;
  --fs-lg: 15px;
  --fs-xl: 18px;
  --fs-2xl: 22px;
  --fs-3xl: 28px;

  /* Spacing (8pt grid) */
  --s-1: 4px;
  --s-2: 8px;
  --s-3: 12px;
  --s-4: 16px;
  --s-5: 20px;
  --s-6: 24px;
  --s-8: 32px;
  --s-10: 40px;
  --s-12: 48px;

  /* Radii */
  --r-sm: 6px;
  --r-md: 10px;
  --r-lg: 14px;
  --r-full: 999px;

  /* Shadows */
  --sh-1: 0 1px 2px rgba(0,0,0,.35);
  --sh-2: 0 6px 16px rgba(0,0,0,.4);
  --sh-3: 0 20px 48px rgba(0,0,0,.55);

  /* Layout */
  --sidebar-w: 248px;
  --sidebar-w-collapsed: 68px;
  --topbar-h: 56px;
  --content-max: 1480px;

  /* Motion */
  --ease: cubic-bezier(.2,.7,.2,1);
  --dur-fast: .12s;
  --dur: .2s;
  --dur-slow: .32s;

  /* Z-index scale */
  --z-sidebar: 30;
  --z-topbar: 40;
  --z-modal: 100;
  --z-toast: 200;
}
```

---

## `css/base.css`

```css
*, *::before, *::after { box-sizing: border-box; }
html, body { height: 100%; }
body {
  margin: 0;
  background: var(--c-bg-0);
  color: var(--c-text-0);
  font-family: var(--font-sans);
  font-size: var(--fs-md);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
h1,h2,h3,h4 { margin: 0; font-weight: 600; letter-spacing: -0.01em; }
p { margin: 0; }
button, input, select, textarea { font: inherit; color: inherit; }
a { color: var(--c-accent); text-decoration: none; }
a:hover { color: var(--c-accent-2); }
code, kbd { font-family: var(--font-mono); font-size: .92em; }
::selection { background: var(--c-accent-soft); }

/* Scrollbars */
* { scrollbar-width: thin; scrollbar-color: var(--c-bg-4) transparent; }
*::-webkit-scrollbar { width: 10px; height: 10px; }
*::-webkit-scrollbar-thumb { background: var(--c-bg-4); border-radius: var(--r-full); border: 2px solid transparent; background-clip: content-box; }
*::-webkit-scrollbar-thumb:hover { background: var(--c-border-strong); background-clip: content-box; }

/* Focus */
:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; border-radius: var(--r-sm); }
```

---

## `css/layout.css`

```css
.app-shell {
  display: grid;
  grid-template-columns: var(--sidebar-w) 1fr;
  grid-template-rows: var(--topbar-h) 1fr;
  grid-template-areas: "sidebar topbar" "sidebar main";
  min-height: 100vh;
  transition: grid-template-columns var(--dur) var(--ease);
}
.app-shell[data-collapsed="true"] { grid-template-columns: var(--sidebar-w-collapsed) 1fr; }

/* Sidebar */
.sidebar {
  grid-area: sidebar;
  background: var(--c-bg-1);
  border-right: 1px solid var(--c-border);
  display: flex; flex-direction: column;
  position: sticky; top: 0; height: 100vh;
  z-index: var(--z-sidebar);
}
.sidebar__brand {
  display: flex; align-items: center; gap: var(--s-3);
  height: var(--topbar-h);
  padding: 0 var(--s-4);
  border-bottom: 1px solid var(--c-border);
  flex: 0 0 auto;
}
.sidebar__logo {
  width: 28px; height: 28px; border-radius: var(--r-sm);
  background: linear-gradient(135deg, var(--c-accent), #b06cff);
  display: grid; place-items: center; font-weight: 700; color: #fff; font-size: var(--fs-sm);
  flex: 0 0 auto;
}
.sidebar__title { font-weight: 600; font-size: var(--fs-lg); white-space: nowrap; overflow: hidden; }
.sidebar__nav { flex: 1 1 auto; overflow-y: auto; padding: var(--s-3) var(--s-2); display: flex; flex-direction: column; gap: 2px; }
.sidebar__section { margin: var(--s-4) var(--s-3) var(--s-2); font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: .08em; color: var(--c-text-3); }
.sidebar__link {
  display: flex; align-items: center; gap: var(--s-3);
  padding: 9px var(--s-3);
  border-radius: var(--r-md);
  color: var(--c-text-1);
  cursor: pointer; user-select: none;
  border: 1px solid transparent;
  transition: background var(--dur-fast), color var(--dur-fast);
  white-space: nowrap;
}
.sidebar__link:hover { background: var(--c-bg-3); color: var(--c-text-0); }
.sidebar__link[aria-current="page"] {
  background: var(--c-accent-soft); color: var(--c-accent-2);
  border-color: #6c8cff33;
}
.sidebar__link svg { flex: 0 0 auto; width: 18px; height: 18px; }
.sidebar__link .label { overflow: hidden; text-overflow: ellipsis; }
.sidebar__footer { padding: var(--s-3); border-top: 1px solid var(--c-border); }
.app-shell[data-collapsed="true"] .sidebar__title,
.app-shell[data-collapsed="true"] .sidebar__link .label,
.app-shell[data-collapsed="true"] .sidebar__section,
.app-shell[data-collapsed="true"] .user-chip__meta { display: none; }
.app-shell[data-collapsed="true"] .sidebar__link { justify-content: center; }
.app-shell[data-collapsed="true"] .user-chip { justify-content: center; }

/* Topbar */
.topbar {
  grid-area: topbar;
  background: color-mix(in srgb, var(--c-bg-1) 88%, transparent);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--c-border);
  display: flex; align-items: center; gap: var(--s-3);
  padding: 0 var(--s-5);
  position: sticky; top: 0; z-index: var(--z-topbar);
}
.topbar__title { font-size: var(--fs-lg); font-weight: 600; }
.topbar__spacer { flex: 1 1 auto; }
.topbar__search { flex: 0 1 380px; }

/* Main */
.main { grid-area: main; padding: var(--s-6); max-width: var(--content-max); width: 100%; margin: 0 auto; }
.page { display: flex; flex-direction: column; gap: var(--s-5); }
.page__head { display: flex; align-items: center; gap: var(--s-4); flex-wrap: wrap; }
.page__head h1 { font-size: var(--fs-2xl); }
.page__head .sub { color: var(--c-text-2); font-size: var(--fs-sm); }
.page__head .spacer { flex: 1 1 auto; }

/* Grid helpers */
.grid { display: grid; gap: var(--s-4); }
.grid.cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid.cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid.cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.grid.auto   { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
@media (max-width: 1100px) { .grid.cols-4 { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 860px) {
  .app-shell { grid-template-columns: var(--sidebar-w-collapsed) 1fr; }
  .grid.cols-3, .grid.cols-2 { grid-template-columns: 1fr; }
  .main { padding: var(--s-4); }
}
```

---

## `css/components.css`

```css
/* ============ Buttons ============ */
.btn {
  --btn-bg: var(--c-bg-3);
  --btn-fg: var(--c-text-0);
  --btn-bd: var(--c-border);
  display: inline-flex; align-items: center; gap: var(--s-2);
  padding: 8px 14px;
  background: var(--btn-bg); color: var(--btn-fg);
  border: 1px solid var(--btn-bd); border-radius: var(--r-md);
  cursor: pointer; user-select: none;
  font-weight: 500; font-size: var(--fs-md);
  transition: background var(--dur-fast), border-color var(--dur-fast), transform var(--dur-fast);
  white-space: nowrap;
}
.btn:hover { background: var(--c-bg-4); border-color: var(--c-border-strong); }
.btn:active { transform: translateY(1px); }
.btn:disabled { opacity: .5; cursor: not-allowed; }
.btn--primary { --btn-bg: var(--c-accent); --btn-fg: #fff; --btn-bd: var(--c-accent); }
.btn--primary:hover { --btn-bg: var(--c-accent-2); --btn-bd: var(--c-accent-2); }
.btn--success { --btn-bg: var(--c-success); --btn-fg: #04160e; --btn-bd: var(--c-success); }
.btn--danger  { --btn-bg: var(--c-danger);  --btn-fg: #1a0206; --btn-bd: var(--c-danger); }
.btn--ghost   { --btn-bg: transparent; }
.btn--sm { padding: 5px 10px; font-size: var(--fs-sm); border-radius: var(--r-sm); }
.btn--icon { padding: 8px; }
.btn--block { width: 100%; justify-content: center; }

/* ============ Inputs ============ */
.field { display: flex; flex-direction: column; gap: 6px; }
.field > label { font-size: var(--fs-sm); color: var(--c-text-2); font-weight: 500; }
.input, .select, .textarea {
  width: 100%;
  padding: 9px 12px;
  background: var(--c-bg-2);
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  color: var(--c-text-0);
  transition: border-color var(--dur-fast), background var(--dur-fast);
}
.input:hover, .select:hover, .textarea:hover { border-color: var(--c-border-strong); }
.input:focus, .select:focus, .textarea:focus { outline: none; border-color: var(--c-accent); background: var(--c-bg-1); }
.input::placeholder { color: var(--c-text-3); }
.textarea { resize: vertical; min-height: 84px; font-family: inherit; }
.input-group { position: relative; display: flex; align-items: center; }
.input-group .input { padding-left: 36px; }
.input-group svg { position: absolute; left: 10px; width: 16px; height: 16px; color: var(--c-text-3); pointer-events: none; }
.field-error { color: var(--c-danger); font-size: var(--fs-xs); }

/* ============ Cards ============ */
.card {
  background: var(--c-bg-1);
  border: 1px solid var(--c-border);
  border-radius: var(--r-lg);
  box-shadow: var(--sh-1);
}
.card__head { display: flex; align-items: center; gap: var(--s-3); padding: var(--s-4) var(--s-5); border-bottom: 1px solid var(--c-border); }
.card__title { font-size: var(--fs-lg); font-weight: 600; }
.card__sub { color: var(--c-text-2); font-size: var(--fs-sm); }
.card__body { padding: var(--s-5); }
.card__body--flush { padding: 0; }
.card__foot { padding: var(--s-3) var(--s-5); border-top: 1px solid var(--c-border); display: flex; gap: var(--s-2); justify-content: flex-end; }

/* Stat card */
.stat { display: flex; flex-direction: column; gap: var(--s-2); }
.stat__label { font-size: var(--fs-sm); color: var(--c-text-2); }
.stat__value { font-size: var(--fs-3xl); font-weight: 700; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.stat__delta { font-size: var(--fs-sm); color: var(--c-text-2); display: inline-flex; gap: 4px; align-items: center; }
.stat__delta.up { color: var(--c-success); }
.stat__delta.down { color: var(--c-danger); }

/* ============ Tables ============ */
.table-wrap { overflow: auto; border-radius: var(--r-lg); }
.table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: var(--fs-md); }
.table thead th {
  position: sticky; top: 0; z-index: 1;
  background: var(--c-bg-2);
  color: var(--c-text-2);
  font-weight: 600; font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: .06em;
  text-align: left; padding: 10px var(--s-4);
  border-bottom: 1px solid var(--c-border);
  white-space: nowrap;
}
.table tbody td { padding: 10px var(--s-4); border-bottom: 1px solid var(--c-border); vertical-align: middle; }
.table tbody tr:hover td { background: var(--c-bg-2); }
.table tbody tr:last-child td { border-bottom: none; }
.table .num { text-align: right; font-variant-numeric: tabular-nums; }
.table .muted { color: var(--c-text-2); }
.table .empty { padding: var(--s-8); text-align: center; color: var(--c-text-2); }

/* ============ Badges ============ */
.badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 2px 8px; border-radius: var(--r-full);
  font-size: var(--fs-xs); font-weight: 600; letter-spacing: .02em;
  border: 1px solid transparent;
}
.badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.badge--active, .badge--placed, .badge--incoming, .badge--fulfilled { background: var(--c-success-soft); color: var(--c-success); }
.badge--draft, .badge--pending, .badge--adjust { background: var(--c-bg-4); color: var(--c-text-1); }
.badge--suspended, .badge--reserved, .badge--reserve { background: var(--c-warning-soft); color: var(--c-warning); }
.badge--discontinued, .badge--cancelled, .badge--refunded, .badge--locked, .badge--disabled { background: var(--c-danger-soft); color: var(--c-danger); }
.badge--info { background: var(--c-info-soft); color: var(--c-info); }

/* ============ Modal ============ */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.55);
  backdrop-filter: blur(3px);
  display: grid; place-items: center;
  z-index: var(--z-modal);
  animation: fadeIn var(--dur) var(--ease);
  padding: var(--s-4);
}
.modal {
  background: var(--c-bg-1);
  border: 1px solid var(--c-border);
  border-radius: var(--r-lg);
  box-shadow: var(--sh-3);
  width: min(640px, 100%);
  max-height: 88vh;
  display: flex; flex-direction: column;
  animation: pop var(--dur) var(--ease);
}
.modal--lg { width: min(920px, 100%); }
.modal__head { display: flex; align-items: center; gap: var(--s-3); padding: var(--s-4) var(--s-5); border-bottom: 1px solid var(--c-border); }
.modal__title { font-size: var(--fs-xl); font-weight: 600; flex: 1 1 auto; }
.modal__body { padding: var(--s-5); overflow-y: auto; }
.modal__foot { padding: var(--s-4) var(--s-5); border-top: 1px solid var(--c-border); display: flex; gap: var(--s-2); justify-content: flex-end; }

@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes pop { from { opacity: 0; transform: translateY(8px) scale(.98) } to { opacity: 1; transform: none } }

/* ============ Toast ============ */
.toast-stack {
  position: fixed; right: var(--s-5); bottom: var(--s-5);
  display: flex; flex-direction: column; gap: var(--s-2);
  z-index: var(--z-toast); pointer-events: none;
}
.toast {
  pointer-events: auto;
  background: var(--c-bg-2);
  border: 1px solid var(--c-border);
  border-left: 3px solid var(--c-info);
  border-radius: var(--r-md);
  padding: var(--s-3) var(--s-4);
  box-shadow: var(--sh-2);
  min-width: 280px; max-width: 420px;
  animation: slideIn var(--dur) var(--ease);
}
.toast--success { border-left-color: var(--c-success); }
.toast--error   { border-left-color: var(--c-danger); }
.toast--warning { border-left-color: var(--c-warning); }
.toast__title { font-weight: 600; margin-bottom: 2px; }
.toast__msg { color: var(--c-text-2); font-size: var(--fs-sm); }
@keyframes slideIn { from { opacity: 0; transform: translateX(20px) } to { opacity: 1; transform: none } }

/* ============ User chip ============ */
.user-chip { display: flex; align-items: center; gap: var(--s-3); padding: 6px; border-radius: var(--r-md); }
.user-chip:hover { background: var(--c-bg-3); }
.user-chip__avatar {
  width: 32px; height: 32px; border-radius: var(--r-full);
  background: linear-gradient(135deg, var(--c-accent), #b06cff);
  display: grid; place-items: center;
  font-weight: 700; color: #fff; font-size: var(--fs-sm);
}
.user-chip__meta { display: flex; flex-direction: column; min-width: 0; }
.user-chip__name { font-size: var(--fs-sm); font-weight: 600; }
.user-chip__role { font-size: var(--fs-xs); color: var(--c-text-2); text-transform: capitalize; }

/* ============ Connection indicator ============ */
.conn { display: inline-flex; align-items: center; gap: 6px; font-size: var(--fs-xs); color: var(--c-text-2); }
.conn__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--c-text-3); }
.conn--on .conn__dot { background: var(--c-success); box-shadow: 0 0 0 3px var(--c-success-soft); }
.conn--off .conn__dot { background: var(--c-danger); }
.conn--connecting .conn__dot { background: var(--c-warning); animation: pulse 1s infinite; }
@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .4 } }

/* ============ Skeleton ============ */
.skeleton { background: linear-gradient(90deg, var(--c-bg-2), var(--c-bg-3), var(--c-bg-2)); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: var(--r-sm); }
@keyframes shimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }

/* ============ Login page ============ */
.login-wrap { min-height: 100vh; display: grid; place-items: center; padding: var(--s-6); }
.login-card { width: min(420px, 100%); }
.login-card .card__body { padding: var(--s-8) var(--s-6); }
.login-brand { display: flex; flex-direction: column; align-items: center; gap: var(--s-3); margin-bottom: var(--s-6); }
.login-brand__logo { width: 48px; height: 48px; border-radius: var(--r-md); background: linear-gradient(135deg, var(--c-accent), #b06cff); display: grid; place-items: center; font-weight: 800; color: #fff; font-size: var(--fs-xl); }

/* ============ Tabs ============ */
.tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--c-border); }
.tab { padding: 8px 14px; cursor: pointer; border-bottom: 2px solid transparent; color: var(--c-text-2); font-weight: 500; }
.tab:hover { color: var(--c-text-0); }
.tab[aria-selected="true"] { color: var(--c-accent-2); border-bottom-color: var(--c-accent); }

/* ============ Empty state ============ */
.empty-state { display: flex; flex-direction: column; align-items: center; gap: var(--s-3); padding: var(--s-10); color: var(--c-text-2); text-align: center; }
.empty-state svg { width: 48px; height: 48px; opacity: .4; }
```

---

## `css/utilities.css`

```css
.row { display: flex; align-items: center; gap: var(--s-2); }
.row.wrap { flex-wrap: wrap; }
.col { display: flex; flex-direction: column; gap: var(--s-2); }
.spacer { flex: 1 1 auto; }
.muted { color: var(--c-text-2); }
.dim { color: var(--c-text-3); }
.mono { font-family: var(--font-mono); }
.nowrap { white-space: nowrap; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.text-sm { font-size: var(--fs-sm); }
.text-xs { font-size: var(--fs-xs); }
.text-lg { font-size: var(--fs-lg); }
.text-right { text-align: right; }
.text-center { text-align: center; }
.mt-2 { margin-top: var(--s-2); } .mt-4 { margin-top: var(--s-4); } .mt-6 { margin-top: var(--s-6); }
.mb-2 { margin-bottom: var(--s-2); } .mb-4 { margin-bottom: var(--s-4); }
.gap-1 { gap: var(--s-1); } .gap-2 { gap: var(--s-2); } .gap-3 { gap: var(--s-3); } .gap-4 { gap: var(--s-4); }
.hidden { display: none !important; }
.pill { padding: 3px 10px; border-radius: var(--r-full); background: var(--c-bg-3); font-size: var(--fs-xs); }
```

---

## `js/core/client.js` — Improved `SalesSystemClient`

This fixes several bugs in the original (unsubscribe payload, `crypto.randomUUID` fallback, reconnect on token-less sockets, topic routing for `snapshot`, plus a small **topic router** for event demux).

```js
/**
 * SalesSystemClient — enterprise-grade client for the Sales System backend.
 * Improvements over the reference: safer subscribe/unsubscribe, uuid fallback,
 * exponential backoff with jitter, topic-based event router, session events.
 */
export class SalesSystemClient {
  constructor(opts = {}) {
    this.baseUrl = (opts.baseUrl || 'http://localhost:8080').replace(/\/+$/, '');
    this.wsPath = opts.wsPath || '/ws';
    this.token = opts.token || null;
    this.refreshToken = opts.refreshToken || null;
    this.autoReconnect = opts.autoReconnect !== false;
    this.maxReconnectDelayMs = opts.maxReconnectDelayMs || 30000;
    this.logger = opts.logger || (() => {});
    this.onSession = opts.onSession || null; // (event) => void

    this.ws = null;
    this.topics = new Set();
    this.handlers = new Map();
    this.protocolHandlers = new Map();
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.manualClose = false;
    this.pingTimer = null;
    this.connected = false;
    this._pendingResolves = [];
    this._refreshInflight = null;
  }

  // ---- REST ----
  _url(path) { return `${this.baseUrl}${path}`; }
  _headers(auth = true) {
    const h = { 'Content-Type': 'application/json' };
    if (auth && this.token) h['Authorization'] = `Bearer ${this.token}`;
    return h;
  }
  async _request(method, path, body, auth = true, retried = false) {
    let res;
    try {
      res = await fetch(this._url(path), {
        method,
        headers: this._headers(auth),
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      const err = new Error('Network error'); err.code = 'NETWORK'; throw err;
    }
    if (res.status === 401 && auth && this.refreshToken && !retried) {
      const ok = await this._tryRefresh();
      if (ok) return this._request(method, path, body, auth, true);
    }
    if (res.status === 204) return null;
    const text = await res.text();
    const data = text ? safeJson(text) : {};
    if (!res.ok) {
      const err = new Error(data.message || data.error || `HTTP ${res.status}`);
      err.code = data.code; err.status = res.status; throw err;
    }
    return data;
  }

  // ---- Auth ----
  register(p) { return this._request('POST', '/api/v1/auth/register', p, false); }
  async login(email, password, { connect = true } = {}) {
    const data = await this._request('POST', '/api/v1/auth/login', { email, password }, false);
    this._applyTokens(data);
    if (connect) await this.connect();
    return data;
  }
  async _tryRefresh() {
    if (this._refreshInflight) return this._refreshInflight;
    this._refreshInflight = (async () => {
      try {
        const data = await this._request('POST', '/api/v1/auth/refresh', { refresh_token: this.refreshToken }, false);
        this._applyTokens(data);
        this.logger('token refreshed');
        return true;
      } catch (e) {
        this.logger('refresh failed', e.message);
        this._emitProtocol('error', { code: 'SESSION_EXPIRED', message: e.message });
        this._emitSession({ type: 'expired' });
        return false;
      } finally { this._refreshInflight = null; }
    })();
    return this._refreshInflight;
  }
  async logout() {
    try { await this._request('POST', '/api/v1/auth/logout', { refresh_token: this.refreshToken }); }
    finally {
      this.token = null; this.refreshToken = null; this.disconnect();
      this._emitSession({ type: 'logout' });
    }
  }
  changePassword(oldPassword, newPassword) {
    return this._request('POST', '/api/v1/auth/change-password',
      { old_password: oldPassword, new_password: newPassword });
  }
  _applyTokens(d) { this.token = d.access_token; this.refreshToken = d.refresh_token; }
  _emitSession(ev) { try { this.onSession?.(ev); } catch {} }

  // ---- Products ----
  listProducts(params = {}) { return this._request('GET', `/api/v1/products?${qs(params)}`); }
  getProduct(id) { return this._request('GET', `/api/v1/products/${id}`); }
  getProductBySKU(sku) { return this._request('GET', `/api/v1/products/sku/${encodeURIComponent(sku)}`); }
  createProduct(p) { return this._request('POST', '/api/v1/products', p); }
  updateProduct(id, p) { return this._request('PUT', `/api/v1/products/${id}`, p); }
  changeProductStatus(id, status) { return this._request('PATCH', `/api/v1/products/${id}/status`, { status }); }
  deleteProduct(id) { return this._request('DELETE', `/api/v1/products/${id}`); }

  // ---- Stock ----
  getStock(productId) { return this._request('GET', `/api/v1/stock/${productId}`); }
  getStockBySKU(sku) { return this._request('GET', `/api/v1/stock/sku/${encodeURIComponent(sku)}`); }
  getStockHistory(productId, params = {}) { return this._request('GET', `/api/v1/stock/${productId}/history?${qs(params)}`); }
  stockMovement(m) { return this._request('POST', '/api/v1/stock/movements', m); }

  // ---- Orders ----
  listOrders(params = {}) { return this._request('GET', `/api/v1/orders?${qs(params)}`); }
  getOrder(id) { return this._request('GET', `/api/v1/orders/${id}`); }
  placeOrder(o) { return this._request('POST', '/api/v1/orders', o); }
  fulfilOrder(id) { return this._request('POST', `/api/v1/orders/${id}/fulfil`); }
  cancelOrder(id) { return this._request('POST', `/api/v1/orders/${id}/cancel`); }
  refundOrder(id) { return this._request('POST', `/api/v1/orders/${id}/refund`); }

  // ---- Reports ----
  salesSummary(p = {}) { return this._request('GET', `/api/v1/reports/sales-summary?${qs(p)}`); }
  topProducts(p = {}) { return this._request('GET', `/api/v1/reports/top-products?${qs(p)}`); }
  stockValuation(currency) { return this._request('GET', `/api/v1/reports/stock-valuation${currency ? `?currency=${currency}` : ''}`); }
  slowMovers(p = {}) { return this._request('GET', `/api/v1/reports/slow-movers?${qs(p)}`); }
  lowStock(limit = 100) { return this._request('GET', `/api/v1/reports/low-stock?limit=${limit}`); }
  revenueByDay(p = {}) { return this._request('GET', `/api/v1/reports/revenue-by-day?${qs(p)}`); }
  ordersByStatus(p = {}) { return this._request('GET', `/api/v1/reports/orders-by-status?${qs(p)}`); }
  salespersonPerformance(p = {}) { return this._request('GET', `/api/v1/reports/salesperson-performance?${qs(p)}`); }
  adminDashboard(p = {}) { return this._request('GET', `/api/v1/reports/admin-dashboard?${qs(p)}`); }
  stockMovementAudit(p = {}) { return this._request('GET', `/api/v1/reports/stock-movement-audit?${qs(p)}`); }
  userActivity(p = {}) { return this._request('GET', `/api/v1/reports/user-activity?${qs(p)}`); }

  // ---- WebSocket ----
  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return this._connectedPromise();
    }
    if (!this.token) return Promise.reject(new Error('no token: call login() first'));
    this.manualClose = false;
    const wsUrl = this.baseUrl.replace(/^http/, 'ws') + this.wsPath + `?token=${encodeURIComponent(this.token)}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      this._startPing();
      if (this.topics.size > 0) this._sendSubscribe([...this.topics]);
      this.logger('ws connected');
      this._emitProtocol('open', {});
      this._flushPending();
    };
    this.ws.onmessage = (ev) => {
      let env; try { env = JSON.parse(ev.data); } catch { return; }
      switch (env.type) {
        case 'event':    if (env.topic) this._emit(env.topic, env.payload, env); break;
        case 'snapshot': this._emitProtocol('snapshot', env); if (env.topic) this._emit(env.topic, env.payload, env); break;
        case 'ack':      this._emitProtocol('ack', env); break;
        case 'pong':     this._emitProtocol('pong', env); break;
        case 'error':    this._emitProtocol('error', env.payload || env); break;
      }
    };
    this.ws.onclose = () => {
      this.connected = false;
      this._stopPing();
      this.logger('ws closed');
      this._emitProtocol('close', {});
      if (this.autoReconnect && !this.manualClose) this._scheduleReconnect();
    };
    this.ws.onerror = () => this.logger('ws error');
    return this._connectedPromise();
  }
  disconnect() {
    this.manualClose = true;
    this._stopPing();
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    if (this.ws) { try { this.ws.close(); } catch {} this.ws = null; }
    this.connected = false;
  }
  async subscribe(topics) {
    topics.forEach((t) => this.topics.add(t));
    if (!this.connected) await this.connect();
    else this._sendSubscribe([...topics]);
  }
  unsubscribe(topics) {
    topics.forEach((t) => this.topics.delete(t));
    if (this.connected) this._send({ type: 'unsubscribe', payload: topics });
  }
  on(topic, fn) { return this._addHandler(this.handlers, topic, fn); }
  onProtocol(type, fn) { return this._addHandler(this.protocolHandlers, type, fn); }
  off(topic, fn) {
    this.handlers.get(topic)?.delete(fn);
    this.protocolHandlers.get(topic)?.delete(fn);
  }

  // ---- internals ----
  _sendSubscribe(topics) { if (topics.length) this._send({ type: 'subscribe', payload: topics }); }
  _send(obj) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ id: uuid(), timestamp: new Date().toISOString(), ...obj }));
    }
  }
  _startPing() { this._stopPing(); this.pingTimer = setInterval(() => this._send({ type: 'ping' }), 30000); }
  _stopPing() { if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; } }
  _scheduleReconnect() {
    this.reconnectAttempts += 1;
    const base = Math.min(1000 * 2 ** this.reconnectAttempts, this.maxReconnectDelayMs);
    const delay = base / 2 + Math.random() * (base / 2); // jitter
    this.logger(`reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts})`);
    this.reconnectTimer = setTimeout(async () => {
      if (this.refreshToken) await this._tryRefresh();
      this.connect().catch(() => {});
    }, delay);
  }
  _addHandler(map, key, fn) { if (!map.has(key)) map.set(key, new Set()); map.get(key).add(fn); return () => this.off(key, fn); }
  _emit(topic, payload, env) {
    this.handlers.get(topic)?.forEach((fn) => { try { fn(payload, env); } catch (e) { this.logger('handler error', e); } });
  }
  _emitProtocol(type, payload) {
    this.protocolHandlers.get(type)?.forEach((fn) => { try { fn(payload); } catch (e) { this.logger('protocol handler error', e); } });
  }
  _connectedPromise() {
    if (this.connected) return Promise.resolve();
    return new Promise((resolve) => this._pendingResolves.push(resolve));
  }
  _flushPending() { const p = this._pendingResolves.splice(0); p.forEach((r) => r()); }
}

function qs(obj) {
  const u = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => { if (v != null && v !== '') u.set(k, v); });
  return u.toString();
}
function safeJson(t) { try { return JSON.parse(t); } catch { return {}; } }
function uuid() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0; const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
```

---

## `js/core/store.js`

```js
export function createStore(initial = {}) {
  let state = { ...initial };
  const subs = new Set();
  const get = () => state;
  const set = (patch) => {
    const next = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...next };
    subs.forEach((fn) => { try { fn(state); } catch {} });
  };
  const subscribe = (fn) => { subs.add(fn); return () => subs.delete(fn); };
  return { get, set, subscribe };
}
export const store = createStore({
  user: null, role: null,
  connection: 'off',   // 'off' | 'connecting' | 'on'
  notifications: [],
});
```

---

## `js/core/bus.js`

```js
const listeners = new Map();
export const bus = {
  on(evt, fn) { if (!listeners.has(evt)) listeners.set(evt, new Set()); listeners.get(evt).add(fn); return () => bus.off(evt, fn); },
  off(evt, fn) { listeners.get(evt)?.delete(fn); },
  emit(evt, payload) { listeners.get(evt)?.forEach((fn) => { try { fn(payload); } catch (e) { console.error(e); } }); },
};
```

---

## `js/core/dom.js` — Hyperscript

```js
/**
 * h(tag, props, ...children) — small hyperscript.
 * Supports: className, onClick, style object, data-*, attributes.
 */
export function h(tag, props = null, ...children) {
  const el = document.createElement(tag);
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class' || k === 'className') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'html') el.innerHTML = v;
    else if (k in el && k !== 'list') { try { el[k] = v; } catch { el.setAttribute(k, v); } }
    else el.setAttribute(k, v);
  }
  append(el, children);
  return el;
}
function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false || c === true) continue;
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }
export function mount(el, node) { clear(el); el.appendChild(node); }
export function frag(...children) { const f = document.createDocumentFragment(); append(f, children); return f; }
export function icon(name, size = 18) {
  const paths = ICONS[name] || '';
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  el.setAttribute('viewBox', '0 0 24 24');
  el.setAttribute('width', size); el.setAttribute('height', size);
  el.setAttribute('fill', 'none'); el.setAttribute('stroke', 'currentColor');
  el.setAttribute('stroke-width', '1.8'); el.setAttribute('stroke-linecap', 'round'); el.setAttribute('stroke-linejoin', 'round');
  el.innerHTML = paths;
  return el;
}
const ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  products:  '<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>',
  stock:     '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/><circle cx="8" cy="7" r="1"/><circle cx="8" cy="12" r="1"/><circle cx="8" cy="17" r="1"/>',
  orders:    '<path d="M6 3h12l1 4H5l1-4z"/><path d="M3 7h18l-2 14H5L3 7z"/><path d="M9 11h6"/>',
  reports:   '<path d="M4 20V4"/><path d="M4 20h16"/><rect x="8" y="12" width="3" height="6"/><rect x="13" y="8" width="3" height="10"/><rect x="18" y="5" width="3" height="13"/>',
  monitor:   '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 22h8"/><path d="M12 18v4"/>',
  logout:    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
  user:      '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  search:    '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  plus:      '<path d="M12 5v14"/><path d="M5 12h14"/>',
  refresh:   '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
  close:     '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
  edit:      '<path d="M4 20h4l10-10-4-4L4 16z"/><path d="M14 6l4 4"/>',
  trash:     '<path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/>',
  bell:      '<path d="M6 8a6 6 0 1 1 12 0v5l2 3H4l2-3z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
  menu:      '<path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/>',
  chart:     '<path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-6"/>',
  warning:   '<path d="M12 3l10 18H2L12 3z"/><path d="M12 9v5"/><path d="M12 17h.01"/>',
  check:     '<path d="M20 6L9 17l-5-5"/>',
};
```

---

## `js/core/format.js`

```js
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
```

---

## `js/ui/toast.js`

```js
import { h } from '../core/dom.js';

export function toast(message, { type = 'info', title, duration = 4000 } = {}) {
  const root = document.getElementById('toasts');
  const el = h('div', { class: `toast toast--${type}` },
    title && h('div', { class: 'toast__title' }, title),
    h('div', { class: 'toast__msg' }, message),
  );
  root.appendChild(el);
  const t = setTimeout(remove, duration);
  el.addEventListener('click', remove);
  function remove() { clearTimeout(t); el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; setTimeout(() => el.remove(), 180); }
}
export const toastSuccess = (m, o) => toast(m, { ...o, type: 'success' });
export const toastError   = (m, o) => toast(m, { ...o, type: 'error' });
export const toastWarning = (m, o) => toast(m, { ...o, type: 'warning' });
```

---

## `js/ui/modal.js`

```js
import { h } from '../core/dom.js';

export function openModal({ title, body, footer, size = 'md', onClose } = {}) {
  const root = document.getElementById('modal-root');
  const backdrop = h('div', { class: 'modal-backdrop', role: 'dialog', 'aria-modal': 'true' });
  const modal = h('div', { class: `modal ${size === 'lg' ? 'modal--lg' : ''}` });
  const close = () => { backdrop.remove(); document.removeEventListener('keydown', onKey); onClose?.(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  modal.appendChild(h('div', { class: 'modal__head' },
    h('div', { class: 'modal__title' }, title),
    h('button', { class: 'btn btn--ghost btn--icon', 'aria-label': 'Close', onClick: close }, '✕'),
  ));
  modal.appendChild(h('div', { class: 'modal__body' }, typeof body === 'function' ? body(close) : body));
  if (footer) modal.appendChild(h('div', { class: 'modal__foot' }, typeof footer === 'function' ? footer(close) : footer));
  backdrop.appendChild(modal);
  backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) close(); });
  document.addEventListener('keydown', onKey);
  root.appendChild(backdrop);
  return { close, el: modal };
}

export function confirmDialog({ title = 'Confirm', message, confirmText = 'Confirm', danger = false }) {
  return new Promise((resolve) => {
    const m = openModal({
      title,
      body: h('p', { class: 'muted' }, message),
      footer: (close) => [
        h('button', { class: 'btn', onClick: () => { close(); resolve(false); } }, 'Cancel'),
        h('button', {
          class: `btn ${danger ? 'btn--danger' : 'btn--primary'}`,
          onClick: () => { close(); resolve(true); },
        }, confirmText),
      ],
      onClose: () => resolve(false),
    });
    void m;
  });
}
```

---

## `js/ui/form.js`

```js
import { h } from '../core/dom.js';

/**
 * Build a form from a schema.
 * field: { name, label, type, required, options, placeholder, help, value, min, max, step, rows, hidden }
 * onSubmit(values) — return value / throw to keep modal open.
 */
export function buildForm(schema, onSubmit, { submitLabel = 'Save', cancelLabel = 'Cancel', onCancel } = {}) {
  const form = h('form', { class: 'col gap-4', noValidate: true });
  const inputs = new Map();
  for (const f of schema) {
    if (f.hidden) continue;
    const id = `f-${f.name}`;
    let control;
    const val = f.value ?? '';
    switch (f.type) {
      case 'textarea':
        control = h('textarea', { id, name: f.name, class: 'textarea', rows: f.rows || 3, placeholder: f.placeholder || '', required: f.required });
        control.value = val; break;
      case 'select':
        control = h('select', { id, name: f.name, class: 'select', required: f.required },
          !f.required && h('option', { value: '' }, '—'),
          (f.options || []).map((o) => h('option', { value: o.value, selected: String(o.value) === String(val) }, o.label)),
        ); break;
      default:
        control = h('input', {
          id, name: f.name, class: 'input', type: f.type || 'text',
          placeholder: f.placeholder || '', required: f.required,
          min: f.min, max: f.max, step: f.step,
        });
        control.value = val;
    }
    inputs.set(f.name, control);
    form.appendChild(h('div', { class: 'field' },
      h('label', { for: id }, f.label, f.required && h('span', { style: { color: 'var(--c-danger)', marginLeft: '4px' } }, '*')),
      control,
      f.help && h('div', { class: 'text-xs muted' }, f.help),
    ));
  }
  const error = h('div', { class: 'field-error hidden' });
  form.appendChild(error);
  const btnRow = h('div', { class: 'row', style: { justifyContent: 'flex-end', gap: '8px' } },
    h('button', { type: 'button', class: 'btn', onClick: () => onCancel?.() }, cancelLabel),
    h('button', { type: 'submit', class: 'btn btn--primary' }, submitLabel),
  );
  form.appendChild(btnRow);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.classList.add('hidden');
    const values = {};
    for (const f of schema) {
      const el = inputs.get(f.name); if (!el) continue;
      let v = el.value;
      if (f.type === 'number') v = v === '' ? null : Number(v);
      if (f.transform) v = f.transform(v);
      values[f.name] = v;
    }
    const submit = form.querySelector('button[type=submit]');
    submit.disabled = true;
    try { await onSubmit(values); }
    catch (err) {
      error.textContent = err?.message || String(err);
      error.classList.remove('hidden');
    } finally { submit.disabled = false; }
  });

  return { el: form, inputs };
}
```

---

## `js/ui/table.js`

```js
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
```

---

## `js/core/router.js`

```js
import { bus } from './bus.js';

export function createRouter({ routes, notFound }) {
  const resolve = () => {
    const hash = location.hash.replace(/^#\/?/, '') || 'dashboard';
    const [path, queryStr] = hash.split('?');
    const segments = path.split('/').filter(Boolean);
    const query = Object.fromEntries(new URLSearchParams(queryStr || ''));
    for (const r of routes) {
      const m = match(r.path, segments);
      if (m) return { route: r, params: m, query, path };
    }
    return { route: { view: notFound }, params: {}, query, path };
  };
  const go = (p) => { if (location.hash !== `#/${p}`) location.hash = `#/${p}`; else bus.emit('route', resolve()); };
  window.addEventListener('hashchange', () => bus.emit('route', resolve()));
  return { resolve, go };
}
function match(pattern, segments) {
  const p = pattern.split('/').filter(Boolean);
  if (p.length !== segments.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(segments[i]);
    else if (p[i] !== segments[i]) return null;
  }
  return params;
}
```

---

## `js/ui/sidebar.js`

```js
import { h, icon } from '../core/dom.js';
import { store } from '../core/store.js';

const NAV = [
  { section: 'Overview' },
  { path: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: 'monitoring', label: 'Monitoring', icon: 'monitor' },
  { section: 'Catalog' },
  { path: 'products', label: 'Products', icon: 'products' },
  { path: 'stock', label: 'Stock', icon: 'stock' },
  { section: 'Operations' },
  { path: 'orders', label: 'Orders', icon: 'orders' },
  { path: 'reports', label: 'Reports', icon: 'reports' },
];

export function renderSidebar(currentPath, { onNavigate, onLogout }) {
  const aside = h('aside', { class: 'sidebar' });
  aside.appendChild(h('div', { class: 'sidebar__brand' },
    h('div', { class: 'sidebar__logo' }, 'SS'),
    h('div', { class: 'sidebar__title' }, 'Sales System'),
  ));
  const nav = h('nav', { class: 'sidebar__nav' });
  for (const item of NAV) {
    if (item.section) { nav.appendChild(h('div', { class: 'sidebar__section' }, item.section)); continue; }
    const active = currentPath === item.path || currentPath.startsWith(item.path + '/');
    nav.appendChild(h('a', {
      class: 'sidebar__link',
      href: `#/${item.path}`,
      'aria-current': active ? 'page' : null,
      onClick: (e) => { e.preventDefault(); onNavigate(item.path); },
    }, icon(item.icon), h('span', { class: 'label' }, item.label)));
  }
  aside.appendChild(nav);

  const user = store.get().user;
  const footer = h('div', { class: 'sidebar__footer' },
    h('div', { class: 'user-chip' },
      h('div', { class: 'user-chip__avatar' }, (user?.username || '?').slice(0, 1).toUpperCase()),
      h('div', { class: 'user-chip__meta' },
        h('div', { class: 'user-chip__name' }, user?.username || 'Unknown'),
        h('div', { class: 'user-chip__role' }, user?.role || ''),
      ),
      h('button', { class: 'btn btn--ghost btn--icon', title: 'Sign out', onClick: onLogout }, icon('logout', 16)),
    ),
  );
  aside.appendChild(footer);
  return aside;
}
```

---

## `js/views/login.js`

```js
import { h, icon } from '../core/dom.js';
import { buildForm } from '../ui/form.js';
import { toastError, toastSuccess } from '../ui/toast.js';

export function renderLogin({ onLogin }) {
  let mode = 'login'; // 'login' | 'register'
  const wrap = h('div', { class: 'login-wrap' });
  const card = h('div', { class: 'card login-card' });
  wrap.appendChild(card);

  const render = () => {
    const isLogin = mode === 'login';
    const schema = isLogin
      ? [
          { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'you@example.com' },
          { name: 'password', label: 'Password', type: 'password', required: true, placeholder: '••••••••' },
        ]
      : [
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'username', label: 'Username', type: 'text', required: true },
          { name: 'password', label: 'Password', type: 'password', required: true, help: 'Min 8 characters.' },
          {
            name: 'role', label: 'Role', type: 'select', value: 'client',
            options: ['client','sales','service','analyst','manager','admin'].map((v) => ({ value: v, label: v })),
          },
        ];

    const form = buildForm(schema, async (values) => {
      try {
        if (isLogin) {
          await onLogin(values.email, values.password);
          toastSuccess('Welcome back');
        } else {
          await onLogin.register(values);
          toastSuccess('Account created — signing you in');
          await onLogin(values.email, values.password);
        }
      } catch (e) {
        toastError(e.message || 'Request failed');
        throw e;
      }
    }, { submitLabel: isLogin ? 'Sign in' : 'Create account' });

    // Replace cancel button with a mode toggle.
    const btnRow = form.el.lastChild;
    btnRow.replaceChildren(
      h('button', {
        type: 'button',
        class: 'btn btn--ghost btn--block',
        onClick: () => { mode = isLogin ? 'register' : 'login'; render(); },
      }, isLogin ? 'Create an account' : 'Back to sign in'),
      form.el.querySelector('button[type=submit]'),
    );

    card.replaceChildren(
      h('div', { class: 'card__body' },
        h('div', { class: 'login-brand' },
          h('div', { class: 'login-brand__logo' }, 'SS'),
          h('h1', null, isLogin ? 'Sign in' : 'Create account'),
          h('p', { class: 'muted text-sm' }, 'Sales System — enterprise console'),
        ),
        form.el,
      ),
    );
  };
  render();
  return wrap;
}
```

---

## `js/views/dashboard.js`

```js
import { h } from '../core/dom.js';
import { store } from '../core/store.js';
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
      h('div', null, h('h1', null, 'Dashboard'), h('div', { class: 'sub' }, 'Realtime overview of your sales operations')),
      h('div', { class: 'spacer' }),
      refresh,
    ),
    stats, h('div', { class: 'grid cols-2' }, lowStockCard, recentOrdersCard), liveCard,
  );

  const load = async () => {
    refresh.disabled = true;
    try {
      const [dash, low, orders] = await Promise.all([
        client.adminDashboard().catch(() => ({})),
        client.lowStock(5).catch(() => []),
        client.listOrders({ limit: 8, sort: '-created_at' }).catch(() => ({ items: [] })),
      ]);
      renderStats(stats, dash);
      renderLowStock(lowStockCard, low, () => router.go('stock'));
      renderRecentOrders(recentOrdersCard, orders.items || orders || []);
    } catch (e) {
      toastError(e.message);
    } finally {
      refresh.disabled = false;
    }
  };
  refresh.addEventListener('click', load);
  load();

  // Realtime: refresh dashboard on any relevant event.
  const topics = ['orders', 'stock', 'products'];
  client.subscribe(topics).catch(() => {});
  const off = client.on('*', () => { /* reserved */ });
  void off;
  const offOrders = client.on('orders', () => load());
  const offStock = client.on('stock', () => load());

  renderLive(liveCard);

  return { el: root, dispose: () => { offOrders(); offStock(); } };
}

function renderStats(container, d) {
  const items = [
    { label: 'Revenue', value: money(d.revenue ?? d.total_revenue ?? 0, d.currency || 'USD'), delta: d.revenue_delta },
    { label: 'Orders', value: num(d.orders ?? d.total_orders ?? 0), delta: d.orders_delta },
    { label: 'Products', value: num(d.products ?? d.total_products ?? 0) },
    { label: 'Low stock', value: num(d.low_stock ?? 0) },
  ];
  container.replaceChildren(...items.map((s) =>
    h('div', { class: 'card' }, h('div', { class: 'card__body' },
      h('div', { class: 'stat' },
        h('div', { class: 'stat__label' }, s.label),
        h('div', { class: 'stat__value' }, s.value),
        s.delta != null && h('div', { class: `stat__delta ${s.delta >= 0 ? 'up' : 'down'}` },
          `${s.delta >= 0 ? '▲' : '▼'} ${Math.abs(s.delta)}%`),
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
        rows, empty: 'All stock levels are healthy',
      }),
    ),
  );
}

function renderRecentOrders(card, rows) {
  card.replaceChildren(
    h('div', { class: 'card__head' }, h('div', { class: 'card__title' }, 'Recent orders')),
    h('div', { class: 'card__body card__body--flush' },
      renderTable({
        columns: [
          { key: 'id', label: 'ID', render: (r) => h('span', { class: 'mono text-xs' }, (r.id || '').slice(0, 8)) },
          { key: 'customer_id', label: 'Customer', render: (r) => r.customer_id || '—' },
          { key: 'status', label: 'Status', render: (r) => statusBadge(r.status) },
          { key: 'total', label: 'Total', align: 'right', render: (r) => money(r.total, r.currency) },
          { key: 'created_at', label: 'Created', render: (r) => dateTime(r.created_at) },
        ],
        rows, empty: 'No recent orders',
      }),
    ),
  );
}

function renderLive(card) {
  const log = h('div', { class: 'mono text-sm', style: { maxHeight: '220px', overflow: 'auto' } });
  card.replaceChildren(
    h('div', { class: 'card__head' },
      h('div', { class: 'card__title' }, 'Live activity'),
      h('div', { class: 'spacer' }),
      h('span', { class: 'pill' }, 'realtime'),
    ),
    h('div', { class: 'card__body' }, log),
  );
  const push = (topic, payload) => {
    const line = h('div', null, `[${new Date().toLocaleTimeString()}] ${topic}: ${JSON.stringify(payload).slice(0, 120)}`);
    log.prepend(line);
    while (log.childElementCount > 100) log.lastChild.remove();
  };
  // Wire globally through bus.
  import('../core/bus.js').then(({ bus }) => bus.on('ws-event', ({ topic, payload }) => push(topic, payload)));
}
```

---

## `js/views/products.js`

```js
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

  const load = async () => {
    tableWrap.replaceChildren(renderTable({ columns: COLS, rows: [], loading: true }));
    try {
      const params = {};
      if (search.value.trim()) params.search = search.value.trim();
      if (statusSel.value) params.status = statusSel.value;
      const data = await client.listProducts(params);
      const rows = Array.isArray(data) ? data : data.items || [];
      tableWrap.replaceChildren(renderTable({
        columns: COLS(actions), rows, empty: 'No products found',
      }));
    } catch (e) { toastError(e.message); }
  };

  const actions = (row) => [
    { label: 'Edit', icon: 'edit', onClick: () => openEditor(row) },
    { label: 'Stock', icon: 'stock', onClick: () => openStock(row) },
    { label: 'Delete', icon: 'trash', variant: 'danger', onClick: () => removeProduct(row) },
  ];

  const COLS = (a) => [
    { key: 'sku', label: 'SKU', render: (r) => h('span', { class: 'mono' }, r.sku) },
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status', render: (r) => statusBadge(r.status) },
    { key: 'price_amount', label: 'Price', align: 'right', render: (r) => money(r.price_amount, r.currency) },
    { key: 'reorder_level', label: 'Reorder', align: 'right' },
    { key: '_actions', label: '', render: (r) => h('div', { class: 'row gap-1' },
      a(r).map((x) => h('button', {
        class: `btn btn--sm ${x.variant ? `btn--${x.variant}` : ''}`,
        title: x.label,
        onClick: (e) => { e.stopPropagation(); x.onClick(); },
      }, x.label))),
    },
  ];

  const openEditor = (row = null) => {
    const schema = [
      { name: 'sku', label: 'SKU', required: true, value: row?.sku },
      { name: 'name', label: 'Name', required: true, value: row?.name },
      { name: 'description', label: 'Description', type: 'textarea', value: row?.description },
      { name: 'price_amount', label: 'Price (minor units)', type: 'number', required: true, min: 0, value: row?.price_amount ?? 0 },
      { name: 'currency', label: 'Currency', value: row?.currency || 'USD', required: true },
      { name: 'reorder_level', label: 'Reorder level', type: 'number', min: 0, value: row?.reorder_level ?? 0 },
      { name: 'status', label: 'Status', type: 'select', value: row?.status || 'draft',
        options: ['draft','active','suspended','discontinued'].map((v) => ({ value: v, label: v })) },
    ];
    openModal({
      title: row ? `Edit product` : 'New product',
      body: (close) => {
        const f = buildForm(schema, async (values) => {
          try {
            if (row) await client.updateProduct(row.id, values);
            else await client.createProduct(values);
            toastSuccess(row ? 'Product updated' : 'Product created');
            close(); load();
          } catch (e) { toastError(e.message); throw e; }
        }, { onCancel: close });
        return f.el;
      },
    });
  };

  const openStock = (row) => import('./stock.js').then(({ openStockAdjust }) => openStockAdjust({ client, product: row, onDone: load }));

  const removeProduct = async (row) => {
    const ok = await confirmDialog({ title: 'Delete product', message: `Delete ${row.name}? This can be restored from backups only.`, danger: true, confirmText: 'Delete' });
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

function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
```

---

## `js/views/stock.js`

```js
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
```

---

## `js/views/orders.js`

```js
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
```

---

## `js/views/reports.js`

```js
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
```

---

## `js/views/monitoring.js`

```js
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

  root.append(
    h('div', { class: 'page__head' }, h('div', null, h('h1', null, 'Monitoring'), h('div', { class: 'sub' }, 'Realtime connection and event stream'))),
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
      h('div', { class: 'card__head' }, h('div', { class: 'card__title' }, 'Event stream')),
      h('div', { class: 'card__body card__body--flush' },
        renderTable({
          columns: [
            { key: 'time', label: 'Time', render: (r) => dateTime(r.time) },
            { key: 'topic', label: 'Topic' },
            { key: 'payload', label: 'Payload', render: (r) => h('span', { class: 'mono text-xs truncate', style: { maxWidth: '560px', display: 'inline-block' } }, JSON.stringify(r.payload)) },
          ],
          rows: events.slice(0, 200),
          empty: 'No events yet. Subscribe to topics to see updates.',
        })),
    );
  };
  refreshTable();

  const offBus = bus.on('ws-event', (ev) => { events.unshift({ time: Date.now(), ...ev }); if (events.length > 500) events.pop(); refreshTable(); });
  const offConn = store.subscribe(() => rerenderMeta());

  const ping = h('button', { class: 'btn btn--sm' }, 'Ping');
  ping.addEventListener('click', () => {
    client.ws?.send(JSON.stringify({ type: 'ping', id: crypto.randomUUID?.() || String(Date.now()), timestamp: new Date().toISOString() }));
  });
  root.querySelector('.page__head').appendChild(ping);

  return { el: root, dispose: () => { offBus(); offConn(); } };
}

function card(label, value) {
  return h('div', { class: 'card' }, h('div', { class: 'card__body' },
    h('div', { class: 'stat' }, h('div', { class: 'stat__label' }, label), h('div', { class: 'stat__value', style: { fontSize: 'var(--fs-xl)' } }, value))));
}
```

---

## `js/app.js` — Application Bootstrap

```js
import { SalesSystemClient } from './core/client.js';
import { store } from './core/store.js';
import { bus } from './core/bus.js';
import { createRouter } from './core/router.js';
import { h, mount, icon } from './core/dom.js';
import { renderSidebar } from './ui/sidebar.js';
import { toast, toastError } from './ui/toast.js';
import { renderLogin } from './views/login.js';
import { DashboardView } from './views/dashboard.js';
import { ProductsView } from './views/products.js';
import { StockView } from './views/stock.js';
import { OrdersView } from './views/orders.js';
import { ReportsView } from './views/reports.js';
import { MonitoringView } from './views/monitoring.js';

const app = document.getElementById('app');

// ---------- Persist token ----------
const STORAGE_KEY = 'sales-system.session';
function loadSession() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; } }
function saveSession(patch) {
  const cur = loadSession();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cur, ...patch }));
}

const session = loadSession();
const client = new SalesSystemClient({
  baseUrl: session.baseUrl || location.origin.replace(/:\d+$/, ':8080') || 'http://localhost:8080',
  token: session.token,
  refreshToken: session.refreshToken,
  logger: (...a) => console.debug('[client]', ...a),
  onSession: (ev) => {
    if (ev.type === 'logout' || ev.type === 'expired') { saveSession({ token: null, refreshToken: null }); showLogin(); }
  },
});

// Persist refreshed tokens.
const originalApply = client._applyTokens.bind(client);
client._applyTokens = (d) => { originalApply(d); saveSession({ token: d.access_token, refreshToken: d.refresh_token }); };

// ---------- Connection state ----------
function setConnection(state) { store.set({ connection: state }); }
setConnection(session.token ? 'connecting' : 'off');

// ---------- Realtime wiring ----------
client.onProtocol('open', () => setConnection('on'));
client.onProtocol('close', () => setConnection('off'));
client.onProtocol('error', (p) => toastError(p.message || 'Realtime error'));

// Bridge realtime events to the event bus for the monitoring view.
const KNOWN_TOPICS = ['orders', 'stock', 'products', 'users', 'notifications'];
KNOWN_TOPICS.forEach((t) => client.on(t, (payload, env) => bus.emit('ws-event', { topic: t, payload, env })));

// Attempt to (re)open the socket if a token is present.
async function bootstrapRealtime() {
  if (!client.token) { setConnection('off'); return; }
  try { await client.connect(); } catch { setConnection('off'); }
}
bootstrapRealtime();

// ---------- Routes ----------
const routes = [
  { path: '', view: DashboardView },
  { path: 'dashboard', view: DashboardView },
  { path: 'monitoring', view: MonitoringView },
  { path: 'products', view: ProductsView },
  { path: 'stock', view: StockView },
  { path: 'orders', view: OrdersView },
  { path: 'reports', view: ReportsView },
];
const router = createRouter({ routes, notFound: DashboardView });

let activeView = null;

function shell() {
  const root = h('div', { class: 'app-shell' });
  const sidebarHost = h('div');
  const topbar = h('header', { class: 'topbar' });
  const main = h('main', { class: 'main' });
  root.append(sidebarHost, topbar, main);
  return { root, sidebarHost, topbar, main };
}

function renderShell() {
  const s = store.get();
  if (!s.user) return showLogin();

  const { root, sidebarHost, topbar, main } = shell();
  const current = router.resolve();

  // Sidebar
  mount(sidebarHost, renderSidebar(current.path, {
    onNavigate: (p) => router.go(p),
    onLogout: async () => {
      try { await client.logout(); } catch {}
      saveSession({ token: null, refreshToken: null });
      store.set({ user: null });
      showLogin();
    },
  }));

  // Topbar
  const conn = store.get().connection;
  const connEl = h('span', { class: `conn conn--${conn === 'on' ? 'on' : conn === 'connecting' ? 'connecting' : 'off'}` },
    h('span', { class: 'conn__dot' }), conn === 'on' ? 'Live' : conn === 'connecting' ? 'Connecting…' : 'Offline');
  const userChip = h('div', { class: 'user-chip' },
    h('div', { class: 'user-chip__avatar' }, (s.user.username || '?')[0].toUpperCase()),
    h('div', { class: 'user-chip__meta' },
      h('div', { class: 'user-chip__name' }, s.user.username),
      h('div', { class: 'user-chip__role' }, s.user.role),
    ),
  );
  topbar.replaceChildren(
    h('button', {
      class: 'btn btn--ghost btn--icon',
      title: 'Toggle sidebar',
      onClick: () => {
        const el = document.querySelector('.app-shell');
        el.dataset.collapsed = el.dataset.collapsed === 'true' ? 'false' : 'true';
      },
    }, icon('menu')),
    h('div', { class: 'topbar__title' }, titleFor(current.path)),
    h('div', { class: 'topbar__spacer' }),
    connEl,
    userChip,
  );

  // Main view
  activeView?.dispose?.();
  const View = current.route.view;
  const instance = View({ client, router, params: current.params, query: current.query });
  activeView = instance;
  mount(main, instance.el);

  mount(app, root);
}

function titleFor(path) {
  const map = { dashboard: 'Dashboard', monitoring: 'Monitoring', products: 'Products', stock: 'Stock', orders: 'Orders', reports: 'Reports' };
  return map[path] || 'Dashboard';
}

// Re-render shell on state change.
store.subscribe(() => {
  if (!store.get().user) return;
  const s = document.querySelector('.topbar');
  if (!s) return;
  const conn = store.get().connection;
  const connEl = s.querySelector('.conn');
  if (connEl) {
    connEl.className = `conn conn--${conn === 'on' ? 'on' : conn === 'connecting' ? 'connecting' : 'off'}`;
    connEl.lastChild.textContent = conn === 'on' ? 'Live' : conn === 'connecting' ? 'Connecting…' : 'Offline';
  }
});

bus.on('route', renderShell);

// ---------- Auth flow ----------
function showLogin() {
  activeView?.dispose?.();
  activeView = null;
  const view = renderLogin({
    onLogin: async (email, password) => {
      if (typeof email === 'object') { await client.register(email); return; }
      const data = await client.login(email, password);
      saveSession({ token: data.access_token, refreshToken: data.refresh_token, email });
      store.set({ user: data.user || { username: email.split('@')[0], email, role: data.role || 'client' } });
      setConnection('connecting');
      await bootstrapRealtime();
      router.go('dashboard');
      renderShell();
    },
  });
  // Attach register method for the login view.
  view._register = client.register.bind(client);
  mount(app, view);
  // Hack: expose client.register via onLogin object branch.
  view.onLogin = view.onLogin; // noop
  // Replace login callback to accept object.
  // Simpler: patch the onLogin passed in above to accept object.
  // (already handled by typeof check)
}

// The login view calls onLogin.register(...) — attach it.
// Adjust: re-render login with an onLogin that has .register.
function showLoginWithRegister() {
  const view = renderLogin({
    onLogin: Object.assign(
      async (email, password) => {
        const data = await client.login(email, password);
        saveSession({ token: data.access_token, refreshToken: data.refresh_token });
        store.set({ user: data.user || { username: email.split('@')[0], email, role: data.role || 'client' } });
        setConnection('connecting');
        await bootstrapRealtime();
        router.go('dashboard');
        renderShell();
      },
      { register: (payload) => client.register(payload) },
    ),
  });
  mount(app, view);
}

// Use the register-aware version.
showLogin = showLoginWithRegister;
void showLogin;

// ---------- Kick off ----------
if (session.token) {
  // We may not know the user yet; ask the dashboard for it lazily.
  bootstrapRealtime().then(() => {
    store.set({ user: session.user || { username: session.email?.split('@')[0] || 'user', email: session.email, role: session.role || 'client' } });
    renderShell();
  });
} else {
  showLoginWithRegister();
}

// Handle hash change.
window.addEventListener('hashchange', renderShell);

// Global error safety net.
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection', e.reason);
  const msg = e.reason?.message || 'Unexpected error';
  if (/401|SESSION_EXPIRED|no token/i.test(msg)) { showLoginWithRegister(); }
  else toastError(msg);
});
```

> Note: the login flow above uses a small trick to attach a `.register` method to `onLogin`. A cleaner alternative is to pass `client` directly to `renderLogin` and call `client.register` there. I kept it compatible with the view signature but you can refactor freely.

---

## Key Resilience Features

| Concern | Handling |
|---|---|
| Token expiry | Automatic silent refresh on `401` with retry of the original request, and single-flight refresh (dedup) |
| WS drop | Exponential backoff with jitter, capped at `maxReconnectDelayMs` |
| Session loss | `onSession` event clears state, closes socket, returns to login |
| Offline | `NETWORK` error code surfaces cleanly to the UI via toasts |
| Race conditions | `_pendingResolves` queue ensures `subscribe()` waits for `open` |
| Duplicate topics | `Set` semantics — safe to subscribe twice |
| Reconnect re-subscribe | Topics are replayed on every `open` |
| Tab focus | Hash router — state survives reloads and deep links work |
| Memory | Per-view `dispose()` removes realtime listeners when the route changes |

---

## Suggested Backend Compatibility Notes

1. **Price units** — the schema stores `price_amount BIGINT`, so the frontend treats values as minor units (cents) and formats with `Intl.NumberFormat`. Adjust `money()` if you store major units.
2. **Pagination** — `listProducts` / `listOrders` accept `limit`, `offset`, `sort`, `search` params. The views pass only what's set. Add a pager component if you need one.
3. **WebSocket topics** — the client subscribes to `orders`, `stock`, `products`, `users`, `notifications`. Backend should emit `{ type: 'event', topic, payload }` envelopes. `snapshot` envelopes are routed the same way.
4. **Status enums** — match the schema `CHECK` constraints exactly (`draft`, `active`, `suspended`, `discontinued` etc.).
5. **RBAC** — the sidebar entries are not filtered by role today; add a `roles: ['admin','manager']` guard and check `store.get().user.role` in `renderSidebar`.
6. **CSRF** — if you move to cookie-based tokens, add an `X-CSRF-Token` header in `_headers`.

---

## Running It

```bash
# serve the folder over HTTP (needed for ES modules)
npx serve .
# or
python3 -m http.server 5173
```

Then open `http://localhost:5173` — the app defaults to `http://localhost:8080` for the API. Change `session.baseUrl` or the constructor default to point elsewhere.

This gives you a complete, elegant, dark-themed enterprise console with sidebar navigation, modal-driven CRUD, centralized CSS tokens, resilient networking, and a realtime monitoring panel — all in clean vanilla JS with no build step.