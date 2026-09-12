// SEAT 1 owns this file.
import { Bot } from 'grammy'
import type { IngestMessage } from '@overheard/types'

const WEB_URL = process.env.WEB_URL ?? 'http://localhost:3000'
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!)

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

  const res = await fetch(`${WEB_URL}/api/ingest`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(msg),
  })
  const { reactTo } = (await res.json()) as { reactTo: number[] }

  for (const id of reactTo) {
    await ctx.api.setMessageReaction(ctx.chat.id, id, [{ type: 'emoji', emoji: '✅' }])
  }
})

// TODO SEAT 1, stretch after the T+1:40 gate:
//   bot.command('me')  -> that person's open commitments + one inline button each
//   bot.on('callback_query:data') -> POST /api/close

// NEVER call ctx.reply() in a group chat. That is the entire product.

bot.start()
console.log('bot: long polling started')
