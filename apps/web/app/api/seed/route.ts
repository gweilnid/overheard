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
  store.people = board.people as Person[]
  store.commitments = board.commitments as Commitment[]

  return NextResponse.json({
    ok: true,
    people: store.people.length,
    commitments: store.commitments.length,
    open: store.commitments.filter(c => c.status === 'open').length,
    messages: store.messages.length,
  })
}
