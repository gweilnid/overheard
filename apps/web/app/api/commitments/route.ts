// SEAT 3 owns this file.
// Serves the real store once it has anything in it, and falls back to fake data
// while it is empty — so Seat 4 can build the board before ingest works.
import { NextResponse } from 'next/server'
import type { Commitment, Person } from '@overheard/types'
import { store } from '@/lib/store'

const FAKE_PEOPLE: Person[] = [
  { id: '1', name: 'Petr' },
  { id: '2', name: 'Jana' },
  { id: '3', name: 'Ondra' },
]

const FAKE_COMMITMENTS: Commitment[] = [
  {
    id: 'c1', ownerId: '3', ownerName: 'Ondra',
    what: 'send the pricing numbers to Jana', toWhom: 'Jana',
    due: 'tomorrow morning', status: 'open',
    quote: "yeah I'll send them over tomorrow morning",
    sourceMessageId: 103, confidence: 0.91,
  },
  {
    id: 'c2', ownerId: '2', ownerName: 'Jana',
    what: 'walk the client through the deck', toWhom: 'Petr',
    due: 'Thursday', status: 'done',
    quote: 'I can take it to them Thursday',
    sourceMessageId: 88, confidence: 0.84,
  },
]

export async function GET() {
  const isEmpty = store.commitments.length === 0 && store.people.length === 0
  if (isEmpty) {
    return NextResponse.json({ commitments: FAKE_COMMITMENTS, people: FAKE_PEOPLE })
  }
  return NextResponse.json({ commitments: store.commitments, people: store.people })
}
