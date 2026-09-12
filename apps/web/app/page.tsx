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

  const ClockIcon = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  )
  const QueryIcon = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.6 2.6 0 1 1 3.2 2.5c-.5.2-.7.6-.7 1.1v.4" />
      <path d="M12 17h.01" />
    </svg>
  )

  return (
    <main>
      <style>{`
        /* Design system: ui-ux-pro-max — Flat Design for a realtime team board.
           No gradients, no shadows; structure comes from borders and spacing. */
        /* Committed to a single light world: this goes on a projector in a lit room,
           and a board people glance at should not depend on the viewer's OS theme.
           Bone ground, ink with a green bias, one pine accent. Status is carried by
           the label and the strike, never by colour alone. */
        :root {
          color-scheme: light;
          --bg:#f0efe9; --card:#fbfaf7; --fg:#191c18; --muted:#e7e6dd; --muted-fg:#5f635b;
          --border:#dedcd2; --border-strong:#c6c4b8;
          --pine:#1d6b53; --pine-soft:#3f8a72; --quiet:#8a8e84; --ring:#1d6b53;
        }

        * { box-sizing:border-box; }
        body { background:var(--bg); }
        main { background:var(--bg); color:var(--fg); min-height:100vh;
               font-family:"Fira Sans",ui-sans-serif,system-ui,sans-serif;
               font-size:16px; line-height:1.5; padding:0 0 72px; }

        /* header ------------------------------------------------------------- */
        .bar { background:var(--card); border-bottom:1px solid var(--border);
               padding:18px 32px; display:flex; align-items:center;
               justify-content:space-between; gap:24px; flex-wrap:wrap; }
        .brand h1 { font-size:22px; font-weight:700; margin:0; letter-spacing:-.01em; }
        .brand p  { margin:2px 0 0; font-size:14px; color:var(--muted-fg); }
        .kpis { display:flex; gap:10px; flex-wrap:wrap; padding-right:72px; }
        .kpi { background:var(--muted); border:1px solid var(--border);
               border-radius:8px; padding:8px 14px; min-width:92px; }
        .kpi b { display:block; font-family:"Fira Code",ui-monospace,monospace;
                 font-size:20px; font-weight:600; line-height:1.2;
                 font-variant-numeric:tabular-nums; }
        .kpi span { font-size:11px; letter-spacing:.06em; text-transform:uppercase;
                    color:var(--muted-fg); }
        .kpi.open b { color:var(--pine); }
        .kpi.settled b { color:var(--quiet); }
        .kpi.feed b { display:flex; align-items:center; gap:7px; }
        .pulse { width:8px; height:8px; border-radius:50%; background:var(--pine); flex:none; }
        .pulse.off { background:var(--muted-fg); }

        /* board -------------------------------------------------------------- */
        .board { padding:26px 32px 0; display:grid; gap:22px;
                 grid-template-columns:repeat(auto-fill,minmax(336px,1fr)); align-items:start; }
        .colhead { display:flex; align-items:center; gap:9px; margin-bottom:12px;
                   padding-bottom:10px; border-bottom:1px solid var(--border-strong); }
        .colhead h2 { font-size:15px; font-weight:600; margin:0; letter-spacing:.01em; }
        .colhead .n { margin-left:auto; font-family:"Fira Code",monospace; font-size:12px;
                      color:var(--muted-fg); font-variant-numeric:tabular-nums; }
        .colhead svg { color:var(--pine); flex:none; }
        .ini { width:24px; height:24px; border-radius:6px; background:var(--muted);
               border:1px solid var(--border); display:grid; place-items:center; flex:none;
               font-family:"Fira Code",monospace; font-size:10px; font-weight:600;
               color:var(--muted-fg); }

        .item { background:var(--card); border:1px solid var(--border); border-radius:8px;
                padding:14px 16px; margin-bottom:10px;
                transition:border-color 180ms ease, background-color 180ms ease; }
        .item:hover { border-color:var(--border-strong); }
        .item.settled { background:var(--muted); }
        .item.settled .title { color:var(--muted-fg); text-decoration:line-through; }

        .title { font-size:16.5px; font-weight:600; line-height:1.35; letter-spacing:-.005em;
                 text-wrap:pretty; }
        .chips { display:flex; gap:6px; margin-top:9px; flex-wrap:wrap; }
        .chip { font-family:"Fira Code",monospace; font-size:11px; line-height:1.6;
                padding:2px 8px; border-radius:5px; border:1px solid var(--border);
                background:var(--muted); color:var(--muted-fg); white-space:nowrap; }
        .chip.due  { border-color:#bcd8cd; color:var(--pine); background:#e6f1ec; }
        .chip.ok   { border-color:var(--border-strong); color:var(--quiet); background:transparent; }
        .chip.time { border-color:#bcd8cd; color:var(--pine); background:#e6f1ec; }
        .said { margin-top:10px; font-size:14px; line-height:1.5; color:var(--muted-fg); }

        .blank { padding:72px 32px; max-width:52ch; }
        .blank h2 { font-size:19px; margin:0 0 8px; font-weight:600; }
        .blank p { margin:0; color:var(--muted-fg); }
        .blank code { font-family:"Fira Code",monospace; font-size:13.5px; color:var(--pine);
                      background:var(--muted); border:1px solid var(--border);
                      padding:2px 7px; border-radius:5px; }

        :focus-visible { outline:2px solid var(--ring); outline-offset:2px; border-radius:4px; }

        /* Stagger on load — 300-450ms, back.out easing, per the motion spec. */
        @media (prefers-reduced-motion: no-preference) {
          .item { animation:rise 380ms cubic-bezier(.2,.9,.3,1.2) both; }
          @keyframes rise { from { opacity:0; transform:translateY(10px) scale(.985); } }
        }

        @media (max-width:1024px) { .board { grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); } }
        @media (max-width:768px)  { .bar { padding:16px 20px; } .board { padding:20px 20px 0; gap:18px; } }
        @media (max-width:420px)  {
          .board { grid-template-columns:1fr; }
          .kpis { padding-right:0; gap:8px; } .kpi { min-width:0; flex:1; padding:7px 10px; }
          .brand h1 { font-size:19px; }
        }
      `}</style>

      <header className="bar">
        <div className="brand">
          <h1>Overheard</h1>
          <p>Promises people made to each other, never typed into anything.</p>
        </div>
        <div className="kpis">
          <div className="kpi open"><b>{open}</b><span>Open</span></div>
          <div className="kpi settled"><b>{commitments.length - open}</b><span>Settled</span></div>
          <div className="kpi feed">
            <b><span className={live ? 'pulse' : 'pulse off'} />{people.length}</b>
            <span>{live ? 'Listening' : 'Offline'}</span>
          </div>
        </div>
      </header>

      {!anything ? (
        <div className="blank">
          <h2>Listening</h2>
          <p>Nothing has been promised yet. Say something in the group you intend to do — <code>I&apos;ll send the deck tomorrow</code></p>
        </div>
      ) : (
        <div className="board">
          {meetings.length > 0 && (
            <section key="__meetings">
              <div className="colhead">
                {ClockIcon}
                <h2>Meetings</h2>
                <span className="n">{meetings.filter(c => c.status === 'open').length} agreed</span>
              </div>
              {meetings.map(c => (
                <article className={c.status === 'done' ? 'item settled' : 'item'} key={c.id}>
                  <div className="title">{c.what}</div>
                  <div className="chips">
                    {c.when && <span className="chip time">{c.when}</span>}
                    {c.status === 'done' && <span className="chip ok">Settled</span>}
                  </div>
                  <p className="said">{c.quote}</p>
                </article>
              ))}
            </section>
          )}

          {withCommitments.map(p => {
            const mine = promises.filter(c => c.ownerId === p.id)
            return (
              <section key={p.id}>
                <div className="colhead">
                  <span className="ini">{initials(p.name)}</span>
                  <h2>{p.name}</h2>
                  <span className="n">{mine.filter(c => c.status === 'open').length} open</span>
                </div>
                {mine.map(c => (
                  <article className={c.status === 'done' ? 'item settled' : 'item'} key={c.id}>
                    <div className="title">{c.what}</div>
                    <div className="chips">
                      {c.due && <span className="chip due">{c.due}</span>}
                      {c.toWhom && <span className="chip">to {c.toWhom}</span>}
                      {c.status === 'done' && <span className="chip ok">Settled</span>}
                    </div>
                    <p className="said">{c.quote}</p>
                  </article>
                ))}
              </section>
            )
          })}

          {orphans.length > 0 && (
            <section key="__orphans">
              <div className="colhead">
                {QueryIcon}
                <h2>Unassigned</h2>
                <span className="n">{orphans.length} open</span>
              </div>
              {orphans.map(c => (
                <article className={c.status === 'done' ? 'item settled' : 'item'} key={c.id}>
                  <div className="title">{c.what}</div>
                  <div className="chips">{c.due && <span className="chip due">{c.due}</span>}</div>
                  <p className="said">{c.quote}</p>
                </article>
              ))}
            </section>
          )}
        </div>
      )}
    </main>
  )
}
