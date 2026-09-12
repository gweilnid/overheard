import assert from 'node:assert/strict'
import { afterEach, beforeEach, test, mock } from 'node:test'
import { extract, DEFAULT_OPENROUTER_MODEL } from './extract'

const input = {
  messages: [{ messageId: 1, chatId: -1, userId: 'p1', name: 'Ada', text: "I'll send it tomorrow", ts: 0 }],
  open: [],
  roster: [{ id: 'p1', name: 'Ada' }],
}
const diff = {
  create: [{ ownerId: 'p1', ownerName: 'Ada', what: 'send it', toWhom: null,
    due: 'tomorrow', quote: "I'll send it tomorrow", sourceMessageId: 1, confidence: 0.9 }],
  update: [], close: [],
}
const envKeys = ['OPENROUTER_API_KEY', 'OPENROUTER_MODEL', 'OPENROUTER_SITE_URL', 'OPENROUTER_APP_NAME'] as const
let previous: (string | undefined)[]
beforeEach(() => {
  previous = envKeys.map(key => process.env[key])
  envKeys.forEach(key => delete process.env[key])
  process.env.OPENROUTER_API_KEY = 'test-secret'
  mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected request') })
})
afterEach(() => {
  mock.restoreAll()
  mock.timers.reset()
  envKeys.forEach((key, i) => {
    if (previous[i] === undefined) delete process.env[key]
    else process.env[key] = previous[i]
  })
})
function completion(content = JSON.stringify(diff)) {
  return Response.json({ choices: [{ message: { content }, finish_reason: 'stop' }] })
}
function respond(response: Response) {
  return mock.method(globalThis, 'fetch', async () => response)
}

for (const [override, configured, expected] of [
  [' custom/model ', 'env/model', 'custom/model'],
  [undefined, ' env/model ', 'env/model'],
  [' ', ' ', DEFAULT_OPENROUTER_MODEL],
  [undefined, undefined, DEFAULT_OPENROUTER_MODEL],
]) {
  test(`model resolution: ${override} / ${configured}`, async () => {
    if (configured !== undefined) process.env.OPENROUTER_MODEL = configured
    const fetchMock = mock.method(globalThis, 'fetch', async (url: Parameters<typeof fetch>[0], init?: RequestInit) => {
      assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions')
      const body = JSON.parse(String(init?.body))
      assert.equal(body.model, expected)
      assert.equal(body.temperature, 0)
      assert.equal(body.max_tokens, 2000)
      assert.deepEqual(body.response_format, { type: 'json_object' })
      assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer test-secret')
      return completion()
    })
    assert.deepEqual(await extract(input, { model: override }), diff)
    assert.equal(fetchMock.mock.callCount(), 1)
  })
}

test('configuration is read on each call and optional metadata is forwarded', async () => {
  const models: string[] = []
  process.env.OPENROUTER_APP_NAME = 'Overheard'
  process.env.OPENROUTER_SITE_URL = 'http://localhost:3000'
  mock.method(globalThis, 'fetch', async (_url: Parameters<typeof fetch>[0], init?: RequestInit) => {
    models.push(JSON.parse(String(init?.body)).model)
    assert.equal(new Headers(init?.headers).get('X-Title'), 'Overheard')
    assert.equal(new Headers(init?.headers).get('HTTP-Referer'), 'http://localhost:3000')
    return completion()
  })
  await extract(input)
  process.env.OPENROUTER_MODEL = 'another/model'
  await extract(input)
  assert.deepEqual(models, [DEFAULT_OPENROUTER_MODEL, 'another/model'])
})

test('empty and whitespace conversations do not need a key or request', async () => {
  delete process.env.OPENROUTER_API_KEY
  const fetchMock = respond(completion())
  for (const messages of [[], [{ ...input.messages[0], text: ' \n ' }]]) {
    assert.deepEqual(await extract({ ...input, messages }), { create: [], update: [], close: [] })
  }
  assert.equal(fetchMock.mock.callCount(), 0)
})

