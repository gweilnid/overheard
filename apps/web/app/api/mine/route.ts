// Per-person view for the DM digest.  GET /api/mine?userId=123
import { NextResponse } from 'next/server'
import { store } from '@/lib/store'

export async function GET(req: Request) {
  const userId = new URL(req.url).searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  return NextResponse.json({
    commitments: store.commitments.filter(c => c.ownerId === userId && c.status === 'open'),
  })
}
