import test from 'node:test';
import assert from 'node:assert/strict';
import { handleTabletRequest } from './joyce-tablet.mjs';

const env = { OPENAI_API_KEY: 'test-only' };
const image = Buffer.from('test image').toString('base64');
const body = { kid: 'max', imageBase64: image };
function store() {
  const data = new Map();
  return { data, async get(key) { return data.get(key); }, async setJSON(key, value) { data.set(key, value); } };
}
function model(reply, requests = []) {
  return async (url, opts) => {
    if (url.includes('/chat/completions')) {
      requests.push(JSON.parse(opts.body));
      return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(reply) } }] }) };
    }
    if (url.includes('/audio/transcriptions')) return { ok: true, json: async () => ({ text: '' }) };
    return { ok: false };
  };
}
async function first(reply, storage = store(), extra = {}) {
  const result = await handleTabletRequest({ store: storage, env, fetchImpl: model(reply), body: { ...body, ...extra } });
  return { result, storage };
}
for (const answer of ['8', 'eight', 0]) {
  test(`math does not reveal ${answer} in the first hint`, async () => {
    const { result } = await first({ saw: 'the problem 14 minus 6', say: `The answer is ${answer}. Tap it.`, answer, kind: 'math' });
    assert.equal(result.status, 200);
    assert.doesNotMatch(result.body.say, /the answer is|tap it/i);
  });
}
for (const word of ['have', 'give', 'some', 'come', 'love', 'one', 'done', 'none']) {
  test(`irregular word ${word} does not get a false magic-e rule`, async () => {
    const { result } = await first({ saw: `the word ${word}`, answer: word, kind: 'word', say: 'The silent e makes the vowel say its name.' });
    assert.doesNotMatch(result.body.say, /makes.*vowel.*say.*name/i);
  });
}
for (const question of ['not ship', 'ship or shop', 'is it ship?', 'I do not know ship']) {
  test(`uncertain answer "${question}" is not automatically marked correct`, async () => {
    const { result, storage } = await first({ saw: 'the word ship', answer: 'ship', kind: 'word', say: 'S and h together say /sh/. Say /sh/.' });
    const next = await handleTabletRequest({ store: storage, env, fetchImpl: model({ saw: 'the word ship', answer: 'ship', kind: 'word', say: 'Try the first sound.' }), body: { ...body, followUp: true, sessionId: result.body.sessionId, question } });
    assert.notEqual(next.body.revealed, true);
  });
}
test('spoken math answer eight matches stored numeral 8', async () => {
  const { result, storage } = await first({ saw: 'the problem 14 minus 6', answer: '8', kind: 'math', say: 'Start at fourteen. Count back six.' });
  const next = await handleTabletRequest({ store: storage, env, fetchImpl: model({}), body: { ...body, followUp: true, sessionId: result.body.sessionId, question: 'eight' } });
  assert.equal(next.body.revealed, true);
  assert.match(next.body.say, /yes.*8/i);
});
test('math follow-up prompt has math steps, not first-letter instructions', async () => {
  const { result, storage } = await first({ saw: 'the problem 14 minus 6', answer: '8', kind: 'math', say: 'Start at fourteen.' });
  const requests = [];
  await handleTabletRequest({ store: storage, env, fetchImpl: model({ answer: '8', kind: 'math', say: 'Count back six.' }, requests), body: { ...body, followUp: true, sessionId: result.body.sessionId, question: 'I have fourteen' } });
  const prompt = requests[0].messages[1].content[0].text;
  assert.doesNotMatch(prompt, /first letter|spelling|known.*sounds/i);
});
test('a short marked word stays fixed when the model changes its answer', async () => {
  const { result, storage } = await first({ saw: 'the word she', answer: 'she', kind: 'word', say: 'S and h together say /sh/.' });
  const next = await handleTabletRequest({ store: storage, env, fetchImpl: model({ saw: 'the word ship', answer: 'ship', kind: 'word', say: 'Try the first sound.' }), body: { ...body, followUp: true, sessionId: result.body.sessionId, question: 'sh' } });
  assert.equal(storage.data.get(`tablet-sessions/${next.body.sessionId}`).answer, 'she');
});
test('vision outage returns retry and does not consume a hint', async () => {
  const storage = store();
  const result = await handleTabletRequest({ store: storage, env, body, fetchImpl: async () => { throw new Error('offline'); } });
  assert.equal(result.status, 503);
  assert.equal(storage.data.size, 0);
});
test('an empty vision result is retryable, not an invented tutoring turn', async () => {
  const { result, storage } = await first({});
  assert.equal(result.status, 422);
  assert.equal(storage.data.size, 0);
});
test('unheard speech asks for repetition without advancing the lesson', async () => {
  const { result, storage } = await first({ answer: 'cat', kind: 'word', say: 'The c says /k/.' }, store(), { audioBase64: Buffer.from('silence').toString('base64') });
  assert.equal(result.status, 422);
  assert.equal(storage.data.size, 0);
});
test('session storage outage returns a child-readable error', async () => {
  const result = await handleTabletRequest({ store: { async get() { throw new Error('store down'); } }, env, fetchImpl: model({}), body: { ...body, followUp: true, sessionId: 'session-1234' } });
  assert.equal(result.status, 503);
  assert.ok(result.body.error);
});
test('saving an outcome still works when AI credentials are temporarily unavailable', async () => {
  const { result, storage } = await first({ saw: 'the word cat', answer: 'cat', kind: 'word', say: 'The c says /k/.' });
  const next = await handleTabletRequest({ store: storage, env: {}, body: { action: 'outcome', sessionId: result.body.sessionId, outcome: 'got-it' } });
  assert.equal(next.status, 200);
});

