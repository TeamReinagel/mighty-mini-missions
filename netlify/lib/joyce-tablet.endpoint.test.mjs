import assert from 'node:assert/strict';
import test from 'node:test';
import handler from '../functions/joyce-tablet.mjs';

const url = 'https://example.test/api/joyce-tablet';
const key = 'unit-test-tablet-key';
const originalKey = process.env.JOYCE_TABLET_KEY;
test.before(() => { process.env.JOYCE_TABLET_KEY = key; });
test.after(() => { if (originalKey === undefined) delete process.env.JOYCE_TABLET_KEY; else process.env.JOYCE_TABLET_KEY = originalKey; });
function request(method, body, authorized = true) {
  return new Request(url, { method, headers: authorized ? { Authorization: `Bearer ${key}` } : {}, ...(body === undefined ? {} : { body }) });
}
test('tablet endpoint rejects requests without a key', async () => {
  assert.equal((await handler(request('GET', undefined, false))).status, 401);
});
test('setup key check returns child names without model or storage access', async () => {
  const result = await handler(request('GET'));
  assert.equal(result.status, 200);
  const json = await result.json();
  assert.equal(json.ok, true);
  assert.ok(json.kids.some(kid => kid.id === 'max'));
  assert.equal(JSON.stringify(json).includes(key), false);
});
test('unsupported methods are rejected', async () => {
  assert.equal((await handler(request('DELETE'))).status, 405);
});
test('malformed JSON gets a recoverable client error', async () => {
  assert.equal((await handler(request('POST', '{broken'))).status, 400);
});
test('oversized requests are refused before storage or AI calls', async () => {
  assert.equal((await handler(request('POST', 'a'.repeat(8_000_001)))).status, 413);
});
