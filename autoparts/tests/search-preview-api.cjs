// Local synthetic UI fixtures. Never connect this server to production or 1C.
// Run: node tests/search-preview-api.cjs
// Then: NEXT_PUBLIC_API_URL=http://127.0.0.1:4179 npm run dev -- --port 3107 --hostname 127.0.0.1
const http = require('node:http');
const primary = (brand) => ({ oem: '71932', brand, name: 'Тест интерфейса: датчик ABS', catalog: 'UMAPI',
  ...(brand === 'AUGER' ? { productId: 9, quantity: 550, price: 100, currency: 'KZT', warehouses: [
    { refKey: 'fixture-main', code: 'main', name: 'Основной склад (тест)', qty: 550 },
    { refKey: 'fixture-empty', code: 'empty', name: 'Второй склад (тест)', qty: 0 },
  ] } : {}) });
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:3107');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') { res.end(); return; }
  const url = new URL(req.url, 'http://127.0.0.1:4179');
  if (url.pathname === '/api/search') {
    const selected = url.searchParams.get('brand');
    const result = { query: '71932', detectedType: 'OEM', warnings: ['Локальные тестовые данные — не цены и остатки магазина.'],
      selectionRequired: !selected, selectedArticle: selected ? '71932' : null, selectedBrand: selected,
      results: selected ? [primary(selected), ...Array.from({ length: 23 }, (_, i) => ({
        oem: `TEST-${i}`, brand: i % 2 ? 'TEST-B' : 'TEST-A', name: 'Тестовая возможная замена',
        catalog: 'UMAPI_ANALOG', analogSource: 'UMAPI', compatibilityStatus: 'UNVERIFIED', quantity: i,
      }))] : [primary('AIC'), primary('AUGER')] };
    res.end(JSON.stringify(result)); return;
  }
  if (url.pathname === '/api/cart/offers') { res.statusCode = 401; res.end(JSON.stringify({ message: 'Тест: требуется вход' })); return; }
  res.end('[]');
}).listen(4179, '127.0.0.1', () => console.log('Synthetic search API: http://127.0.0.1:4179'));
