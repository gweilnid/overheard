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

  // Tile span encodes volume: whoever is carrying the most gets the most room.
  // The threshold sits above the median on purpose — if every tile is wide, the
  // grid is just two ragged columns with a dead strip down the right.
  const spanFor = (n: number) => (n >= 9 ? 'span 2' : 'span 1')

  const Tile = ({
    label, count, unit, span, accent, children,
  }: {
    label: string; count: number; unit: string; span: string
    accent?: boolean; children: React.ReactNode
  }) => (
    <section className="tile" style={{ gridColumn: span }}>
      <header className="tilehead">
        <h2 className={accent ? 'accent' : undefined}>{label}</h2>
        <span className="n">{count} {unit}</span>
      </header>
      <div className="rows">{children}</div>
    </section>
  )

  const Row = ({ c }: { c: Commitment }) => (
    <article className={c.status === 'done' ? 'row done' : 'row'}>
      <p className="what">{c.what}</p>
      <div className="tags">
        {c.kind === 'meeting' && c.when && <span className="tag hot">{c.when}</span>}
        {c.kind !== 'meeting' && c.due && <span className="tag hot">{c.due}</span>}
        {c.toWhom && <span className="tag">→ {c.toWhom}</span>}
        {c.status === 'done' && <span className="tag muted">settled</span>}
      </div>
      <p className="said">{c.quote}</p>
    </article>
  )

  return (
    <main>
      <style>{`
        /* Bento Box Grid (ui-ux-pro-max #39): modular tiles, asymmetric spans,
           generous radius, soft shadows, neutral ground with one accent.
           Monochrome apart from a single vermilion — kept for what is owed now. */
        :root {
          color-scheme: light;
          --page:#f1f1f4; --tile:#ffffff; --ink:#111114; --ink2:#6a6a74; --ink3:#a2a2ac;
          --hair:#ebebf0; --hot:#f5401d; --hot-bg:#fff0ec;
          --r:22px; --gap:14px;
          --lift:0 1px 2px rgba(17,17,20,.05), 0 10px 28px -12px rgba(17,17,20,.14);
        }
        * { box-sizing:border-box; }
        body { background:var(--page); }
        main { background:var(--page); color:var(--ink); min-height:100vh;
               font-family:"DM Sans",ui-sans-serif,system-ui,sans-serif;
               padding:22px 22px 70px; font-size:15px; }

        /* dense lets a narrow tile backfill the hole a wide one leaves at a row end */
        .grid { display:grid; gap:var(--gap); grid-auto-flow:dense; align-items:start;
                grid-template-columns:repeat(auto-fill,minmax(272px,1fr)); }

        /* masthead + figures occupy the first row of the same grid */
        .brand { grid-column:span 2; background:var(--ink); color:var(--tile);
                 border-radius:var(--r); padding:24px 26px; display:flex;
                 flex-direction:column; justify-content:space-between; min-height:132px; }
        .brand h1 { font-size:31px; font-weight:700; letter-spacing:-.035em; margin:0; }
        .brand p { margin:10px 0 0; font-size:14.5px; line-height:1.45; color:#a9a9b4; max-width:34ch; }

        .fig { background:var(--tile); border-radius:var(--r); padding:22px 24px;
               min-height:132px; display:flex; flex-direction:column; justify-content:space-between;
               box-shadow:var(--lift); }
        .fig b { font-size:46px; font-weight:700; letter-spacing:-.045em; line-height:1;
                 font-variant-numeric:tabular-nums; }
        .fig.now b { color:var(--hot); }
        .fig span { font-family:"DM Mono",ui-monospace,monospace; font-size:11px;
                    letter-spacing:.11em; text-transform:uppercase; color:var(--ink3); }
        .fig .live { display:inline-flex; align-items:center; gap:7px; }
        .pip { width:7px; height:7px; border-radius:50%; background:var(--hot); }
        .pip.off { background:var(--ink3); }

        .tile { background:var(--tile); border-radius:var(--r); padding:18px 20px 6px;
                box-shadow:var(--lift); }
        .tilehead { display:flex; align-items:baseline; justify-content:space-between;
                    gap:12px; padding-bottom:13px; }
        .tilehead h2 { font-size:16.5px; font-weight:600; margin:0; letter-spacing:-.015em; }
        .tilehead h2.accent { color:var(--hot); }
        .tilehead .n { font-family:"DM Mono",monospace; font-size:11px; color:var(--ink3);
                       letter-spacing:.05em; white-space:nowrap; }

        .rows { display:flex; flex-direction:column; }
        .row { padding:13px 0; border-top:1px solid var(--hair); }
        .what { font-size:16px; font-weight:500; line-height:1.32; margin:0;
                letter-spacing:-.01em; text-wrap:pretty; }
        .tags { display:flex; gap:6px; flex-wrap:wrap; margin-top:8px; }
        .tag { font-family:"DM Mono",monospace; font-size:10.5px; letter-spacing:.03em;
               padding:3px 7px; border-radius:6px; background:#f4f4f7; color:var(--ink2); }
        .tag.hot { background:var(--hot-bg); color:var(--hot); }
        .tag.muted { background:transparent; color:var(--ink3); padding-left:0; }
        .said { margin:9px 0 0; font-size:13.5px; line-height:1.45; color:var(--ink3); }

        .row.done .what { color:var(--ink3); text-decoration:line-through; }
        .row.done .said { opacity:.65; }

        .blank { grid-column:1/-1; background:var(--tile); border-radius:var(--r);
                 padding:52px 34px; box-shadow:var(--lift); }
        .blank h2 { margin:0 0 8px; font-size:20px; font-weight:600; letter-spacing:-.02em; }
        .blank p { margin:0; color:var(--ink2); max-width:50ch; }
        .blank code { font-family:"DM Mono",monospace; font-size:13px; color:var(--hot);
                      background:var(--hot-bg); padding:2px 7px; border-radius:6px; }

        :focus-visible { outline:2px solid var(--hot); outline-offset:3px; border-radius:8px; }
        @media (prefers-reduced-motion:no-preference) {
          .tile,.fig,.brand { animation:pop 420ms cubic-bezier(.2,.8,.3,1.05) both; }
          @keyframes pop { from { opacity:0; transform:translateY(12px); } }
        }
        @media (max-width:720px) {
          main { padding:14px 14px 56px; }
          .brand { grid-column:1/-1; min-height:0; } .fig { min-height:0; }
          .fig b { font-size:36px; }
        }
      `}</style>

      <div className="grid">
        <div className="brand">
          <h1>Overheard</h1>
          <p>Promises people made to each other, never typed into anything.</p>
        </div>
        <div className="fig now"><b>{open}</b><span>Outstanding</span></div>
        <div className="fig"><b>{commitments.length - open}</b><span>Settled</span></div>
        <div className="fig">
          <b>{people.length}</b>
          <span className="live"><i className={live ? 'pip' : 'pip off'} />{live ? 'Listening' : 'Offline'}</span>
        </div>

        {!anything ? (
          <div className="blank">
            <h2>Listening</h2>
            <p>Nothing promised yet. Say something in the group you intend to do — <code>I&apos;ll send the deck tomorrow</code></p>
          </div>
        ) : (
          <>
            {meetings.length > 0 && (
              <Tile label="Meetings" count={meetings.filter(c => c.status === 'open').length}
                    unit="agreed" span={spanFor(meetings.length)} accent>
                {meetings.map(c => <Row c={c} key={c.id} />)}
              </Tile>
            )}

            {withCommitments.map(p => {
              const mine = promises.filter(c => c.ownerId === p.id)
              return (
                <Tile key={p.id} label={p.name} unit="outstanding"
                      count={mine.filter(c => c.status === 'open').length}
                      span={spanFor(mine.length)}>
                  {mine.map(c => <Row c={c} key={c.id} />)}
                </Tile>
              )
            })}

            {orphans.length > 0 && (
              <Tile label="Unassigned" count={orphans.length} unit="open" span={spanFor(orphans.length)}>
                {orphans.map(c => <Row c={c} key={c.id} />)}
              </Tile>
            )}
          </>
        )}
      </div>
    </main>
  )
}
