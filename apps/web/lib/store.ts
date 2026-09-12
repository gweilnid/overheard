// SEAT 3 owns this file.
// globalThis singleton — a plain module const does NOT survive Next.js dev HMR.

import type { Person, IngestMessage, Commitment, Diff } from '@overheard/types'
import { CONFIDENCE_THRESHOLD } from '@overheard/types'
import { extract } from './extract'

const DEBOUNCE_MS = 2000
const WINDOW = 25

type Store = {
  messages: IngestMessage[]
  people: Person[]
  commitments: Commitment[]
}

type Runtime = {
  timer: ReturnType<typeof setTimeout> | null
  pending: Promise<number[]> | null
  resolve: ((ids: number[]) => void) | null
  running: boolean              // single-flight guard
}

const g = globalThis as unknown as { __overheard?: Store; __overheardRt?: Runtime }

export const store: Store = (g.__overheard ??= {
  messages: [], people: [], commitments: [],
})

const rt: Runtime = (g.__overheardRt ??= {
  timer: null, pending: null, resolve: null, running: false,
})

export function addMessage(m: IngestMessage) {
  store.messages.push(m)
  if (!store.people.find(p => p.id === m.userId)) {
    store.people.push({ id: m.userId, name: m.name })
  }
}

export function applyDiff(diff: Diff): number[] {
  const reactTo: number[] = []

  for (const c of diff.create) {
    // A quiet agent that sometimes stays silent beats a chatty one that is wrong.
    if (c.confidence < CONFIDENCE_THRESHOLD) continue
    store.commitments.push({ ...c, id: crypto.randomUUID(), status: 'open' })
    reactTo.push(c.sourceMessageId)
  }
  for (const u of diff.update) {
    const c = store.commitments.find(x => x.id === u.id)
    if (c) Object.assign(c, u)
  }
  for (const id of diff.close) {
    const c = store.commitments.find(x => x.id === id)
    if (c) c.status = 'done'
  }

  return reactTo
}

/**
 * Debounced, single-flight extraction.
 *
 * Every ingest call resets a 2s timer and awaits the same promise, so a burst of
 * five people typing produces ONE extraction over the whole window rather than
 * five overlapping ones creating duplicate cards on the projector.
 */
export function scheduleExtraction(): Promise<number[]> {
  if (!rt.pending) {
    rt.pending = new Promise<number[]>(res => { rt.resolve = res })
  }
  if (rt.timer) clearTimeout(rt.timer)
  rt.timer = setTimeout(runExtraction, DEBOUNCE_MS)
  return rt.pending
}

async function runExtraction() {
  // Already extracting — come back rather than run a second window alongside it.
  if (rt.running) {
    rt.timer = setTimeout(runExtraction, 250)
    return
  }

  const resolve = rt.resolve
  rt.pending = null
  rt.resolve = null
  rt.timer = null
  if (!resolve) return

  rt.running = true
  try {
    const diff = await extract({
      messages: store.messages.slice(-WINDOW),
      open: store.commitments.filter(c => c.status === 'open'),
      roster: store.people,
    })
    // Seeing the raw diff is the difference between "it did nothing" and
    // "it wanted to do something and we filtered it out".
    console.log('[extract] diff:', JSON.stringify(diff))
    const ids = applyDiff(diff)
    console.log('[extract] reactTo:', ids)
    resolve(ids)
  } catch (err) {
    // extract() rejects the WHOLE diff on any validation failure. On stage a
    // silent miss is survivable; a 500 back to the bot is not.
    console.error('[extract]', (err as Error).message)
    resolve([])
  } finally {
    rt.running = false
  }
}

// Deduplicating marks lives in the BOT, not here. Claiming an id on this side
// marks it done before anyone knows the reaction landed — when it fails, the
// message is silently never marked again. Re-setting an identical reaction is a
// harmless no-op in Telegram, so returning ids more than once costs nothing.
