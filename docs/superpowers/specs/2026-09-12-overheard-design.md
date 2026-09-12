# Overheard — Design Spec

*An agent that hears promises where they are actually made.*

Date: 2026-09-12
Team size: 5
Format: hackathon (~24–48h)
Theme: agents are leaving the chatbox

## Thesis

A to-do app only works if you type the task in. But commitments are born mid-conversation — "yeah, I'll have it by Friday" — and that is also where they die. Nobody goes back and structures them.

Overheard is a member of your Telegram group that **never posts a single message**. It listens, reacts with ✅ on the message it learned something from, and then privately shows you what is hanging on you.

The context you cannot get anywhere else: the promise, who it was made to, and its later cancellation all live in the same conversation.

## Architecture

### 1. Telegram layer
Bot sits in the group and ingests every message. Three moves, nothing more:
- `setMessageReaction` — ✅ on the source message
- receiving DMs
- inline keyboard buttons in DMs

### 2. Extraction agent (the core of the project)
Does **not** run per message in isolation. It runs on a short debounce over a **window of the last ~30 messages plus the list of currently open commitments**.

It returns a **diff** — `create` / `update` / `close` — never a fresh list. That single decision solves three problems at once:
- "yeah, I'll do it" binds to whatever was discussed five messages earlier
- "actually Ondra is taking that one" rewrites the owner
- "done, deployed" closes the commitment

A reaction is only sent above a confidence threshold. A quiet agent that occasionally stays silent beats a chatty one that gets it wrong.

### 3. State
Postgres (Supabase).

| Table | Purpose |
|---|---|
| `people` | Telegram user → person, nicknames, DM chat id |
| `messages` | raw ingest, group + author + timestamp |
| `commitments` | who, what, to whom, due, status, `source_message_id`, verbatim quote |
| `events` | audit trail of every create/update/close and who caused it |

Every commitment must be traceable back to the original sentence. On stage that is half of the credibility.

### 4. DM digest
Your personal list in a private chat with the bot, with buttons: **Done / Postpone / Not mine**.

This is the moment the agent leaves the group and comes to you. A tap writes straight back into state and is instantly visible on the board.

### 5. Web (Next.js + CopilotKit)
Live board of commitments grouped by person. Next to it a CopilotKit chat that sees the whole group state through `useCopilotReadable` and can act through `useCopilotAction`: close, reassign, change a due date. Commitment cards render as generative UI inside the chat.

This is where you ask the questions you cannot ask in Telegram: *"what was Ondra blocked on last week?"*, *"what did we actually decide about pricing?"*

## What is hard (solve these early)

- **Privacy mode.** By default a Telegram bot in a group only sees commands. Disable it in BotFather or you have no input at all. Do this in the first hour.
- **A bot cannot message first.** DMs only work after a person has sent `/start` to the bot. Onboarding via deep link is part of the product, not a detail.
- **False positives.** "I should probably look at that sometime" is not a commitment. Confidence threshold plus the fixture test below.
- **Mixed-language chat.** Extraction must handle the team's working language, informal spelling and typos, and code-switching into English mid-sentence.

## Testing that pays off

One artifact: a **fixture chat log** of ~60 messages lifted from a real group chat, with hand-labelled expected commitments. The extractor runs against it with a single command.

Without it you will be tuning the prompt blind through live Telegram and lose half the hackathon.

## Split for 5 people

All TypeScript (grammY + Next.js + Supabase), single monorepo, so anyone can reach into anyone's code.

1. **Telegram ingest** — bot, reactions, message storage, identity resolution
2. **Extraction agent** — prompt, diff logic, fixture test
3. **Data + API + realtime** — schema, endpoints, live board updates
4. **Board UI** — Next.js, cards, timeline
5. **CopilotKit** — readable/actions, generative UI, plus demo choreography

## Deliberately NOT doing

No deadline watching or nudges. No Linear/Notion/calendar integrations. No auth beyond a shared link. One group only.

## Demo (90 seconds)

The group has seeded history. The five of you have a live conversation in front of the judges — and on the screen behind you the board fills itself, ✅ reactions appear on messages. Then you hold up your phone, show your personal DM digest, tap **Done**, and the board changes in front of them.
