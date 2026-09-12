// SEAT 3 owns this file.
import { NextResponse } from 'next/server'
import { store } from '@/lib/store'

// No fallback fixture here. It existed so seat 4 could build the board before
// ingest worked, but the store is empty exactly when the demo opens — so it put
// three invented people on the projector before anyone had said a word.
// The board has a real empty state now; use POST /api/seed if you want content.
export async function GET() {
  return NextResponse.json({
    commitments: store.commitments,
    people: store.people,
  })
}
