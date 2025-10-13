import http from 'k6/http';
import { sleep, check } from 'k6';
import { Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const CHECKOUT_VUS = Number(__ENV.CHECKOUT_VUS || 20);
const ADMIN_VUS = Number(__ENV.ADMIN_VUS || 10);
const TEST_DURATION = __ENV.DURATION || '3m';

const ADMIN_TOKEN = __ENV.ADMIN_TOKEN || '';

const checkoutLatency = new Trend('checkout_latency', true);
const adminLatency = new Trend('admin_latency', true);
const checkoutErrors = new Counter('checkout_errors');
const adminErrors = new Counter('admin_errors');

export const options = {
  scenarios: {
    checkout_flow: {
      executor: 'constant-vus',
      exec: 'checkoutScenario',
      vus: CHECKOUT_VUS,
      duration: TEST_DURATION,
      startTime: '0s',
    },
    admin_flow: {
      executor: 'constant-vus',
      exec: 'adminScenario',
      vus: ADMIN_VUS,
      duration: TEST_DURATION,
      startTime: '0s',
      gracefulStop: '10s',
    },
  },
  thresholds: {
    checkout_latency: ['p(95)<1000', 'p(99)<1500'],
    admin_latency: ['p(95)<1000'],
    checkout_errors: ['count<50'],
    admin_errors: ['count<50'],
    http_req_failed: ['rate<0.05'],
  },
};

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

const productIdsCache = [];

function fetchProductIds() {
  if (productIdsCache.length > 0) {
    return;
  }
  const res = http.get(`${BASE_URL}/api/products?size=50&page=0`);
  if (res.status === 200) {
    try {
      const data = res.json();
      const ids = (data.content || []).map((p) => p.id).filter(Boolean);
      if (ids.length > 0) {
        productIdsCache.push(...ids);
      }
    } catch (e) {
      // ignore parsing errors, will fallback to default IDs
    }
  }
  if (productIdsCache.length === 0) {
    productIdsCache.push(...[101, 102, 103, 104, 105]);
  }
}

export function checkoutScenario() {
  fetchProductIds();

  const listRes = http.get(`${BASE_URL}/api/products?size=20&page=${Math.floor(Math.random() * 5)}`);
  checkoutLatency.add(listRes.timings.duration);
  if (!check(listRes, { 'product list 200': (r) => r.status === 200 })) {
    checkoutErrors.add(1);
    sleep(1);
    return;
  }

  const productId = randomChoice(productIdsCache);
  const detailRes = http.get(`${BASE_URL}/api/products/${productId}`);
  checkoutLatency.add(detailRes.timings.duration);
  if (!check(detailRes, { 'product detail 200': (r) => r.status === 200 })) {
    checkoutErrors.add(1);
    sleep(1);
    return;
  }

  const cartPayload = JSON.stringify({
    productId,
    quantity: 1,
  });
  const cartHeaders = { 'Content-Type': 'application/json' };
  const cartRes = http.post(`${BASE_URL}/api/cart/add`, cartPayload, { headers: cartHeaders });
  checkoutLatency.add(cartRes.timings.duration);
  check(cartRes, {
    'cart add success': (r) => r.status === 200 || r.status === 201 || r.status === 202,
  }) || checkoutErrors.add(1);

  const orderPayload = JSON.stringify({
    deliveryAddress: 'Load Test Address',
    paymentMethod: 'CARD',
  });
  const orderHeaders = { 'Content-Type': 'application/json' };
  const orderRes = http.post(`${BASE_URL}/api/orders/preview`, orderPayload, { headers: orderHeaders });
  checkoutLatency.add(orderRes.timings.duration);
  check(orderRes, {
    'order preview status': (r) => r.status >= 200 && r.status < 300,
  }) || checkoutErrors.add(1);

  sleep(Math.random() * 2);
}

export function adminScenario() {
  const headers = ADMIN_TOKEN
    ? { Authorization: `Bearer ${ADMIN_TOKEN}` }
    : {};

  const statusRes = http.get(`${BASE_URL}/api/admin/system/status`, { headers });
  adminLatency.add(statusRes.timings.duration);
  check(statusRes, {
    'system status ok': (r) => r.status === 200,
  }) || adminErrors.add(1);

  const metricsRes = http.get(`${BASE_URL}/api/admin/system/metrics`, { headers });
  adminLatency.add(metricsRes.timings.duration);
  check(metricsRes, {
    'metrics ok': (r) => r.status === 200,
  }) || adminErrors.add(1);

  const maintenanceRes = http.post(`${BASE_URL}/api/admin/system/maintenance?enabled=false`, null, { headers });
  adminLatency.add(maintenanceRes.timings.duration);
  check(maintenanceRes, {
    'maintenance toggle ok': (r) => r.status === 200 || r.status === 202,
  }) || adminErrors.add(1);

  sleep(Math.random() * 1.5);
}
