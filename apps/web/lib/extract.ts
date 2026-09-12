// SEAT 2 owns this file. Start here — you need nobody else.

import type { Person, IngestMessage, Commitment, Diff } from '@overheard/types'

export async function extract(input: {
  messages: IngestMessage[]   // last 25
  open: Commitment[]          // currently open commitments
  roster: Person[]            // everyone seen in the group
}): Promise<Diff> {
  // TODO SEAT 2: replace this stub.
  //
  // Use client.messages.parse() with zodOutputFormat(DiffSchema),
  // model 'claude-opus-5'. Keep this signature — it is the swap point
  // if the credits turn out to be with another provider.
  //
  // The prompt must say: return a DIFF, never a fresh list.
  //   - "yeah I'll do it" binds to what was discussed 5 messages earlier
  //   - "actually Ondra is taking that" -> update, do not create
  //   - "done, deployed" -> close
  //   - ownerId MUST come from the roster, or be ''
  //   - "we should look at that sometime" is NOT a commitment
  void input
  return { create: [], update: [], close: [] }
}
