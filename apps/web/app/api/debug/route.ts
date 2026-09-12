// Debug view of the whole store. Not part of the demo — but when a message does
// not turn into a card, this tells you whether it was even ingested.
//
//   curl -s localhost:3000/api/debug | python3 -m json.tool
//
import { NextResponse } from 'next/server'
import { store } from '@/lib/store'

export async function GET() {
  return NextResponse.json({
    people: store.people,
    commitments: store.commitments,
    messages: store.messages.map(m => ({
      id: m.messageId, from: m.name, text: m.text,
    })),
  })
}
