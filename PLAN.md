# Overheard — 2.5 Hour Build Plan

**Read this, find your seat, start. Do not read the design spec first — it describes a
24–48h project. This file is what we are actually building.**

The spec in `docs/superpowers/specs/` stays as the vision. This is the cut-down.

---

## What we are building

A Telegram group conversation happens. The bot says **nothing**. A ✅ appears on the
messages where someone made a promise. A board on the projector fills itself with
those commitments, live. Then someone DMs the bot `/me`, gets their personal list,
taps **Done**, and the board changes in front of the audience.

That is the whole product. Everything else is cut.

## Cut, deliberately

Supabase / any database · CopilotKit · realtime subscriptions · identity &
nickname resolution · `events` table · timeline view · deploy · auth · deadline
nudges · `/start` onboarding deep links.

**There is no database.** State lives in memory in the Next.js process. One demo, one
group, one laptop. A DB costs 30 minutes and buys durability we will never need.

---

## Architecture

Two processes. Calls go one direction only.

```
apps/bot  (grammY, long polling)
   |
   |  POST  {WEB_URL}/api/ingest   { messageId, chatId, userId, name, text, ts }
   |  <---  { reactTo: number[] }
   v  bot applies ✅ via setMessageReaction
apps/web  (Next.js)
   |- lib/store.ts        globalThis singleton: messages[], people[], commitments[]
   |- lib/extract.ts      debounce 2s -> LLM -> Diff -> apply to store
   |- app/api/*           ingest, commitments, close
   `- app/page.tsx        polls GET /api/commitments every 2s
```

No webhooks, no tunnel, no deploy. Bot never talks to the LLM. Web never talks to
Telegram except through the `reactTo` array it returns.

### The contract — frozen at T+0:20, nobody edits it after that

`packages/types/index.ts`:

```ts
export type Person = { id: string; name: string; dmChatId?: number }

export type IngestMessage = {
  messageId: number
  chatId: number
  userId: string      // telegram user id, stringified
  name: string        // first_name or username
  text: string
  ts: number          // unix seconds
}

export type Commitment = {
  id: string
  ownerId: string     // MUST be a Person.id from the roster, or ''
  ownerName: string
  what: string        // short, imperative: "send the pricing deck"
  toWhom: string | null
  due: string | null  // free text as spoken: "Friday", "end of day"
  status: 'open' | 'done'
  quote: string       // VERBATIM from the source message
  sourceMessageId: number
  confidence: number  // 0..1
}

export type Diff = {
  create: Omit<Commitment, 'id' | 'status'>[]
  update: ({ id: string } & Partial<Pick<Commitment,
    'ownerId' | 'ownerName' | 'what' | 'toWhom' | 'due'>>)[]
  close: string[]     // commitment ids
}
```

### API

| Route | Body | Returns |
|---|---|---|
| `POST /api/ingest` | `IngestMessage` | `{ reactTo: number[] }` |
| `GET /api/commitments` | — | `{ commitments: Commitment[], people: Person[] }` |
| `POST /api/close` | `{ id: string }` | `{ ok: true }` |

### The extractor

```ts
extract(input: {
  messages: IngestMessage[]   // last 25
  open: Commitment[]          // currently open
  roster: Person[]            // everyone seen in the group
}): Promise<Diff>
```

**It returns a diff, never a fresh list.** That one decision handles all three cases:
"yeah I'll do it" binds to what was discussed 5 messages earlier; "actually Ondra's
taking that" rewrites the owner; "done, deployed" closes it.

**Owner assignment:** the roster goes into the prompt and the model must return an
`ownerId` **from that list** or `''`. No fuzzy nickname matching — that is a real NLP
problem and we have two hours.

**Two rules that stop the demo breaking:**

1. **Single-flight.** One `let running = false` guard around the debounce. Five people
   typing at once must not fire two overlapping windows — you get duplicate cards on
   the projector.
2. **Confidence threshold 0.7.** Only create above it, only react above it. A quiet
   agent that occasionally stays silent beats a chatty one that is wrong.

### LLM call

Default implementation is Claude. Keep it behind the `extract()` signature above so it
can be swapped in one file if the credits are somewhere else.

```ts
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'

