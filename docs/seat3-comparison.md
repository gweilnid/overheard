# Seat 3: Complementary Reliability Improvements

The `seat3/skip-duplicate-creates` implementation should remain the baseline for
the store and ingest flow. Its duplicate-commitment protection, reaction claiming,
and shared debounce promise solve the most important live-demo failure modes.

This note records the complementary strengths found in an alternative Seat 3
implementation. These are small, independent improvements that can be adopted
without replacing the branch's debounce or deduplication design.

## 1. Validate the ingest payload at the API boundary

`POST /api/ingest` currently casts the parsed JSON body to `IngestMessage`.
Malformed requests can therefore produce unexpected runtime errors or corrupt the
in-memory state. Validate that these fields have the expected primitive types before
calling `addMessage`:

- `messageId`, `chatId`, and `ts`: numbers
- `userId`, `name`, and `text`: strings

Return `400 Bad Request` for an invalid body. This isolates a bad bot request from
the extraction pipeline and prevents a server error from reaching the bot.

## 2. Keep a person's displayed name current

When an existing Telegram user sends a message, update the stored `Person.name`.
Names and usernames can change during the lifetime of the process; without this
update, the board can keep rendering an outdated name.

Suggested behavior:

```ts
const person = store.people.find(p => p.id === message.userId)
if (person) person.name = message.name
else store.people.push({ id: message.userId, name: message.name })
```

## 3. Validate close requests, while preserving idempotency

`POST /api/close` should reject a missing or non-string `id` with `400 Bad Request`.
For a well-formed ID that does not match a card, retain the branch's idempotent
success response (`{ ok: true }`). A user may press a Done button twice, and that
should not turn a completed action into an avoidable demo error.

Suggested behavior:

```ts
if (!id) return NextResponse.json({ error: 'Invalid commitment id' }, { status: 400 })
const commitment = store.commitments.find(item => item.id === id)
if (commitment) commitment.status = 'done'
return NextResponse.json({ ok: true })
```

## Recommendation

Keep the current branch's `sourceMessageId` deduplication, `claimReactions`, and
shared-promise debounce unchanged. Add the three defensive improvements above in a
small follow-up commit. They improve API resilience and presentation accuracy without
changing the commitment-extraction behavior.
