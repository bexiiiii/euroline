const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
const path = require('node:path');

function setup() {
  const responses = [];
  const api = { search: async () => responses.shift()() };
  const source = path.resolve(__dirname, '../lib/stores/searchStore.ts');
  const compiled = ts.transpileModule(fs.readFileSync(source, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const loaded = new Module(source, module);
  loaded.paths = module.paths;
  loaded.require = name => name === '@/lib/api/search' ? { searchApi: api, SearchApiError: class extends Error {} }
    : name === 'sonner' ? { toast: { error() {}, success() {}, info() {} } } : require(name);
  loaded._compile(compiled.outputText, source);
  return { store: loaded.exports.useSearchStore, responses };
}
const response = (brand, pending, results = []) => ({ detectedType: 'OEM', selectedBrand: brand,
  selectedArticle: '12345', results, analogsLoading: pending });

test('background enrichment keeps results visible and preserves filters', async () => {
  const { store, responses } = setup();
  responses.push(() => response('MAKER', true, [{ brand: 'MAKER', oem: '12345' }]));
  await store.getState().search('12345', undefined, 'MAKER');
  store.getState().setPhotoOnly(true);
  responses.push(() => response('MAKER', false, [{ brand: 'MAKER', oem: '12345' }, { brand: 'OTHER', oem: '67890' }]));
  await store.getState().refreshAnalogs('12345', 'MAKER');
  assert.equal(store.getState().isLoading, false);
  assert.equal(store.getState().analogsLoading, false);
  assert.equal(store.getState().results.length, 2);
  assert.equal(store.getState().filters.photoOnly, true);
});

test('late background reply cannot overwrite a newer search', async () => {
  const { store, responses } = setup();
  responses.push(() => response('FIRST', true));
  await store.getState().search('12345', undefined, 'FIRST');
  let resolveOld;
  responses.push(() => new Promise(resolve => { resolveOld = resolve; }));
  const old = store.getState().refreshAnalogs('12345', 'FIRST');
  responses.push(() => response('SECOND', false, [{ brand: 'SECOND' }]));
  await store.getState().search('99999', undefined, 'SECOND');
  resolveOld(response('FIRST', false, [{ brand: 'WRONG' }]));
  await old;
  assert.equal(store.getState().selectedBrand, 'SECOND');
  assert.equal(store.getState().results[0].brand, 'SECOND');
});

test('background failure keeps current results and displays warning', async () => {
  const { store, responses } = setup();
  responses.push(() => response('MAKER', true, [{ brand: 'MAKER' }]));
  await store.getState().search('12345', undefined, 'MAKER');
  responses.push(() => { throw new Error('offline'); });
  await store.getState().refreshAnalogs('12345', 'MAKER');
  assert.equal(store.getState().results.length, 1);
  assert.equal(store.getState().analogsLoading, false);
  assert.equal(store.getState().warnings.length, 1);
});