test('missing or blank key fails before HTTP', async () => {
  const fetchMock = respond(completion())
  for (const key of [undefined, ' ']) {
    if (key === undefined) delete process.env.OPENROUTER_API_KEY
    else process.env.OPENROUTER_API_KEY = key
    await assert.rejects(extract(input), /OPENROUTER_API_KEY is not configured/)
  }
  assert.equal(fetchMock.mock.callCount(), 0)
})

test('Markdown fenced JSON is accepted', async () => {
  respond(completion(' \n```json\n' + JSON.stringify(diff) + '\n```\n'))
  assert.deepEqual(await extract(input), diff)
})

for (const [content, error] of [
  ['not JSON', /extraction contains invalid JSON/],
  ['{}', /schema validation/],
  [JSON.stringify({ ...diff, extra: true }), /schema validation/],
  [JSON.stringify({ ...diff, create: [{ ...diff.create[0], confidence: 2 }] }), /schema validation/],
  [JSON.stringify({ ...diff, close: ['unknown'] }), /unknown owner, commitment, or source quote/],
  [JSON.stringify({ ...diff, create: [{ ...diff.create[0], ownerId: 'unknown' }] }), /unknown owner/],
  [JSON.stringify({ ...diff, create: [{ ...diff.create[0], quote: 'invented' }] }), /source quote/],
] as const) {
  test(`rejects invalid extraction: ${content}`, async () => {
    respond(completion(content))
    await assert.rejects(extract(input), error)
  })
}

for (const body of [{}, { choices: [] }, { choices: [{}] },
  { choices: [{ message: {} }] }, { choices: [{ message: { content: null } }] },
  { choices: [{ message: { content: ' ' } }] }]) {
  test(`rejects malformed envelope: ${JSON.stringify(body)}`, async () => {
    respond(Response.json(body))
    await assert.rejects(extract(input), /malformed completion or missing content/)
  })
}

test('HTTP error includes status without leaking response', async () => {
  respond(new Response('test-secret private transcript', { status: 429 }))
  await assert.rejects(extract(input), { message: 'OpenRouter request failed with status 429.' })
})
test('invalid response JSON is distinguished from extraction JSON', async () => {
  respond(new Response('not JSON'))
  await assert.rejects(extract(input), /returned invalid response JSON/)
})
test('API error payload is rejected even with HTTP 200', async () => {
  respond(Response.json({ error: { message: 'test-secret' } }))
  await assert.rejects(extract(input), { message: 'OpenRouter returned an API error payload.' })
})
test('network errors do not echo sensitive error details', async () => {
  mock.method(globalThis, 'fetch', async () => { throw new Error('test-secret') })
  await assert.rejects(extract(input), { message: 'OpenRouter network request failed.' })
})
test('timeout aborts HTTP and is reported distinctly', async () => {
  mock.timers.enable({ apis: ['setTimeout'] })
  mock.method(globalThis, 'fetch', (_url: Parameters<typeof fetch>[0], init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))
  }))
  const result = assert.rejects(extract(input), /timed out after 30 seconds/)
  mock.timers.tick(30_000)
  await result
})
test('truncated completions are rejected', async () => {
  respond(Response.json({ choices: [{ message: { content: JSON.stringify(diff) }, finish_reason: 'length' }] }))
  await assert.rejects(extract(input), /did not finish successfully/)
})
test('valid updates and closures retain the Diff contract', async () => {
  const change = { create: [], update: [{ id: 'c1', due: 'Friday' }], close: ['c2'] }
  respond(completion(JSON.stringify(change)))
  const open = ['c1', 'c2'].map(id => ({ ...diff.create[0], id, status: 'open' as const }))
  assert.deepEqual(await extract({ ...input, open }), change)
})
test('only the last 25 nonblank messages are sent, without private roster metadata', async () => {
  mock.method(globalThis, 'fetch', async (_url: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const prompt = JSON.parse(JSON.parse(String(init?.body)).messages[1].content)
    assert.equal(prompt.messages.length, 25)
    assert.equal(prompt.messages[0].messageId, 5)
    assert.deepEqual(prompt.roster, input.roster)
    return completion(JSON.stringify({ create: [], update: [], close: [] }))
  })
  await extract({ ...input,
    roster: [{ ...input.roster[0], dmChatId: 999 }],
    messages: Array.from({ length: 30 }, (_, messageId) => ({ ...input.messages[0], messageId })),
  })
})
