# Overheard — 2.5 Hour Build Plan

**Read this, find your seat, start. Do not read the design spec first — it describes a
24–48h project. This file is what we are actually building.**

The spec in `docs/superpowers/specs/` stays as the vision. This is the cut-down.

---

## What we are building

A Telegram group conversation happens. The bot says **nothing**. A ✍️ appears on the
messages where someone made a promise. A board on the projector fills itself with
those commitments, live. Then someone DMs the bot `/me`, gets their personal list,
taps **Done**, and the board changes in front of the audience.

Next to the board sits a CopilotKit chat that can see the whole group state, so
you can ask it the questions you cannot ask in Telegram — *"what is Mehmet on the
hook for?"* — and close or reassign things from the chat.

That is the whole product. Everything else is cut.

**Everything in this project is in English** — code, comments, commit messages,
the prompt, the fixture, the demo conversation, the UI. No exceptions.

## Cut, deliberately

Supabase / any database · realtime subscriptions · identity & nickname
resolution · `events` table · timeline view · deploy · auth · deadline nudges ·
`/start` onboarding deep links.

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
   v  bot applies ✍️ via setMessageReaction
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
| `POST /api/seed` | — | refills the board from `fixtures/demo.json` |

`GET /api/commitments` serves the real store as soon as it has anything in it,
and falls back to fake data while it is empty — so Seat 4 is never blocked.

**`POST /api/seed` is the demo safety net.** The store is in memory, so a Next.js
restart empties the board. One curl refills it instead of replaying the whole
conversation in Telegram. Learn this reflex now, not at T+2:25:

```bash
curl -X POST localhost:3000/api/seed
```

### The extractor

```ts
extract(input: {
  messages: IngestMessage[]   // last 25
  open: Commitment[]          // currently open
  roster: Person[]            // everyone seen in the group
}): Promise<Diff>
```

**It returns a diff, never a fresh list.** That one decision handles all three cases:
"yeah I'll do it" binds to what was discussed 5 messages earlier; "actually Gokhan's
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

### LLM call — OpenRouter

Everything that talks to a model goes through `lib/llm.ts`. The plumbing is
already written and builds; Seat 2 only writes the prompt.

```ts
import OpenAI from 'openai'

export const llm = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
})
```

The diff comes back through `response_format: { type: 'json_schema', ... }` with
`strict: true`. The schema is already written in `lib/extract.ts`.

**The OpenRouter trap:** structured-output support is per **provider**, not per
model. The same model is served by several providers and only some honour
`json_schema` — get routed to one that doesn't and you silently receive prose
instead of JSON. So every call sends:

```ts
provider: { require_parameters: true }
```

That is in `lib/llm.ts` as `REQUIRE_STRUCTURED`. Do not drop it.

Model is `OPENROUTER_MODEL`, defaulting to `anthropic/claude-sonnet-4.5`. Swap it
in `.env.local` — no code change. Check a model actually supports structured
outputs at `openrouter.ai/models?supported_parameters=structured_outputs`.

Two schema details worth knowing before they confuse you:

- `strict: true` means **every** property must be listed in `required`. Optional
  fields are therefore typed `['string', 'null']`.
- On `update`, `null` means "leave this field unchanged". `extract()` strips the
  nulls before returning, so the rest of the code never sees them.

---

## Seats

### Seat 1 — Bot (`apps/bot`)
Unblocked at T+0:20. Roughly 70 lines.

**There is one bot token and Telegram allows one long-polling connection per
token.** Only one person runs `npm run bot` at a time — Seat 1 while building,
then it moves to the demo laptop. Two at once and one of you silently stops
receiving messages with a 409.
- [ ] grammY long polling (`bot.start()`), **not** webhooks
- [ ] `bot.on('message:text')` → build `IngestMessage` → `POST {WEB_URL}/api/ingest`
- [ ] For each id in the `reactTo` response: `ctx.api.setMessageReaction(chatId, id, [{type:'emoji', emoji:'✍️'}])`
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

### Seat 5 — Setup, then CopilotKit (starts at T+0:00)
First 20 minutes decide whether we have a demo at all. Then you build the sidebar.
- [ ] BotFather: create bot, **`/setprivacy` → Disable** (without this the bot sees
      nothing in the group), grab the token
- [ ] Create the group, add the bot, make it admin
- [x] ~~Verify the reaction posts~~ — **done, and ✅ does not exist as a Telegram
      reaction.** `✅`, `☑️` and `✔️` all return `REACTION_INVALID`. We mark with
      **✍️**; `🫡 👀 👍 👌 🤝 💯 🤔 🎉` also work if you want to change it.
- [ ] Write the ~25-line English demo conversation with Seat 2 (same file as the fixture)
- [ ] Rehearse it twice out loud with whoever is on stage
- [ ] **Record a screen-capture fallback video once it works.** Insurance.

Then, from ~T+0:45 once Seat 4's board holds state:
- [ ] `app/api/copilotkit/route.ts` — `CopilotRuntime` + `OpenAIAdapter`, handed
      the same OpenRouter client from `lib/llm.ts`. No second key, no second
      provider.
- [ ] `<CopilotKit runtimeUrl="/api/copilotkit">` provider in `app/layout.tsx`
      (the TODO marker is already there) + `<CopilotSidebar>`
- [ ] `useCopilotReadable({ description: 'All commitments in the group, who owes
      what to whom', value: commitments })` — five lines, the state already exists
- [ ] `useCopilotAction` for `closeCommitment` → `POST /api/close`

**Read this before you write a line of CopilotKit code.** There are two
generations of the API live at once and the docs mix them:

