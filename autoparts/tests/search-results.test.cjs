const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
const path = require('node:path');
const source = path.resolve(__dirname, '../lib/searchResults.ts');
const compiled = ts.transpileModule(fs.readFileSync(source, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const loaded = new Module(source, module); loaded._compile(compiled.outputText, source);
const { availableQuantity, sortParts, partIdentity, segmentAnalogs } = loaded.exports;
const part = (brand, quantity, price) => ({ brand, quantity, price, oem: '71932', catalog: 'UMAPI' });
test('trucks are default; unknown/pending/legacy stay separate and passenger never leaks', () => {
  const items = ['TRUCK_TRAILER', 'NON_TARGET', 'UNKNOWN', 'PENDING', undefined].map(vehicleSegment => ({...part(String(vehicleSegment)), catalog:'UMAPI_ANALOG', vehicleSegment}));
  items.push({...part('PRIMARY'), vehicleSegment:'TRUCK_TRAILER'});
  assert.deepEqual(segmentAnalogs(items).map(p => p.brand), ['TRUCK_TRAILER']);
  assert.deepEqual(segmentAnalogs(items, true).map(p => p.brand), ['UNKNOWN', 'PENDING', 'undefined']);
  assert.equal(items.length, 6);
});
test('stock sort is numeric, descending, non-mutating and puts unknown last', () => {
  const input = [part('ZERO', 0), part('LOW', 9), part('UNKNOWN'), part('HIGH', 550)];
  assert.deepEqual(sortParts(input, 'stock').map(p => p.brand), ['HIGH', 'LOW', 'ZERO', 'UNKNOWN']);
  assert.equal(input[0].brand, 'ZERO');
});
test('missing stock is not zero; warehouse total requires all quantities', () => {
  assert.equal(availableQuantity(part('A')), null);
  assert.equal(availableQuantity({ ...part('A'), warehouses: [{ qty: 2 }, { qty: 3 }] }), 5);
  assert.equal(availableQuantity({ ...part('A'), warehouses: [{ qty: 2 }, { qty: null }] }), null);
});
test('unknown prices are last within availability group', () => {
  assert.deepEqual(sortParts([part('UNKNOWN', 2), part('EXPENSIVE', 2, 100), part('CHEAP', 2, 10)], 'price').map(p => p.brand), ['CHEAP', 'EXPENSIVE', 'UNKNOWN']);
});
test('identity normalizes article formatting but preserves manufacturer', () => {
  assert.equal(partIdentity({ ...part('WABCO'), oem: '441 032-92.12' }), '4410329212|WABCO');
  assert.notEqual(partIdentity(part('AUGER')), partIdentity(part('AIC')));
});
