# Overheard

*An agent that hears promises where they are actually made.*

A Telegram group agent that **never posts a message**. It listens to ordinary
team conversation, extracts the commitments people make to each other, reacts
with a check mark on the message it learned from, and sends each person a
private digest of what is hanging on them.

Hackathon project, 5 people, ~24–48h. Stack: grammY + Next.js + CopilotKit +
Supabase, single TypeScript monorepo.

**Read the design spec first:**
[`docs/superpowers/specs/2026-09-12-overheard-design.md`](docs/superpowers/specs/2026-09-12-overheard-design.md)

## Do these before anything else

1. Disable privacy mode for the bot in BotFather — otherwise it sees nothing in
   the group.
2. Every demo participant must send `/start` to the bot in a private chat — a
   bot cannot message a person first.

## Seats

| # | Owner | Scope |
|---|---|---|
| 1 | | Telegram ingest — bot, reactions, storage, identity |
| 2 | | Extraction agent — prompt, diff logic, fixture test |
| 3 | | Data & realtime — schema, endpoints, live updates |
| 4 | | Board UI — Next.js, cards, timeline |
| 5 | | CopilotKit & demo choreography |