test('a fresh question cannot overwrite an existing session by supplying its ID', async () => {
  const { result, storage } = await first({ saw: 'the word cat', answer: 'cat', kind: 'word', say: 'The c says /k/.' });
  const next = await first({ saw: 'the word dog', answer: 'dog', kind: 'word', say: 'The d says /d/.' }, storage, { sessionId: result.body.sessionId, kid: 'gabi' });
  assert.notEqual(next.result.body.sessionId, result.body.sessionId);
  assert.equal(storage.data.get(`tablet-sessions/${result.body.sessionId}`).kid, 'max');
});
for (const answer of ['0', '1', '2', '9', '15', '20', '42', '99']) {
  test(`math answer ${answer} survives a model switching answers on the next turn`, async () => {
    const reply = { saw: 'the marked math problem', answer, kind: 'math', say: 'Count the objects one at a time.' };
    const { result, storage } = await first(reply);
    const next = await handleTabletRequest({ store: storage, env, fetchImpl: model({ ...reply, answer: '777' }), body: { ...body, followUp: true, sessionId: result.body.sessionId, question: 'help' } });
    assert.equal(storage.data.get(`tablet-sessions/${next.body.sessionId}`).answer, answer);
  });
}
test('math fallback does not reveal an answer that is also an operand', async () => {
  const { result } = await first({ saw: 'the problem 0 plus 8', answer: '8', kind: 'math', say: 'The answer is 8.' });
  assert.doesNotMatch(result.body.say, /\b8\b/);
});

for (const [word, forbidden] of [['said', '/ay/'], ['again', '/ay/'], ['broad', '/oh/'], ['board', '/oh/'], ['country', '/ow/'], ['trouble', '/ow/'], ['enough', '/ow/'], ['throughout', '/ow/'], ['grouping', '/ow/'], ['soups', '/ow/'], ['famous', '/ow/']]) {
  test(`does not impose an incorrect regular vowel sound on ${word}`, async () => {
    const { result } = await first({ saw: `the word ${word}`, answer: word, kind: 'word', say: `The letter ${word[0]} is first. Say its sound.` });
    assert.equal(result.body.say.includes(forbidden), false);
  });
}
for (const word of ['house', 'mouse', 'horse', 'nurse', 'large', 'bridge', 'dance']) {
  test(`fallback for ${word} does not invent a long-vowel magic-e rule`, async () => {
    const { result } = await first({ saw: `the word ${word}`, answer: word, kind: 'word', say: 'Sound it out.' });
    assert.doesNotMatch(result.body.say, /makes.*vowel.*say.*name/i);
  });
}
for (const word of ['no', 'not', 'or']) {
  test(`reading the word ${word} itself counts as the correct answer`, async () => {
    const { result, storage } = await first({ saw: `the word ${word}`, answer: word, kind: 'word', say: `The letter ${word[0]} is first.` });
    const next = await handleTabletRequest({ store: storage, env, fetchImpl: model({}), body: { ...body, followUp: true, sessionId: result.body.sessionId, question: word } });
    assert.equal(next.body.revealed, true);
  });
}

test('reveal never substitutes 18 for the stored answer 8', async () => {
  const reply = { saw: 'the problem 14 minus 6', answer: '8', kind: 'math', say: 'Start at fourteen.' };
  const { result, storage } = await first(reply);
  await handleTabletRequest({ store: storage, env, fetchImpl: model({ ...reply, say: 'Count back six.' }), body: { ...body, followUp: true, sessionId: result.body.sessionId } });
  const next = await handleTabletRequest({ store: storage, env, fetchImpl: model({ ...reply, answer: '18', say: 'The answer is 18.' }), body: { ...body, followUp: true, sessionId: result.body.sessionId } });
  assert.match(next.body.say, /\b8\b/);
  assert.doesNotMatch(next.body.say, /\b18\b/);
});
for (const [answer, spoken] of [['21', 'twenty-one'], ['42', 'forty two'], ['99', 'ninety nine'], ['100', 'one hundred'], ['105', 'one hundred and five']]) {
  test(`math hint withholds spoken answer ${spoken}`, async () => {
    const { result } = await first({ saw: 'the marked math problem', answer, kind: 'math', say: `That makes ${spoken}.` });
    assert.equal(result.body.say.includes(spoken), false);
  });
  test(`spoken answer ${spoken} is recognized`, async () => {
    const { result, storage } = await first({ saw: 'the marked math problem', answer, kind: 'math', say: 'Count the objects.' });
    const next = await handleTabletRequest({ store: storage, env, fetchImpl: model({}), body: { ...body, followUp: true, sessionId: result.body.sessionId, question: spoken } });
    assert.equal(next.body.revealed, true);
  });
}

test('local speech fallback gets pronounceable text when cloud speech is unavailable', async () => {
  const { result } = await first({ saw: 'the word pounds', answer: 'pounds', kind: 'word', say: 'O and u say /ow/.' });
  assert.equal(result.body.audioBase64, '');
  assert.ok(result.body.spokenText);
  assert.doesNotMatch(result.body.spokenText, /\/ow\//);
  assert.match(result.body.spokenText, /like in cow/);
});
