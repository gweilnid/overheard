'use client'
// SEAT 4 owns this file.
import { useEffect, useState, useCallback } from 'react'
import { useCopilotReadable, useCopilotAction } from '@copilotkit/react-core'
import type { Commitment, Person } from '@overheard/types'

const POLL_MS = 2000

// `due` is whatever the person actually said — "tonight", "this evening",
// "in a minute". Asked "what is due today", the model matched the literal word
// and reported none, while the board showed several. Bucket it in code instead.
function dueBucket(due: string | null): 'today' | 'tomorrow' | 'this week' | 'later' | 'none' {
  if (!due) return 'none'
  const d = due.toLowerCase()
  if (/\b(today|tonight|this evening|this afternoon|this morning|now|in a minute|in the next|right after|after lunch|before we go|before the demo|at the rehearsal|before the rehearsal)\b/.test(d)) return 'today'
  if (/\btomorrow\b/.test(d)) return 'tomorrow'
  if (/\b(monday|tuesday|wednesday|thursday|friday|this week)\b/.test(d)) return 'this week'
  return 'later'
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function Board() {
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [live, setLive] = useState(false)

  const load = useCallback(() =>
    fetch('/api/commitments')
      .then(r => r.json())
      .then(d => { setCommitments(d.commitments); setPeople(d.people); setLive(true) })
      .catch(() => setLive(false)), [])

  useEffect(() => {
    load()
    const t = setInterval(load, POLL_MS)
    return () => clearInterval(t)
  }, [load])

  // Everything the chat can see. Ids are included so closeCommitment can be used.
  useCopilotReadable({
    description:
      'Every commitment and meeting overheard in the group. kind "commitment" means ' +
      'one person owes something; kind "meeting" is a group event with a time in ' +
      '`when`. `quote` is the verbatim sentence it came from.',
    value: commitments,
  })

  useCopilotReadable({
    description: 'People in the group, by id',
    value: people,
  })

  // Counting 50+ cards by hand is exactly what a model gets wrong — it answered
  // "Mehmet Cem: 5 open" when the board said 6. Hand it the arithmetic already done.
  useCopilotReadable({
    description:
      'Precomputed totals. Use these numbers when asked how many or who has most — ' +
      'do not recount the list yourself.',
    value: {
      totalOpen: commitments.filter(c => c.status === 'open').length,
      totalDone: commitments.filter(c => c.status === 'done').length,
      openPerPerson: people.map(p => ({
        name: p.name,
        open: commitments.filter(c => c.ownerId === p.id && c.status === 'open').length,
      })),
      openMeetings: commitments.filter(c => c.kind === 'meeting' && c.status === 'open').length,
    },
  })

  useCopilotReadable({
    description:
      'Open items already grouped by when they are due. A card\'s `due` is free text ' +
      '("tonight", "this evening", "in a minute"), so for ANY question about what is ' +
      'due today, tomorrow or this week, read these lists — do not match the text ' +
      'yourself. Quote the original `due` wording back to the user.',
    value: (['today', 'tomorrow', 'this week', 'later', 'none'] as const).reduce(
      (acc, bucket) => {
        acc[bucket] = commitments
          .filter(c => c.status === 'open' && dueBucket(c.kind === 'meeting' ? c.when : c.due) === bucket)
          .map(c => ({
            id: c.id,
            kind: c.kind,
            who: c.ownerName || 'the group',
            what: c.what,
            due: c.due ?? c.when,
          }))
        return acc
      },
      {} as Record<string, unknown[]>,
    ),
  })

  useCopilotAction({
    name: 'closeCommitment',
    description: 'Mark a commitment or meeting as done, by its id.',
    parameters: [
      { name: 'id', type: 'string', description: 'The commitment id', required: true },
    ],
    handler: async ({ id }) => {
      const res = await fetch('/api/close', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      await load()
      return res.ok ? 'Closed.' : 'Could not close that one.'
    },
  })

  async function updateCommitment(id: string, update: Record<string, string | null>) {
    const res = await fetch(`/api/commitments/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(update),
    })
    await load()
    return res
  }

  useCopilotAction({
    name: 'reassignCommitment',
    description: 'Assign an open commitment to a person in the roster, using that person\'s exact id.',
    parameters: [
      { name: 'id', type: 'string', description: 'The commitment id', required: true },
      { name: 'ownerId', type: 'string', description: 'The new owner id from the people roster', required: true },
    ],
    handler: async ({ id, ownerId }) => {
      const res = await updateCommitment(id, { ownerId })
      return res.ok ? 'Reassigned.' : 'Could not reassign that commitment.'
    },
  })

  useCopilotAction({
    name: 'changeDueDate',
    description: 'Change a commitment\'s due date using the wording the team agreed on.',
    parameters: [
      { name: 'id', type: 'string', description: 'The commitment id', required: true },
      { name: 'due', type: 'string', description: 'The new due-date wording, for example "Friday afternoon"', required: true },
    ],
    handler: async ({ id, due }) => {
      const res = await updateCommitment(id, { due })
      return res.ok ? 'Due date updated.' : 'Could not update that due date.'
    },
  })

  useCopilotAction({
    name: 'editCommitment',
    description: 'Correct the wording of a commitment or change who it is for. Do not use this to change its owner or due date.',
    parameters: [
      { name: 'id', type: 'string', description: 'The commitment id', required: true },
      { name: 'what', type: 'string', description: 'A short corrected description', required: false },
      { name: 'toWhom', type: 'string', description: 'Who the commitment is for', required: false },
    ],
    handler: async ({ id, what, toWhom }) => {
      const update: Record<string, string | null> = {}
      if (what) update.what = what
      if (toWhom) update.toWhom = toWhom
      if (!Object.keys(update).length) return 'Provide a description or recipient to edit.'

      const res = await updateCommitment(id, update)
      return res.ok ? 'Commitment updated.' : 'Could not update that commitment.'
    },
  })

  const open = commitments.filter(c => c.status === 'open').length
  const meetings = commitments.filter(c => c.kind === 'meeting')
  const promises = commitments.filter(c => c.kind !== 'meeting')
  // ownerId is '' when the model cannot attribute it — without this column those
  // cards exist in the store and appear nowhere on screen.
  const orphans = promises.filter(c => !people.some(p => p.id === c.ownerId))
  const withCommitments = people.filter(p => promises.some(c => c.ownerId === p.id))
  const anything = meetings.length || promises.length

  return (
    <main>
      <style>{`
        :root { color-scheme: dark; }
        main { padding: 40px 48px 64px; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; }
        .top { display:flex; align-items:baseline; gap:20px; margin-bottom:8px; }
        h1 { font-size:44px; letter-spacing:-.02em; margin:0; font-weight:650; }
        .sub { font-size:19px; color:#7c7c86; margin:0 0 36px; }
        .dot { width:9px; height:9px; border-radius:50%; display:inline-block; margin-right:8px;
               background:#39d98a; box-shadow:0 0 0 4px rgba(57,217,138,.15); }
        .dot.off { background:#5a5a63; box-shadow:none; }
        .count { font-size:19px; color:#a0a0aa; }
        .cols { display:flex; gap:28px; align-items:flex-start; flex-wrap:wrap; }
        .col { flex:1 1 340px; min-width:320px; max-width:460px; }
        .who { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
        .av { width:38px; height:38px; border-radius:50%; background:#26262c; color:#c8c8d2;
              display:grid; place-items:center; font-size:15px; font-weight:600; letter-spacing:.02em; }
        .who h2 { font-size:22px; margin:0; font-weight:600; }
        .who .n { font-size:15px; color:#6f6f79; }
        .card { background:#17171b; border:1px solid #232329; border-radius:14px;
                padding:18px 20px; margin-bottom:14px; transition:opacity .25s; }
        .card.done { opacity:.4; }
        .what { font-size:22px; line-height:1.3; font-weight:550; }
        .card.done .what { text-decoration:line-through; }
        .meta { display:flex; gap:8px; margin-top:12px; flex-wrap:wrap; }
        .pill { font-size:14px; padding:4px 11px; border-radius:999px; background:#26262c; color:#b4b4c0; }
        .pill.due { background:#2a2418; color:#e0b661; }
        .pill.ok  { background:#18251d; color:#5fbf8a; }
        .pill.when{ background:#1b2430; color:#74aee0; }
        .av.meet  { background:#1b2430; color:#74aee0; font-size:19px; }
        .card.meet{ border-color:#24303d; }
        .quote { margin-top:14px; padding-left:13px; border-left:2px solid #2e2e36;
                 font-size:16px; line-height:1.45; color:#83838f; font-style:italic; }
        .empty { color:#5a5a63; font-size:20px; margin-top:40px; line-height:1.6; }
        .empty code { background:#17171b; padding:3px 8px; border-radius:6px; font-size:17px; }
      `}</style>

      <div className="top">
        <h1>Overheard</h1>
        <span className="count">
          <span className={live ? 'dot' : 'dot off'} />
          {open} open
        </span>
      </div>
      <p className="sub">Promises people made to each other, never typed into anything.</p>

      {!anything ? (
        <p className="empty">
          Listening.<br />
          Say something in the group you intend to do — <code>I&apos;ll send the deck tomorrow</code>
        </p>
      ) : (
        <div className="cols">
          {meetings.length > 0 && (
            <section className="col" key="__meetings">
              <div className="who">
                <div className="av meet">◷</div>
                <div>
                  <h2>Meetings</h2>
                  <div className="n">{meetings.length} agreed</div>
                </div>
              </div>
              {meetings.map(c => (
                <article className={c.status === 'done' ? 'card meet done' : 'card meet'} key={c.id}>
                  <div className="what">{c.what}</div>
                  <div className="meta">
                    {c.when && <span className="pill when">{c.when}</span>}
                  </div>
                  <div className="quote">{c.quote}</div>
                </article>
              ))}
            </section>
          )}

          {orphans.length > 0 && (
            <section className="col" key="__orphans">
              <div className="who">
                <div className="av">?</div>
                <div>
                  <h2>Unassigned</h2>
                  <div className="n">{orphans.length} open</div>
                </div>
              </div>
              {orphans.map(c => (
                <article className={c.status === 'done' ? 'card done' : 'card'} key={c.id}>
                  <div className="what">{c.what}</div>
                  <div className="meta">
                    {c.due && <span className="pill due">{c.due}</span>}
                  </div>
                  <div className="quote">{c.quote}</div>
                </article>
              ))}
            </section>
          )}

          {withCommitments.map(p => {
            const mine = promises.filter(c => c.ownerId === p.id)
            const openCount = mine.filter(c => c.status === 'open').length
            return (
              <section className="col" key={p.id}>
                <div className="who">
                  <div className="av">{initials(p.name)}</div>
                  <div>
                    <h2>{p.name}</h2>
                    <div className="n">{openCount} open</div>
                  </div>
                </div>
                {mine.map(c => (
                  <article className={c.status === 'done' ? 'card done' : 'card'} key={c.id}>
                    <div className="what">{c.what}</div>
                    <div className="meta">
                      {c.due && <span className="pill due">{c.due}</span>}
                      {c.toWhom && <span className="pill">to {c.toWhom}</span>}
                      {c.status === 'done' && <span className="pill ok">done</span>}
                    </div>
                    <div className="quote">{c.quote}</div>
                  </article>
                ))}
              </section>
            )
          })}
        </div>
      )}
    </main>
  )
}
