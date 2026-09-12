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

TypeScript monorepo. grammY + Next.js + Anthropic SDK. No database — state is
in-memory in the Next.js process.
