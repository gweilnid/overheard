# Overheard

*An agent that hears promises where they are actually made.*

A Telegram group agent that **never posts a message**. It listens to ordinary
team conversation, extracts the commitments people make to each other, reacts
with a check mark on the message it learned from, and shows each person a
private list of what is hanging on them.

**→ Start here: [`PLAN.md`](PLAN.md) — the 2.5 hour build plan. Find your seat and go.**

[`docs/superpowers/specs/2026-09-12-overheard-design.md`](docs/superpowers/specs/2026-09-12-overheard-design.md)
is the full vision, written for a 24–48h build. It is context, not instructions.
Where the two disagree, `PLAN.md` wins.

## Do these in the first 20 minutes

1. `/setprivacy` → **Disable** for the bot in BotFather — otherwise it sees nothing
   in the group.
2. Verify a ✅ reaction actually posts from the bot. Non-premium bots are limited to
   an allowed emoji set; find out now, not at T+2:00.

## Seats

| # | Owner | Scope |
|---|---|---|
| 1 | | Bot — grammY long polling, forward to `/api/ingest`, apply ✅ |
| 2 | | Extractor — prompt, diff logic, fixture + `npm run eval` |
| 3 | | Store + API — in-memory store, debounce, ingest/commitments/close |
| 4 | | Board — Next.js, polls every 2s, cards grouped by person |
| 5 | | Setup + demo — BotFather, group, demo script, rehearsal, fallback video |

## Stack

TypeScript monorepo. grammY + Next.js + OpenRouter. No database — state is
in-memory in the Next.js process.

## Conversation extraction

`apps/web/lib/extract.ts` uses OpenRouter through native fetch and validates the
returned commitment diff with Zod. The ingest endpoint is still a stub and does
not yet call the extractor.

Copy `apps/web/.env.example` to `apps/web/.env.local` and set
`OPENROUTER_API_KEY`. `OPENROUTER_MODEL` defaults to `openai/gpt-4.1-mini`.
To switch models, change that variable (for example to
`anthropic/claude-sonnet-4`), then restart the process if needed to reload its
environment; no source changes or rebuild are required. Configuration is read on
every extraction call. Optional `OPENROUTER_SITE_URL` and
`OPENROUTER_APP_NAME` supply attribution headers.

Server callers can override the model per request:

```ts
await extract({ messages, open, roster }, { model: 'google/gemini-2.5-flash' })
```

Precedence is per-request model, environment model, then default (blank values
are ignored). Models must support chat completions with JSON object output.
The extractor uses the last 25 nonblank messages. Empty input returns an empty
diff without a request; configuration, transport, timeout, and validation errors
throw. Callers should handle errors at their boundary. No transcripts or provider
response bodies are logged. The module is server-only; standalone Node callers
must enable the `react-server` condition (both `npm run eval` and `npm run test`
already do).

Run `npm run test -w @overheard/web` for mocked extraction tests (no API credits)
and `npm run typecheck -w @overheard/web` for TypeScript validation.