const res = await client.messages.parse({
  model: 'claude-opus-5',
  max_tokens: 16000,
  messages: [{ role: 'user', content: prompt }],
  output_config: { format: zodOutputFormat(DiffSchema) },
})
const diff = res.parsed_output   // null if parsing failed — guard it
```

`ANTHROPIC_API_KEY` in `apps/web/.env.local`.

---

## Seats

### Seat 1 — Bot (`apps/bot`)
Unblocked at T+0:20. Roughly 70 lines.
- [ ] grammY long polling (`bot.start()`), **not** webhooks
- [ ] `bot.on('message:text')` → build `IngestMessage` → `POST {WEB_URL}/api/ingest`
- [ ] For each id in the `reactTo` response: `ctx.api.setMessageReaction(chatId, id, [{type:'emoji', emoji:'✅'}])`
- [ ] Never call `ctx.reply()` in the group. Ever. That is the product.
- [ ] **Stretch, after the T+1:40 gate:** `/me` in a private chat → that person's open
      commitments as text + one inline button per item → callback handler → `POST /api/close`

### Seat 2 — Extractor (`apps/web/lib/extract.ts`)
Unblocked at T+0:00. Needs no Telegram, no one else's code.
- [ ] `fixtures/demo.json` — ~15 English messages with the commitments you expect
- [ ] `npm run eval` — loads the fixture, calls `extract()`, prints diff vs expected
- [ ] The prompt: roster, open commitments, last 25 messages, "return a diff"
- [ ] Tune until "I should probably look at that sometime" does **not** create a
      commitment and "I'll send the deck by Friday" does
- [ ] Hand `fixtures/demo.json` to Seat 5 — it doubles as the demo script

### Seat 3 — Store + API (`apps/web/lib/store.ts`, `apps/web/app/api/*`)
Unblocked at T+0:20.
- [ ] `globalThis` singleton store (survives Next.js dev HMR — a plain module-level
      `const` does not)
- [ ] `POST /api/ingest`: append message, upsert person, kick the 2s debounce
- [ ] Debounce + single-flight guard + apply the `Diff` to the store
- [ ] Return `reactTo` = source message ids of creates above threshold
- [ ] `GET /api/commitments`, `POST /api/close`

### Seat 4 — Board (`apps/web/app/page.tsx`)
Unblocked at T+0:20. Build against a hardcoded JSON array until Seat 3 lands.
- [ ] Poll `/api/commitments` every 2s
- [ ] Columns by person; card = `what` + `due` + the **verbatim quote** underneath
- [ ] Done cards visibly struck through, not removed — the audience must see the change
- [ ] Big text. It is going on a projector, viewed from four metres away.

### Seat 5 — Setup + demo (starts at T+0:00, no code)
This seat decides whether we have a demo at all.
- [ ] BotFather: create bot, **`/setprivacy` → Disable** (without this the bot sees
      nothing in the group), grab the token
- [ ] Create the group, add the bot, make it admin
- [ ] **Verify a ✅ reaction actually posts** — non-premium bots are limited to an
      allowed emoji set. Confirm in the first 20 minutes, not at T+2:00.
- [ ] Write the ~25-line English demo conversation with Seat 2 (same file as the fixture)
- [ ] Rehearse it twice out loud with whoever is on stage
- [ ] **Record a screen-capture fallback video once it works.** Insurance.

---

## Timeline

| Time | What |
|---|---|
| **T+0:00–0:20** | Seat 5 on BotFather. One person lands the skeleton + `packages/types` + stub endpoints returning fake data. Everyone else: `npm install`, keys. |
| **T+0:20–1:20** | Four seats build in parallel against fake data. Nobody touches anyone else's files. |
| **T+1:20–1:40** | Integration. **HARD GATE: one real Telegram message produces one real card on the board by T+1:40.** |
| **T+1:40–2:10** | `/me` DM + Done button — *only if the gate passed*. If it did not, this block goes to fixing the gate and we demo the board alone. |
| **T+2:10–2:30** | Rehearse twice. Record the fallback. |

## Env

```
# apps/bot/.env
TELEGRAM_BOT_TOKEN=
WEB_URL=http://localhost:3000

# apps/web/.env.local
ANTHROPIC_API_KEY=
```

## Rules for the next 2.5 hours

1. **Stay in your own files.** The contract above is the only shared surface.
2. **Commit small and often to `main`.** No PRs, no review — there is no time and the
   blast radius is one demo.
3. **If you are blocked for more than 5 minutes, say so out loud.** Do not debug alone.
4. **At T+1:40 we ship what works.** Anything unfinished gets cut, not rescued.
