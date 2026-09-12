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
        /* A ledger, not a dashboard. The product is a written record of things people
           said out loud, so the page is ruled lines and marginal annotation — the
           commitment is the entry, the sentence underneath is the evidence. */
        :root {
          --paper:#eae9e3; --band:#e2e1da; --ink:#14141a; --ink2:#55555e; --ink3:#8a8a92;
          --rule:#c7c6bd; --hair:#d5d4cc; --pen:#b3231c; --ledger:#2f6b4c;
        }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) {
            --paper:#0f0f12; --band:#16161a; --ink:#edece6; --ink2:#a0a0a8; --ink3:#6e6e77;
            --rule:#2b2b31; --hair:#212126; --pen:#e8615a; --ledger:#6fc299;
          }
        }
        :root[data-theme="dark"] {
          --paper:#0f0f12; --band:#16161a; --ink:#edece6; --ink2:#a0a0a8; --ink3:#6e6e77;
          --rule:#2b2b31; --hair:#212126; --pen:#e8615a; --ledger:#6fc299;
        }

        body { background:var(--paper); }
        main { background:var(--paper); color:var(--ink); min-height:100vh;
               font-family:Archivo,ui-sans-serif,system-ui,sans-serif;
               padding:0 0 90px; }

        /* masthead ------------------------------------------------------------ */
        .head { border-bottom:2px solid var(--ink); padding:26px 44px 16px;
                display:flex; align-items:flex-end; justify-content:space-between;
                gap:28px; flex-wrap:wrap; }
        .title { display:flex; align-items:baseline; gap:16px; }
        h1 { font-size:27px; font-weight:700; letter-spacing:-.02em; margin:0; }
        .rubric { font-family:"JetBrains Mono",ui-monospace,monospace; font-size:11px;
                  letter-spacing:.14em; text-transform:uppercase; color:var(--ink3); }
        .figs { display:flex; gap:26px; font-family:"JetBrains Mono",monospace;
                font-size:11px; letter-spacing:.12em; text-transform:uppercase;
                color:var(--ink3); padding-right:76px; }
        .figs b { font-family:Archivo,sans-serif; font-size:22px; font-weight:600;
                  letter-spacing:-.01em; color:var(--ink); display:block;
                  font-variant-numeric:tabular-nums; margin-bottom:1px; }
        .figs .on b { color:var(--pen); }

        /* ledger --------------------------------------------------------------- */
        .sheet { columns:2; column-gap:0; column-rule:1px solid var(--rule); }
        @media (max-width:1100px) { .sheet { columns:1; } }

        .party { break-inside:avoid-column; padding:0 0 4px; }
        .party > h2 {
          font-family:"JetBrains Mono",monospace; font-size:11px; font-weight:500;
          letter-spacing:.2em; text-transform:uppercase; color:var(--ink);
          margin:0; padding:13px 44px 11px; background:var(--band);
          border-bottom:1px solid var(--rule); display:flex; justify-content:space-between;
        }
        .party > h2 em { font-style:normal; color:var(--ink3); letter-spacing:.12em; }

        .entry { display:grid; grid-template-columns:1fr; gap:6px;
                 padding:15px 44px 16px; border-bottom:1px solid var(--hair); }
        .entry:last-child { border-bottom:1px solid var(--rule); }

        .what { font-size:21px; font-weight:600; line-height:1.24; letter-spacing:-.015em;
                text-wrap:balance; }
        .said { font-family:Fraunces,Georgia,serif; font-style:italic;
                font-optical-sizing:auto; font-size:17.5px; line-height:1.38;
                color:var(--ink2); }
        .said::before { content:'\\201C'; } .said::after { content:'\\201D'; }

        .mark { font-family:"JetBrains Mono",monospace; font-size:11px; letter-spacing:.1em;
                text-transform:uppercase; display:flex; gap:16px; flex-wrap:wrap;
                color:var(--ink3); }
        .mark .due { color:var(--pen); }
        .mark .to  { color:var(--ink3); }

        /* struck through, the way you would cross a line out of a real ledger */
        .entry.done .what { color:var(--ink3); text-decoration:line-through;
                            text-decoration-color:var(--pen); text-decoration-thickness:2px; }
        .entry.done .said { color:var(--ink3); opacity:.6; }
        .entry.done .mark { color:var(--ledger); }

        /* meetings read as struck-in headings, not as somebody's debt */
        .party.diary > h2 { color:var(--ink); }
        /* Fixed, not auto: each entry is its own grid, so an auto column makes every
           row start the title at a different x and the left edge goes ragged. */
        .diary .entry { grid-template-columns:152px 1fr; gap:2px 16px; align-items:baseline; }
        .diary .when { font-family:"JetBrains Mono",monospace; font-size:12px;
                       letter-spacing:.06em; color:var(--pen); white-space:nowrap;
                       font-variant-numeric:tabular-nums; }
        .diary .what { grid-column:2; font-size:19px; }
        .diary .said { grid-column:2; }

        .idle { padding:80px 44px; max-width:44ch; }
        .idle p { font-family:Fraunces,Georgia,serif; font-style:italic; font-size:24px;
                  line-height:1.45; color:var(--ink2); margin:0 0 18px; }
        .idle code { font-family:"JetBrains Mono",monospace; font-style:normal;
                     font-size:15px; color:var(--pen); }

        @media (max-width:620px) {
          .head { padding:20px 20px 14px; } .figs { padding-right:0; gap:20px; }
          .party > h2, .entry, .idle { padding-left:20px; padding-right:20px; }
          .what { font-size:19px; } .said { font-size:16.5px; }
          .diary .entry { grid-template-columns:1fr; }
          .diary .what, .diary .said { grid-column:1; }
        }
      `}</style>

      <div className="head">
        <div className="title">
          <h1>Overheard</h1>
          <span className="rubric">promises, as spoken</span>
        </div>
        <div className="figs">
          <div className="on"><b>{open}</b>outstanding</div>
          <div><b>{commitments.length - open}</b>settled</div>
          <div><b>{people.length}</b>{live ? 'listening' : 'offline'}</div>
        </div>
      </div>

      {!anything ? (
        <div className="idle">
          <p>Nothing said yet that anyone has to answer for.</p>
          <p className="rubric" style={{ fontFamily: 'JetBrains Mono, monospace', fontStyle: 'normal', fontSize: 13 }}>
            Say something in the group you intend to do — <code>I&apos;ll send the deck tomorrow</code>
          </p>
        </div>
      ) : (
        <div className="sheet">
          {meetings.length > 0 && (
            <section className="party diary" key="__diary">
              <h2>Diary <em>{meetings.filter(c => c.status === 'open').length} agreed</em></h2>
              {meetings.map(c => (
                <div className={c.status === 'done' ? 'entry done' : 'entry'} key={c.id}>
                  <div className="when">{c.when}</div>
                  <div className="what">{c.what}</div>
                  <div className="said">{c.quote}</div>
                </div>
              ))}
            </section>
          )}

          {withCommitments.map(p => {
            const mine = promises.filter(c => c.ownerId === p.id)
            return (
              <section className="party" key={p.id}>
                <h2>{p.name} <em>{mine.filter(c => c.status === 'open').length} outstanding</em></h2>
                {mine.map(c => (
                  <div className={c.status === 'done' ? 'entry done' : 'entry'} key={c.id}>
                    <div className="what">{c.what}</div>
                    <div className="said">{c.quote}</div>
                    <div className="mark">
                      {c.due && <span className="due">{c.due}</span>}
                      {c.toWhom && <span className="to">to {c.toWhom}</span>}
                      {c.status === 'done' && <span>settled</span>}
                    </div>
                  </div>
                ))}
              </section>
            )
          })}

          {orphans.length > 0 && (
            <section className="party" key="__orphans">
              <h2>Unattributed <em>{orphans.length} outstanding</em></h2>
              {orphans.map(c => (
                <div className={c.status === 'done' ? 'entry done' : 'entry'} key={c.id}>
                  <div className="what">{c.what}</div>
                  <div className="said">{c.quote}</div>
                  <div className="mark">{c.due && <span className="due">{c.due}</span>}</div>
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </main>
  )
}
