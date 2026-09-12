// SEAT 3 owns this file. Returns FAKE DATA until the store is wired —
// seat 4 builds the board against this shape right now.
import { NextResponse } from 'next/server'
import type { Commitment, Person } from '@overheard/types'

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
    what: 'put the deck in front of the client', toWhom: 'Petr',
    due: 'Thursday', status: 'done',
    quote: 'I can take it to them Thursday',
    sourceMessageId: 88, confidence: 0.84,
  },
]

export async function GET() {
  // TODO SEAT 3: swap for the real store.
  return NextResponse.json({ commitments: FAKE_COMMITMENTS, people: FAKE_PEOPLE })
}
