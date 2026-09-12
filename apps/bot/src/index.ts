// SEAT 1 owns this file.
import { Bot, InlineKeyboard } from 'grammy'
import type { Commitment, IngestMessage } from '@overheard/types'

const WEB_URL = process.env.WEB_URL ?? 'http://localhost:3000'
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!)

// Telegram REJECTS ✅ / ☑️ / ✔️ with REACTION_INVALID — no checkmark exists in
// its reaction set, whatever the design spec says. Verified against the live API.
// ✍️ ("wrote that down") and 🫡 ("noted") both work and suit the product better.
const MARK = '✍️'

// Only ever records a mark that actually landed, so a failed reaction is retried
// on the next window instead of being lost forever.
const marked = new Set<number>()

// ------------------------------------------------------------------ DM digest

async function mine(userId: string): Promise<Commitment[]> {
  const res = await fetch(`${WEB_URL}/api/mine?userId=${encodeURIComponent(userId)}`)
  if (!res.ok) throw new Error(`mine returned ${res.status}`)
  return ((await res.json()) as { commitments: Commitment[] }).commitments
}

function render(list: Commitment[]) {
  if (!list.length) {
    return { text: 'Nothing on you right now.', keyboard: new InlineKeyboard() }
  }

  const lines = list.map((c, i) => {
    const due = c.due ? ` — ${c.due}` : ''
    const to = c.toWhom ? ` (to ${c.toWhom})` : ''
    return `${i + 1}. ${c.what}${due}${to}\n   “${c.quote}”`
  })

  const keyboard = new InlineKeyboard()
  list.forEach((c, i) => keyboard.text(`Done: ${i + 1}`, `done:${c.id}`).row())

  const n = list.length
  return {
    text: `You're on the hook for ${n} thing${n === 1 ? '' : 's'}:\n\n${lines.join('\n\n')}`,
    keyboard,
  }
}

bot.use(async (ctx, next) => {
  if (ctx.chat?.type === 'private') {
    console.log(`[dm] ${ctx.from?.first_name}: ${ctx.message?.text ?? ctx.callbackQuery?.data ?? '?'}`)
  }
  await next()
})

async function showDigest(ctx: Parameters<Parameters<typeof bot.command>[1]>[0]) {
  try {
    const { text, keyboard } = render(await mine(String(ctx.from!.id)))
    await ctx.reply(text, { reply_markup: keyboard })
  } catch (err) {
    console.error('[digest]', (err as Error).message)
    await ctx.reply('Could not reach the board just now.')
  }
}

bot.command('start', async ctx => {
  if (ctx.chat.type !== 'private') return
  await ctx.reply("I listen in the group and keep track of what you promise. Send /me any time.")
  await showDigest(ctx)
})

bot.command('me', async ctx => {
  if (ctx.chat.type !== 'private') return   // never speak in the group
  await showDigest(ctx)
})

bot.on('callback_query:data', async ctx => {
  const [action, id] = ctx.callbackQuery.data.split(':')
  if (action !== 'done') return ctx.answerCallbackQuery()

  try {
    await fetch(`${WEB_URL}/api/close`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await ctx.answerCallbackQuery({ text: 'Done ✍️' })

    const { text, keyboard } = render(await mine(String(ctx.from.id)))
    await ctx.editMessageText(text, { reply_markup: keyboard })
    console.log(`[done] ${id} by ${ctx.from.first_name}`)
  } catch (err) {
    console.error('[done]', (err as Error).message)
    await ctx.answerCallbackQuery({ text: 'Could not update' })
  }
})

// ---------------------------------------------------------------- group ingest

bot.on('message:text', async ctx => {
  if (ctx.chat.type === 'private') return   // already handled by the digest above

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
    if (marked.has(id)) continue
    try {
      await ctx.api.setMessageReaction(ctx.chat.id, id, [{ type: 'emoji', emoji: MARK }])
      marked.add(id)
      console.log(`[react] ${MARK} on ${id}`)
    } catch (err) {
      // A failed reaction must never take the bot down mid-demo.
      console.error('[react]', (err as Error).message)
    }
  }
})

// NEVER call ctx.reply() in a group chat. That is the entire product.

// Last line of defence: log and keep polling rather than exit.
bot.catch(err => console.error('[bot]', err.message))

// Without this the commands never appear in Telegram's menu or autocomplete.
// Private scope only — the bot must not advertise itself inside the group.
await bot.api.setMyCommands(
  [
    { command: 'me', description: 'What I owe people' },
    { command: 'start', description: 'Start here' },
  ],
  { scope: { type: 'all_private_chats' } },
)

bot.start()
console.log(`bot: long polling started, marking with ${MARK}`)
