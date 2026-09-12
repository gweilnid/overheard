// Demo safety net. The store is in-memory, so a Next.js restart empties the
// board. This refills it in one curl instead of replaying the conversation.
//
//   curl -X POST localhost:3000/api/seed
//
// WARNING: the fixture's people and messages are FAKE, and they land in the same
// extraction window as real group traffic. The model will then hand a real
// person's promise to a fixture name. Never leave seeded data in place during a
// live run — POST /api/reset first.
//
import { NextResponse } from 'next/server'
import type { Commitment, IngestMessage, Person } from '@overheard/types'
import { store } from '@/lib/store'
import fixture from '@/fixtures/demo.json'

export async function POST() {
  store.messages = fixture.messages as IngestMessage[]
  store.people = fixture.roster as Person[]
  store.commitments = fixture.seedCommitments as Commitment[]

  return NextResponse.json({
    ok: true,
    messages: store.messages.length,
    people: store.people.length,
    commitments: store.commitments.length,
  })
}
