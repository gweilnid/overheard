// THE FROZEN CONTRACT. Do not change after T+0:20 without telling everyone.

export type Person = {
  id: string          // telegram user id, stringified
  name: string
  dmChatId?: number   // set once the person DMs the bot
}

export type IngestMessage = {
  messageId: number
  chatId: number
  userId: string
  name: string
  text: string
  ts: number          // unix seconds
}

// 'commitment' — one person owes something to someone.
// 'meeting'    — the group agreed to meet. No single owner; `when` carries the
//                time as spoken. Filing these as commitments makes a meeting
//                look like a debt one person owes.
export type Kind = 'commitment' | 'meeting'

export type Commitment = {
  id: string
  kind: Kind
  ownerId: string     // MUST be a Person.id from the roster, or '' (meetings, unknown)
  ownerName: string
  what: string        // short, imperative: "send the pricing numbers"
  toWhom: string | null
  due: string | null  // free text as spoken: "tomorrow morning"
  when: string | null // meetings only: "Tuesday 15:00", "15.9. at 10"
  status: 'open' | 'done'
  quote: string       // VERBATIM from the source message
  sourceMessageId: number
  confidence: number  // 0..1
}

export type Diff = {
  create: Omit<Commitment, 'id' | 'status'>[]
  update: ({ id: string } & Partial<Pick<Commitment,
    'ownerId' | 'ownerName' | 'what' | 'toWhom' | 'due'>>)[]
  close: string[]     // commitment ids
}

export const CONFIDENCE_THRESHOLD = 0.7
