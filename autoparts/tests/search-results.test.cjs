const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
const path = require('node:path');
const source = path.resolve(__dirname, '../lib/searchResults.ts');
const compiled = ts.transpileModule(fs.readFileSync(source, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const loaded = new Module(source, module); loaded._compile(compiled.outputText, source);
const { availableQuantity, sortParts, sortAnalogs, partIdentity } = loaded.exports;
const part = (brand, quantity, price) => ({ brand, quantity, price, oem: '71932', catalog: 'UMAPI' });
test('in-stock first, then brand alphabetically within both groups, independent of quantity', () => {
  const input = [part('B-NONE', 0), part('A-STOCK', 1), part('A-UNKNOWN'), part('Z-STOCK', 550)];
  assert.deepEqual(sortParts(input, 'stock').map(p => p.brand), ['A-STOCK', 'Z-STOCK', 'A-UNKNOWN', 'B-NONE']);
  assert.equal(input[0].brand, 'B-NONE');
});
test('article breaks brand ties; warehouse stock qualifies as in stock', () => {
  const input = [{...part('WABCO'), oem:'100', warehouses:[{qty:3}]}, {...part('AUGER', 0), oem:'5'}, {...part('WABCO', 1), oem:'20'}];
  assert.deepEqual(sortParts(input, 'stock').map(p => p.oem), ['20', '100', '5']);
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
test('analogs: in-stock shared-OE part goes above out-of-stock direct crosses; rest alphabetical across sources', () => {
  const cross = (brand, quantity) => ({ ...part(brand, quantity), analogSource: 'UMAPI' });
  const shared = (brand, quantity) => ({ ...part(brand, quantity), analogSource: 'UMAPI_SHARED_OE' });
  const input = [cross('4u'), cross('BILSTEIN', 0), shared('WABCO', 550), shared('AIR FREN'), cross('ZF', 3), shared('APC', 0)];
  assert.deepEqual(sortAnalogs(input, 'stock').map(p => p.brand), ['WABCO', 'ZF', '4u', 'AIR FREN', 'APC', 'BILSTEIN']);
});
test('analogs price sort still keeps in-stock group first', () => {
  const input = [part('CHEAP', 0, 5), part('DEAR', 2, 900), part('MID', 1, 50)];
  assert.deepEqual(sortAnalogs(input, 'price').map(p => p.brand), ['MID', 'DEAR', 'CHEAP']);
});
test('analogs: AUGER always first, even out of stock; rest keeps stock/alphabetical order', () => {
  const input = [part('ZF', 3), part('AUGER', 0), part('AIC', 0), part('BOSCH', 1), part('auger', 2)];
  assert.deepEqual(sortAnalogs(input, 'stock').map(p => p.brand), ['auger', 'AUGER', 'BOSCH', 'ZF', 'AIC']);
});
