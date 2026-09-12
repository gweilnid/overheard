// SEAT 2 owns this file. Start here — you need nobody else, just the API key.
//
// The plumbing below works. Your job is the PROMPT, and tuning it against
// `npm run eval` until the fixture passes.

import type { Person, IngestMessage, Commitment, Diff } from '@overheard/types'
import { llm, MODEL, REQUIRE_STRUCTURED } from './llm'

const DIFF_SCHEMA = {
  name: 'commitment_diff',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['create', 'update', 'close'],
    properties: {
      create: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['ownerId', 'ownerName', 'what', 'toWhom', 'due',
                     'quote', 'sourceMessageId', 'confidence'],
          properties: {
            ownerId: { type: 'string', description: 'MUST be an id from the roster, or "" if unclear' },
            ownerName: { type: 'string' },
            what: { type: 'string', description: 'short and imperative: "send the pricing numbers"' },
            toWhom: { type: ['string', 'null'] },
            due: { type: ['string', 'null'], description: 'free text as spoken: "tomorrow morning"' },
            quote: { type: 'string', description: 'VERBATIM text of the source message' },
            sourceMessageId: { type: 'integer', description: 'the message the promise was made in' },
            confidence: { type: 'number' },
          },
        },
      },
      update: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'ownerId', 'ownerName', 'what', 'toWhom', 'due'],
          properties: {
            id: { type: 'string' },
            // null means "leave unchanged" — nulls are stripped below.
            ownerId: { type: ['string', 'null'] },
            ownerName: { type: ['string', 'null'] },
            what: { type: ['string', 'null'] },
            toWhom: { type: ['string', 'null'] },
            due: { type: ['string', 'null'] },
          },
        },
      },
      close: {
        type: 'array',
        items: { type: 'string', description: 'id of a commitment that is now finished' },
      },
    },
  },
} as const

export async function extract(input: {
  messages: IngestMessage[]   // last 25
  open: Commitment[]          // currently open commitments
  roster: Person[]            // everyone seen in the group
}): Promise<Diff> {
  // TODO SEAT 2: this prompt is a starting point, not the finished thing.
  // Tune it with `npm run eval` until the fixture passes.
  //
  // The rules that matter:
  //   - "yeah I'll do it" binds to what was discussed several messages earlier
  //   - "actually Ondra is taking that" -> update, NOT a new create
  //   - "done, deployed" -> close
  //   - ownerId must come from the roster, or be ""
  //   - "we should look at that sometime" is NOT a commitment
  const prompt = [
    'You are watching a team chat and tracking the promises people make to each other.',
    '',
    'People in this group:',
    ...input.roster.map(p => `  id=${p.id} ${p.name}`),
    '',
    'Commitments already tracked:',
    ...(input.open.length
      ? input.open.map(c => `  id=${c.id} ${c.ownerName}: ${c.what}${c.due ? ` (${c.due})` : ''}`)
      : ['  (none)']),
    '',
    'Recent messages:',
    ...input.messages.map(m => `  [${m.messageId}] ${m.name}: ${m.text}`),
    '',
    'Return a DIFF against the tracked list, never a fresh list.',
    'Only create a commitment when someone genuinely commits to doing something.',
    'Vague intentions ("we should look at that sometime") are not commitments.',
    'Set confidence below 0.7 if you are unsure — we would rather stay silent.',
  ].join('\n')

  const res = await llm.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_schema', json_schema: DIFF_SCHEMA },
    ...REQUIRE_STRUCTURED,
  } as Parameters<typeof llm.chat.completions.create>[0])

  const raw = (res as any).choices?.[0]?.message?.content
  if (!raw) return { create: [], update: [], close: [] }

  const parsed = JSON.parse(raw) as Diff

  // Strip the nulls the schema forced us to require on `update`.
  parsed.update = parsed.update.map(u =>
    Object.fromEntries(Object.entries(u).filter(([, v]) => v !== null)) as Diff['update'][number]
  )

  return parsed
}
