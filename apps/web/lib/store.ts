// SEAT 3 owns this file.
// globalThis singleton — a plain module const does NOT survive Next.js dev HMR.

import type { Person, IngestMessage, Commitment, Diff } from '@overheard/types'

type Store = {
  messages: IngestMessage[]
  people: Person[]
  commitments: Commitment[]
}

const g = globalThis as unknown as { __overheard?: Store }

export const store: Store = (g.__overheard ??= {
  messages: [],
  people: [],
  commitments: [],
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

// TODO SEAT 3: debounce (2s) + single-flight guard live here.
// Five people typing at once must NOT run two overlapping extraction windows.
