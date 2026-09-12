import { NextResponse } from 'next/server'
import { store } from '@/lib/store'

type UpdateBody = {
  ownerId?: unknown
  what?: unknown
  toWhom?: unknown
  due?: unknown
}

function isTextOrNull(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && value.trim().length > 0)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const commitment = store.commitments.find(item => item.id === id)
  if (!commitment) {
    return NextResponse.json({ error: 'Commitment not found' }, { status: 404 })
  }

  const body: unknown = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 })
  }

  const update = body as UpdateBody
  const fields = ['ownerId', 'what', 'toWhom', 'due'] as const
  const supplied = fields.filter(field => Object.hasOwn(update, field))
  if (!supplied.length || Object.keys(update).some(field => !fields.includes(field as typeof fields[number]))) {
    return NextResponse.json({ error: 'Provide one or more editable fields only' }, { status: 400 })
  }

  if (Object.hasOwn(update, 'ownerId')) {
    if (commitment.kind === 'meeting' || typeof update.ownerId !== 'string') {
      return NextResponse.json({ error: 'A commitment owner must be a roster person' }, { status: 400 })
    }
    const owner = store.people.find(person => person.id === update.ownerId)
    if (!owner) {
      return NextResponse.json({ error: 'Owner is not in the roster' }, { status: 400 })
    }
    commitment.ownerId = owner.id
    commitment.ownerName = owner.name
  }

  if (Object.hasOwn(update, 'what')) {
    if (typeof update.what !== 'string' || !update.what.trim()) {
      return NextResponse.json({ error: 'What must be a non-empty string' }, { status: 400 })
    }
    commitment.what = update.what.trim()
  }

  if (Object.hasOwn(update, 'toWhom')) {
    if (!isTextOrNull(update.toWhom)) {
      return NextResponse.json({ error: 'toWhom must be text or null' }, { status: 400 })
    }
    commitment.toWhom = update.toWhom === null ? null : update.toWhom.trim()
  }

  if (Object.hasOwn(update, 'due')) {
    if (commitment.kind === 'meeting' || !isTextOrNull(update.due)) {
      return NextResponse.json({ error: 'Due must be text or null for a commitment' }, { status: 400 })
    }
    commitment.due = update.due === null ? null : update.due.trim()
  }

  return NextResponse.json({ commitment })
}
