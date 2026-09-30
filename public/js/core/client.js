/**
 * SalesSystemClient — enterprise-grade client for the Sales System backend.
 * Fixes:
 *  - auth-rejected close codes don't cause a reconnect storm
 *  - uuid fallback
 *  - single-flight refresh
 *  - safe subscribe/unsubscribe payloads
 *  - onSession event emitter
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
    this.onSession = opts.onSession || null;

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

  // -------------------------------------------------------------------
  // REST plumbing
  // -------------------------------------------------------------------
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
      console.log("error in fetch: " + e.message);
      const err = new Error('Network error');
      err.code = 'NETWORK';
      err.cause = e;
      throw err;
    }

    if (res.status === 401 && auth && this.refreshToken && !retried) {
      const ok = await this._tryRefresh();
      if (ok) return this._request(method, path, body, auth, true);
    }

    if (res.status === 204) return null;

    const text = await res.text();
    let data = {};
    if (text) { try { data = JSON.parse(text); } catch { data = { raw: text }; } }

    if (!res.ok) {
      const err = new Error(data.message || data.error || `HTTP ${res.status}`);
      err.code = data.code;
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // -------------------------------------------------------------------
  // Auth
  // -------------------------------------------------------------------
  register(payload) {
    return this._request('POST', '/api/v1/auth/register', payload, false);
  }

  async login(email, password, { connect = true } = {}) {
    const data = await this._request(
      'POST', '/api/v1/auth/login', { email, password }, false,
    );
    this._applyTokens(data);
    if (connect) await this.connect();
    return data;
  }

  async _tryRefresh() {
    if (this._refreshInflight) return this._refreshInflight;
    this._refreshInflight = (async () => {
      try {
        const data = await this._request(
          'POST', '/api/v1/auth/refresh',
          { refresh_token: this.refreshToken }, false,
        );
        this._applyTokens(data);
        this.logger('token refreshed');
        return true;
      } catch (e) {
        this.logger('refresh failed', e.message);
        this._emitProtocol('error', { code: 'SESSION_EXPIRED', message: e.message });
        this._emitSession({ type: 'expired' });
        return false;
      } finally {
        this._refreshInflight = null;
      }
    })();
    return this._refreshInflight;
  }

  async logout() {
    try {
      await this._request('POST', '/api/v1/auth/logout', { refresh_token: this.refreshToken });
    } finally {
      this.token = null;
      this.refreshToken = null;
      this.disconnect();
      this._emitSession({ type: 'logout' });
    }
  }

  changePassword(oldPassword, newPassword) {
    return this._request('POST', '/api/v1/auth/change-password',
      { old_password: oldPassword, new_password: newPassword });
  }

  _applyTokens(d) {
    this.token = d.access_token ?? null;
    this.refreshToken = d.refresh_token ?? null;
  }

  _emitSession(ev) {
    try { this.onSession?.(ev); } catch (e) { this.logger('onSession error', e); }
  }

  // -------------------------------------------------------------------
  // Products
  // -------------------------------------------------------------------
  listProducts(params = {}) { return this._request('GET', `/api/v1/products?${qs(params)}`); }
  getProduct(id) { return this._request('GET', `/api/v1/products/${id}`); }
  getProductBySKU(sku) { return this._request('GET', `/api/v1/products/sku/${encodeURIComponent(sku)}`); }
  createProduct(p) { return this._request('POST', '/api/v1/products', p); }
  updateProduct(id, p) { return this._request('PUT', `/api/v1/products/${id}`, p); }
  changeProductStatus(id, status) { return this._request('PATCH', `/api/v1/products/${id}/status`, { status }); }
  deleteProduct(id) { return this._request('DELETE', `/api/v1/products/${id}`); }

  // -------------------------------------------------------------------
  // Stock
  // -------------------------------------------------------------------
  getStock(productId) { return this._request('GET', `/api/v1/stock/${productId}`); }
  getStockBySKU(sku) { return this._request('GET', `/api/v1/stock/sku/${encodeURIComponent(sku)}`); }
  getStockHistory(productId, params = {}) { return this._request('GET', `/api/v1/stock/${productId}/history?${qs(params)}`); }
  stockMovement(m) { return this._request('POST', '/api/v1/stock/movements', m); }

  // -------------------------------------------------------------------
  // Orders
  // -------------------------------------------------------------------
  listOrders(params = {}) { return this._request('GET', `/api/v1/orders?${qs(params)}`); }
  getOrder(id) { return this._request('GET', `/api/v1/orders/${id}`); }
  placeOrder(o) { return this._request('POST', '/api/v1/orders', o); }
  fulfilOrder(id) { return this._request('POST', `/api/v1/orders/${id}/fulfil`); }
  cancelOrder(id) { return this._request('POST', `/api/v1/orders/${id}/cancel`); }
  refundOrder(id) { return this._request('POST', `/api/v1/orders/${id}/refund`); }

  // -------------------------------------------------------------------
  // Reports
  // -------------------------------------------------------------------
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

  // -------------------------------------------------------------------
  // WebSocket
  // -------------------------------------------------------------------
  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return this._connectedPromise();
    }
    if (!this.token) return Promise.reject(new Error('no token: call login() first'));

    this.manualClose = false;
    const wsUrl = this.baseUrl.replace(/^http/, 'ws') + this.wsPath
      + `?token=${encodeURIComponent(this.token)}`;
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
      let env;
      try { env = JSON.parse(ev.data); } catch { return; }
      switch (env.type) {
        case 'event':
          if (env.topic) this._emit(env.topic, env.payload, env);
          break;
        case 'snapshot':
          this._emitProtocol('snapshot', env);
          if (env.topic) this._emit(env.topic, env.payload, env);
          break;
        case 'ack':
          this._emitProtocol('ack', env);
          break;
        case 'pong':
          this._emitProtocol('pong', env);
          break;
        case 'error':
          this._emitProtocol('error', env.payload || env);
          break;
      }
    };

    this.ws.onclose = (ev) => {
      this.connected = false;
      this._stopPing();
      this.logger('ws closed', ev?.code, ev?.reason);
      this._emitProtocol('close', { code: ev?.code, reason: ev?.reason });

      const authRejected = ev?.code === 1008 || ev?.code === 4001 || ev?.code === 4401;
      if (authRejected && this.refreshToken) {
        this._tryRefresh().then((ok) => {
          if (ok && this.autoReconnect && !this.manualClose) this._scheduleReconnect();
          else this._emitSession({ type: 'expired' });
        });
        return;
      }
      if (this.autoReconnect && !this.manualClose) this._scheduleReconnect();
    };

    this.ws.onerror = () => this.logger('ws error');

    return this._connectedPromise();
  }

  disconnect() {
    this.manualClose = true;
    this._stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
    this.connected = false;
  }

  async subscribe(topics) {
    const list = (Array.isArray(topics) ? topics : [topics]).filter(Boolean);
    list.forEach((t) => this.topics.add(t));
    if (!this.connected) await this.connect();
    else this._sendSubscribe(list);
  }

  unsubscribe(topics) {
    const list = (Array.isArray(topics) ? topics : [topics]).filter(Boolean);
    list.forEach((t) => this.topics.delete(t));
    if (this.connected && list.length) {
      this._send({ type: 'unsubscribe', payload: list });
    }
  }

  on(topic, fn) { return this._addHandler(this.handlers, topic, fn); }
  onProtocol(type, fn) { return this._addHandler(this.protocolHandlers, type, fn); }
  off(topic, fn) {
    this.handlers.get(topic)?.delete(fn);
    this.protocolHandlers.get(topic)?.delete(fn);
  }

  // -------------------------------------------------------------------
  // internals
  // -------------------------------------------------------------------
  _sendSubscribe(topics) {
    if (topics && topics.length) this._send({ type: 'subscribe', payload: topics });
  }

  _send(obj) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        id: uuid(),
        timestamp: new Date().toISOString(),
        ...obj,
      }));
    }
  }

  _startPing() {
    this._stopPing();
    this.pingTimer = setInterval(() => this._send({ type: 'ping' }), 30000);
  }

  _stopPing() {
    if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
  }

  _scheduleReconnect() {
    this.reconnectAttempts += 1;
    const base = Math.min(1000 * 2 ** this.reconnectAttempts, this.maxReconnectDelayMs);
    const delay = Math.floor(base / 2 + Math.random() * (base / 2));
    this.logger(`reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.reconnectTimer = setTimeout(async () => {
      if (this.refreshToken) await this._tryRefresh();
      this.connect().catch(() => {});
    }, delay);
  }

  _addHandler(map, key, fn) {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(fn);
    return () => this.off(key, fn);
  }

  _emit(topic, payload, env) {
    this.handlers.get(topic)?.forEach((fn) => {
      try { fn(payload, env); } catch (e) { this.logger('handler error', e); }
    });
  }

  _emitProtocol(type, payload) {
    this.protocolHandlers.get(type)?.forEach((fn) => {
      try { fn(payload); } catch (e) { this.logger('protocol handler error', e); }
    });
  }

  _connectedPromise() {
    if (this.connected) return Promise.resolve();
    return new Promise((resolve) => this._pendingResolves.push(resolve));
  }

  _flushPending() {
    const pending = this._pendingResolves.splice(0);
    pending.forEach((resolve) => resolve());
  }
}

function qs(obj) {
  const u = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v != null && v !== '') u.set(k, v);
  });
  return u.toString();
}

function uuid() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}