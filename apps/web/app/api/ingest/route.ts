// SEAT 3 owns this file.
import { NextResponse } from 'next/server'
import type { IngestMessage } from '@overheard/types'
import { addMessage } from '@/lib/store'

export async function POST(req: Request) {
  const msg = (await req.json()) as IngestMessage
  addMessage(msg)

  // TODO SEAT 3: kick the 2s debounce -> extract() -> applyDiff()
  // -> return the source message ids of creates above CONFIDENCE_THRESHOLD.
  return NextResponse.json({ reactTo: [] as number[] })
}
