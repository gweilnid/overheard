// Demo safety net and populated board.  curl -X POST localhost:3000/api/seed
//
// The store is in-memory, so a Next.js restart empties the board. This refills
// it from fixtures/board.json — 52 commitments and meetings across the team,
// enough that asking the Copilot "what is due before Thursday" is a real
// question rather than something you can read off the screen in one glance.
//
// It deliberately loads NO messages. Seeded messages sit in the same 25-message
// extraction window as real group traffic and the model hands a real person's
// promise to a fixture name — that is what emptied a real /me digest earlier.
import { NextResponse } from 'next/server'
import type { Commitment, Person } from '@overheard/types'
import { store } from '@/lib/store'
import board from '@/fixtures/board.json'

export async function POST() {
  // Merge, never replace. The run sheet says to seed right before going on, and
  // replacing the array deletes every card the group has already earned — we lost
  // a real one that way. Anything not from the fixture survives.
  const seeded = board.commitments as Commitment[]
  const seededIds = new Set(seeded.map(c => c.id))
  const live = store.commitments.filter(c => !seededIds.has(c.id))
  store.commitments = [...seeded, ...live]

  const known = new Set(store.people.map(p => p.id))
  store.people = [...(board.people as Person[]), ...store.people.filter(p => !known.has(p.id) || false)]
  const seen = new Set<string>()
  store.people = store.people.filter(p => (seen.has(p.id) ? false : (seen.add(p.id), true)))

  return NextResponse.json({
    ok: true,
    people: store.people.length,
    commitments: store.commitments.length,
    kept: live.length,
    open: store.commitments.filter(c => c.status === 'open').length,
    messages: store.messages.length,
  })
}
