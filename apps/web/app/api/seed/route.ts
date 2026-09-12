// Demo safety net. The store is in-memory, so a Next.js restart empties the
// board. This refills it in one curl instead of replaying the conversation.
//
//   curl -X POST localhost:3000/api/seed
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
