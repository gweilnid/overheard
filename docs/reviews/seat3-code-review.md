# Seat 3 code review — `seat3/skip-duplicate-creates`

Date: 2026-09-12
Scope: commit `0c1e219` (duplicate-create guard in `applyDiff`) and the Seat 3
files around it: `apps/web/lib/store.ts`, `apps/web/app/api/*`, plus
`apps/bot/src/index.ts` where it interacts with them.
Status: **findings only, nothing fixed yet.**

## TL;DR

- The duplicate-create guard in `0c1e219` collides with the seed fixture
  (**confirmed**). Real promises can silently disappear on stage. Fix before the demo.
- Every API route is unauthenticated, and `next dev` listens on all network
  interfaces. Anyone on the venue Wi-Fi can read chat quotes, wipe the board or
  close cards.

## Introduced by `0c1e219`

| # | Issue | Demo impact |
|---|---|---|
| 1 | Seed cards block real messages with the same id | **High, confirmed** |
| 2 | A second promise in the same message is lost if it only shows up in a later run | Low |
| 3 | The same create twice in one diff still gives two identical cards | Low |

### 1. Seed cards block real messages (confirmed)

`apps/web/lib/store.ts:46-51`. The guard skips any create whose `sourceMessageId`
already belongs to a commitment. `/api/seed` loads cards with `sourceMessageId`
**103, 88 and 71** (fixture `chatId: -1`). Telegram numbers a group's messages
sequentially from 1, so the demo group will reach those ids. A real promise made
in message 71, 88 or 103 then gets no card and no ✍️.

Verified: `apps/web/fixtures/demo.json` → `seedCommitments` source ids `[103, 88, 71]`.

### 2. Second promise in one message, found in a later run

`apps/web/lib/store.ts:51`. "I'll send the numbers and Jana can book the room."
Run 1 creates the numbers card; the room part scores 0.6 and is filtered. Run 2,
with more context, returns it at 0.85, but the message id is already known, so the
room commitment never appears. This contradicts the commit message's claim that
two promises in one message are kept (true only when both come in the same diff).

### 3. Identical duplicate in one diff

`apps/web/lib/store.ts:48`. `known` is built before the create loop and not updated
inside it, so if the model emits the same create twice in one response, both are
stored.

## Pre-existing (not introduced by `0c1e219`)

| # | Issue | Demo impact |
|---|---|---|
| 4 | No auth on `/api/ingest`, `/api/seed`, `/api/close`, `/api/commitments` | **High on shared Wi-Fi** |
| 5 | No input validation on `/api/ingest` | Medium |
| 6 | Debounce has no max wait; memory grows without limit | Low |
| 7 | Multiple chats share one window and one reaction set | None (one group) |

### 4. Unauthenticated routes, reachable from the network

- `GET /api/commitments` returns every card, verbatim quote and person name.
- `POST /api/seed` replaces the whole store with the fixture.
- `POST /api/close {id}` marks any card done (ids come from the GET above).
- `POST /api/ingest` accepts forged messages. Combined with #1, a forged message
  can pre-claim a future message id (ids are sequential) and suppress the real
  promise when it arrives. Forged messages also add fake people to the roster and
  cost paid LLM calls.

`next dev` binds to all interfaces by default, so this is reachable by anyone on
the same network, not only localhost.

### 5. No input validation on ingest

`apps/web/app/api/ingest/route.ts:7-8`. The body is cast to `IngestMessage`
without checks. `{"text": 123}` is stored, and every later `extract()` throws on
`m.text.trim()` while that message is in the 25-message window: no cards, no
reactions, for 25 messages. A `messageId` sent as the string `"5"` never matches
the number in the model's output, so every diff citing it is rejected.

### 6. Debounce starvation and unbounded memory

`apps/web/lib/store.ts`. Posting more often than every 2 s keeps resetting the
timer, so extraction never runs and every pending ingest request, the bot's
included, hangs. `store.messages`, `store.people` and `store.reacted` grow without
limit. In a normal demo this only means cards wait for a 2-second pause.

### 7. Multiple chats

The 25-message window mixes all chats, and `reactTo` ids go to whichever chat's
ingest call claims them first, so a ✍️ can land on the wrong message in the wrong
chat. The plan targets one group, so this does not affect the demo. The seed
fixture's `chatId: -1` messages do mix into the real group's window after
`/api/seed`.

## Recommended fixes

| # | Fix | Owner | Size |
|---|---|---|---|
| 1 | Skip a create only if the existing card's `quote` appears in this source message's text. Seed quotes won't match real messages; a card re-created after Done will. | Seat 3 | ~3 lines |
| 4 | Run the web app with `next dev -H 127.0.0.1`. Bot and projector run on the same laptop, so nothing breaks. | Shared (`apps/web/package.json`) — tell the team | 1 line |
| 5 | Type-check the ingest body and return 400 on bad input. | Seat 3 | ~5 lines |
| 2, 3, 6, 7 | Accept for a 2.5 h hackathon. | — | — |

Longer term (not for today): the guard patches the output, not the cause.
`extract()` only receives open commitments, so the model does not know about
closed ones. Passing recently closed cards whose source is still in the window as
context, and deduping on `(chatId, sourceMessageId, normalized what)`, would fix
#1–#3 properly. That touches Seat 2's prompt and the frozen contract.
