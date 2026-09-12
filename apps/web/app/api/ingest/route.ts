// SEAT 3 owns this file.
import { NextResponse } from 'next/server'
import type { IngestMessage } from '@overheard/types'
import { addMessage, scheduleExtraction } from '@/lib/store'

export async function POST(req: Request) {
  const msg = (await req.json()) as IngestMessage
  addMessage(msg)

  // Resolves once the 2s debounce fires and extraction finishes. Never rejects.
  const reactTo = await scheduleExtraction()

  return NextResponse.json({ reactTo })
}
