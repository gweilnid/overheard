// SEAT 3 owns this file.
import { NextResponse } from 'next/server'
import { store } from '@/lib/store'

export async function POST(req: Request) {
  const { id } = (await req.json()) as { id: string }
  const c = store.commitments.find(x => x.id === id)
  if (c) c.status = 'done'
  return NextResponse.json({ ok: true })
}