| | v1 | v2 |
|---|---|---|
| state | `useCopilotReadable` | `useAgentContext` |
| actions | `useCopilotAction` | `useFrontendTool` (Zod params) |
| runtime | `CopilotRuntime` + `AnthropicAdapter` | `createCopilotRuntimeHandler` + `BuiltInAgent` |

Paste a v1 snippet into a v2 install and you get "hook is not exported" and lose
half an hour. **Install, open `node_modules/@copilotkit/react-core`, look at what
is actually exported, then write code.** Use v1 — `OpenAIAdapter` takes a plain
OpenAI client, which is exactly what `lib/llm.ts` already exports.

The sidebar is the first thing cut at T+1:40 if the gate is at risk. Seat 4's
board is the demo; this is the second wow, not the first.

---

## Timeline

| Time | What |
|---|---|
| **T+0:00–0:20** | Seat 5 on BotFather. One person lands the skeleton + `packages/types` + stub endpoints returning fake data. Everyone else: `npm install`, keys. |
| **T+0:20–1:20** | Four seats build in parallel against fake data. Nobody touches anyone else's files. Seat 5 starts CopilotKit at ~T+0:45. |
| **T+1:20–1:40** | Integration. **HARD GATE: one real Telegram message produces one real card on the board by T+1:40.** |
| **T+1:40–2:10** | `/me` DM + Done button, and finish the sidebar — *only if the gate passed*. If it did not, both get cut and we demo the board alone. |
| **T+2:10–2:30** | Rehearse twice. Record the fallback. |

## Getting started

The skeleton is already on `main` and it builds. Clone, then:

```bash
npm install                 # workspace root, installs everything

cp apps/web/.env.example apps/web/.env.local     # add OPENROUTER_API_KEY
cp apps/bot/.env.example apps/bot/.env           # add TELEGRAM_BOT_TOKEN

npm run web                 # Next.js on :3000 — board + API
npm run bot                 # grammY long polling
```

> **Never run two bots on one token.** Telegram allows a single `getUpdates`
> long-poll per bot: a second instance kills the first with `409 Conflict`, and
> the first does not come back. `npm run bot` therefore runs **without**
> `--watch` — the watcher restarts its child while the old one still holds the
> poll, so it conflicts with itself on any file change (a `git rebase` is
> enough to trigger it). Use `npm run bot:watch` only while editing bot code,
> never during a demo. `ps` is not proof it is alive — the watcher survives the
> crash and idles. Check instead:
>
> ```bash
> grep -c Conflict /tmp/overheard-bot.log   # must be 0
> tail -2 /tmp/overheard-bot.log            # must end in activity
> ```

`GET /api/commitments` already returns realistic fake data, so **Seat 4 can build
the board right now** without waiting for anyone.

Every file you own has a `TODO SEAT n` marker in it saying what to replace.

| File | Seat |
|---|---|
| `packages/types/index.ts` | frozen contract — nobody edits after T+0:20 |
| `apps/bot/src/index.ts` | 1 |
| `apps/web/lib/extract.ts`, `apps/web/fixtures/demo.json`, `scripts/eval.ts` | 2 |
| `apps/web/lib/store.ts`, `apps/web/app/api/*` | 3 |
| `apps/web/app/page.tsx` | 4 |
| `apps/web/app/layout.tsx`, `app/api/copilotkit/` | 5 |

## UI work

The board follows a design system generated by the ui-ux-pro-max skill for this
product type — Flat Design, professional blue with deal green, Fira Sans / Fira
Code, no gradients or shadows, 150-200ms transitions, SVG icons rather than emoji.
It is gitignored (172 files); reinstall it with:

```bash
npm install -g ui-ux-pro-max-cli && uipro init --ai claude
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system -p Overheard
```

## Gotchas that already cost us time

- **Never run `npm run build` while `npm run dev` is running.** They share
  `apps/web/.next` and the production build clobbers the dev chunks — every route
  starts 500ing with `Cannot find module './chunks/vendor-chunks/next.js'`. Fix:
  stop dev, `rm -rf apps/web/.next`, start dev again.
- **The store empties on every web restart.** `curl -X POST localhost:3000/api/seed`
  to refill.
- **NEVER leave seeded data in the store during a live run.** The fixture's fake
  fixture messages land in the same extraction window as real ones,
  and the model hands a real person's promise to a fixture name — it did exactly
  that to a real message in our group. `curl -X POST localhost:3000/api/reset`
  clears everything before you go live.
- **`curl -s localhost:3000/api/debug`** shows people, commitments and every raw
  message ingested. When a message does not become a card, look here first — it
  tells you whether it was even received.

## Before the demo: real Telegram ids in the fixture

The seed is the on-stage safety net, so it uses the real team. But `/me` matches
on Telegram user id, not name — a fixture id that is not someone's real id means
their digest comes back empty in front of the judges.

1. Everyone sends one message in the group
2. `npm run roster -w @overheard/web`

It reads the live store and rewrites every `TODO-<NAME>` in `fixtures/demo.json`
with the real id, then tells you which are still missing.

## Rules for the next 2.5 hours

1. **Stay in your own files.** The contract above is the only shared surface.
2. **Commit small and often to `main`.** No PRs, no review — there is no time and the
   blast radius is one demo.
3. **If you are blocked for more than 5 minutes, say so out loud.** Do not debug alone.
4. **At T+1:40 we ship what works.** Anything unfinished gets cut, not rescued.
5. **Everything in English.** Code, comments, commits, prompt, fixture, demo
   conversation, UI.
