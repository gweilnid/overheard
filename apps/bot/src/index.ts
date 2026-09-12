// SEAT 1 owns this file.
import { Bot } from 'grammy'
import type { IngestMessage } from '@overheard/types'

const WEB_URL = process.env.WEB_URL ?? 'http://localhost:3000'
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!)

// Telegram REJECTS ✅ / ☑️ / ✔️ with REACTION_INVALID — no checkmark exists in
// its reaction set, whatever the design spec says. Verified against the live API.
// ✍️ ("wrote that down") and 🫡 ("noted") both work and suit the product better.
const MARK = '✍️'

bot.on('message:text', async ctx => {
  // Private chats are the DM digest, not group ingest.
  if (ctx.chat.type === 'private') return

  const msg: IngestMessage = {
    messageId: ctx.message.message_id,
    chatId: ctx.chat.id,
    userId: String(ctx.from.id),
    name: ctx.from.first_name ?? ctx.from.username ?? 'unknown',
    text: ctx.message.text,
    ts: ctx.message.date,
  }

  let reactTo: number[] = []
  try {
    const res = await fetch(`${WEB_URL}/api/ingest`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(msg),
    })
    if (!res.ok) throw new Error(`ingest returned ${res.status}`)
    ;({ reactTo } = (await res.json()) as { reactTo: number[] })
  } catch (err) {
    console.error('[ingest]', (err as Error).message)
    return
  }

  for (const id of reactTo) {
    try {
      await ctx.api.setMessageReaction(ctx.chat.id, id, [{ type: 'emoji', emoji: MARK }])
      console.log(`[react] ${MARK} on ${id}`)
    } catch (err) {
      // A failed reaction must never take the bot down mid-demo.
      console.error('[react]', (err as Error).message)
    }
  }
})

// TODO SEAT 1, stretch after the T+1:40 gate:
//   bot.command('me')  -> that person's open commitments + one inline button each
//   bot.on('callback_query:data') -> POST /api/close

// NEVER call ctx.reply() in a group chat. That is the entire product.

// Last line of defence: log and keep polling rather than exit.
bot.catch(err => console.error('[bot]', err.message))

bot.start()
console.log(`bot: long polling started, marking with ${MARK}`)
