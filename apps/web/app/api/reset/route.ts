// Wipe the store back to empty.  curl -X POST localhost:3000/api/reset
//
// Use this between rehearsals, and ALWAYS before a live run if you have touched
// /api/seed — the fixture's fake people and messages sit in the same window as
// real ones, and the model will hand a real person's promise to a fixture name.
import { NextResponse } from 'next/server'
import { store } from '@/lib/store'

export async function POST() {
  store.messages.length = 0
  store.people.length = 0
  store.commitments.length = 0
  return NextResponse.json({ ok: true, cleared: true })
}
