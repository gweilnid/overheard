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
  reacted: Set<number>          // message ids we have already put a ✅ on
}

type Runtime = {
  timer: ReturnType<typeof setTimeout> | null
  pending: Promise<number[]> | null
  resolve: ((ids: number[]) => void) | null
  running: boolean              // single-flight guard
}

const g = globalThis as unknown as { __overheard?: Store; __overheardRt?: Runtime }

export const store: Store = (g.__overheard ??= {
  messages: [], people: [], commitments: [], reacted: new Set(),
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
  // Includes done commitments: a closed one is no longer sent as `open`, but its
  // source message is still in the window, so the model would recreate the card.
  const known = new Set(store.commitments.map(c => c.sourceMessageId))

  for (const c of diff.create) {
    // A quiet agent that sometimes stays silent beats a chatty one that is wrong.
    if (c.confidence < CONFIDENCE_THRESHOLD) continue
    if (known.has(c.sourceMessageId)) continue
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
    resolve(applyDiff(diff))
  } catch (err) {
    // extract() rejects the WHOLE diff on any validation failure. On stage a
    // silent miss is survivable; a 500 back to the bot is not.
    console.error('[extract]', (err as Error).message)
    resolve([])
  } finally {
    rt.running = false
  }
}

/** Claim reaction ids so a burst of ingest calls does not re-react to the same message. */
export function claimReactions(ids: number[]): number[] {
  const fresh = ids.filter(id => !store.reacted.has(id))
  for (const id of fresh) store.reacted.add(id)
  return fresh
}
