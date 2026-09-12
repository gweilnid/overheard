// SEAT 3 owns this file.
import { NextResponse } from 'next/server'
import type { IngestMessage } from '@overheard/types'
import { addMessage } from '@/lib/store'

export async function POST(req: Request) {
  const msg = (await req.json()) as IngestMessage
  addMessage(msg)

  // TODO SEAT 3: kick the 2s debounce -> extract() -> applyDiff()
  // -> return the source message ids of creates above CONFIDENCE_THRESHOLD.
  //
  // extract() THROWS on a validation failure (bad quote, unknown owner, unknown
  // commitment id) and rejects the whole diff, not just the bad item. Wrap every
  // call in try/catch and return `{ reactTo: [] }` on failure. A silent miss is
  // recoverable on stage; a 500 from the bot's ingest call is not.
  return NextResponse.json({ reactTo: [] as number[] })
}
