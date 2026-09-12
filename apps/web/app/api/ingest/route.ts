// SEAT 3 owns this file.
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { IngestMessage } from '@overheard/types'
import { addMessage, scheduleExtraction } from '@/lib/store'

// A malformed message stays in the 25-message window and breaks every extraction
// that sees it, so reject it at the door.
const IngestSchema: z.ZodType<IngestMessage> = z.object({
  messageId: z.number().int(),
  chatId: z.number().int(),
  userId: z.string().min(1),
  name: z.string(),
  text: z.string(),
  ts: z.number(),
})

export async function POST(req: Request) {
  const parsed = IngestSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid IngestMessage' }, { status: 400 })
  }
  addMessage(parsed.data)

  // Resolves once the 2s debounce fires and extraction finishes. Never rejects.
  const reactTo = await scheduleExtraction()

  return NextResponse.json({ reactTo })
}
