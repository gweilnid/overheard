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

// A stable hue per person, so at four metres you find your own column by colour
// before you have read the name.
function personHue(id: string): string {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 360
  return `hsl(${h} 62% 68%)`
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
        :root {
          color-scheme: dark;
          --ground:#0b0b0d; --surface:#141417; --line:#242429;
          --ink:#f4f3f1; --soft:#9a98a2; --faint:#6b6974;
          --amber:#e8b757; --amber-bg:#2a2317;
          --blue:#7fb3e8;  --blue-bg:#16212e;
          --green:#62c48e; --green-bg:#152219;
        }
        main { padding:38px 44px 80px; font-family:Archivo,ui-sans-serif,system-ui,sans-serif; }

        /* The Copilot launcher floats over the top-right corner; keep the tally clear of it. */
        .top { display:flex; align-items:flex-end; justify-content:space-between; gap:24px;
               flex-wrap:wrap; padding-right:86px; }
        h1 { font-size:46px; font-weight:700; letter-spacing:-.03em; margin:0; line-height:1; }
        .sub { color:var(--faint); margin:10px 0 0; font-size:18px; font-weight:500; }
        .tally { display:flex; gap:30px; align-items:baseline; }
        .stat { text-align:right; }
        .stat b { display:block; font-size:38px; font-weight:700; letter-spacing:-.02em;
                  font-variant-numeric:tabular-nums; line-height:1; }
        .stat span { font-family:"JetBrains Mono",ui-monospace,monospace; font-size:11px;
                     letter-spacing:.16em; text-transform:uppercase; color:var(--faint); }
        .stat.live b { color:var(--amber); }
        .dot { width:8px; height:8px; border-radius:50%; background:var(--green); display:inline-block;
               margin-right:7px; vertical-align:middle; box-shadow:0 0 0 4px rgba(98,196,142,.16); }
        .dot.off { background:#4a4852; box-shadow:none; }

        hr.rule { border:0; border-top:1px solid var(--line); margin:30px 0 34px; }

        .cols { display:grid; grid-template-columns:repeat(auto-fill,minmax(330px,1fr)); gap:34px 30px; align-items:start; }
        .who { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
        .av { width:36px; height:36px; border-radius:50%; display:grid; place-items:center;
              font-size:13px; font-weight:700; letter-spacing:.03em; flex:none;
              background:var(--surface); border:1.5px solid currentColor; }
        .who h2 { font-size:21px; font-weight:600; margin:0; letter-spacing:-.01em; color:var(--ink); }
        .who .n { font-family:"JetBrains Mono",monospace; font-size:11px; letter-spacing:.13em;
                  text-transform:uppercase; color:var(--faint); margin-top:3px; }

        .card { padding:17px 19px 18px; border-radius:12px; background:var(--surface);
                border:1px solid var(--line); margin-bottom:12px; }
        .card.meet { border-color:#223244; background:linear-gradient(var(--blue-bg),var(--surface) 72%); }
        .card.done { background:transparent; border-style:dashed; }
        .card.done .what { color:var(--faint); text-decoration:line-through; text-decoration-thickness:1.5px; }
        .card.done .quote { opacity:.45; }

        .what { font-size:23px; font-weight:600; line-height:1.22; letter-spacing:-.015em; }
        .meta { display:flex; gap:7px; margin-top:11px; flex-wrap:wrap; }
        .pill { font-family:"JetBrains Mono",monospace; font-size:11.5px; letter-spacing:.04em;
                padding:4px 9px; border-radius:6px; background:#1e1e23; color:var(--soft); }
        .pill.due  { background:var(--amber-bg); color:var(--amber); }
        .pill.when { background:var(--blue-bg);  color:var(--blue); }
        .pill.ok   { background:var(--green-bg); color:var(--green); }

        .quote { font-family:Newsreader,Georgia,serif; font-style:italic; font-size:18px;
                 line-height:1.4; color:var(--soft); margin-top:13px; padding-left:14px;
                 border-left:2px solid var(--line); }

        .empty { color:var(--faint); font-size:21px; line-height:1.65; margin-top:46px; font-weight:500; }
        .empty code { font-family:"JetBrains Mono",monospace; font-size:17px; color:var(--amber);
                      background:var(--amber-bg); padding:3px 9px; border-radius:6px; }

        @media (max-width:560px) {
          main { padding:26px 18px 64px; }
          h1 { font-size:34px; } .stat b { font-size:30px; }
          .top { padding-right:0; } .tally { gap:22px; }
          .cols { grid-template-columns:1fr; gap:28px; }
        }
      `}</style>

      <div className="top">
        <div>
          <h1>Overheard</h1>
          <p className="sub">Promises people made to each other, never typed into anything.</p>
        </div>
        <div className="tally">
          <div className="stat live"><b>{open}</b><span>open</span></div>
          <div className="stat"><b>{commitments.length - open}</b><span>done</span></div>
          <div className="stat"><b><span className={live ? 'dot' : 'dot off'} />{people.length}</b><span>listening</span></div>
        </div>
      </div>

      <hr className="rule" />

      {!anything ? (
        <p className="empty">
          Listening.<br />
          Say something in the group you intend to do — <code>I&apos;ll send the deck tomorrow</code>
        </p>
      ) : (
        <div className="cols">
          {meetings.length > 0 && (
            <section key="__meetings">
              <div className="who" style={{ color: 'var(--blue)' }}>
                <div className="av">◷</div>
                <div>
                  <h2>Meetings</h2>
                  <div className="n">{meetings.filter(c => c.status === 'open').length} agreed</div>
                </div>
              </div>
              {meetings.map(c => (
                <article className={c.status === 'done' ? 'card meet done' : 'card meet'} key={c.id}>
                  <div className="what">{c.what}</div>
                  <div className="meta">{c.when && <span className="pill when">{c.when}</span>}</div>
                  <div className="quote">{c.quote}</div>
                </article>
              ))}
            </section>
          )}

          {orphans.length > 0 && (
            <section key="__orphans">
              <div className="who" style={{ color: 'var(--faint)' }}>
                <div className="av">?</div>
                <div>
                  <h2>Unassigned</h2>
                  <div className="n">{orphans.length} open</div>
                </div>
              </div>
              {orphans.map(c => (
                <article className={c.status === 'done' ? 'card done' : 'card'} key={c.id}>
                  <div className="what">{c.what}</div>
                  <div className="meta">{c.due && <span className="pill due">{c.due}</span>}</div>
                  <div className="quote">{c.quote}</div>
                </article>
              ))}
            </section>
          )}

          {withCommitments.map(p => {
            const mine = promises.filter(c => c.ownerId === p.id)
            const openCount = mine.filter(c => c.status === 'open').length
            return (
              <section key={p.id}>
                <div className="who" style={{ color: personHue(p.id) }}>
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
