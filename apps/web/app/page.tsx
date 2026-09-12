'use client'
// SEAT 4 owns this file.
import { useEffect, useState } from 'react'
import type { Commitment, Person } from '@overheard/types'

const POLL_MS = 2000

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function Board() {
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [live, setLive] = useState(false)

  useEffect(() => {
    const load = () =>
      fetch('/api/commitments')
        .then(r => r.json())
        .then(d => { setCommitments(d.commitments); setPeople(d.people); setLive(true) })
        .catch(() => setLive(false))
    load()
    const t = setInterval(load, POLL_MS)
    return () => clearInterval(t)
  }, [])

  const open = commitments.filter(c => c.status === 'open').length
  const withCommitments = people.filter(p => commitments.some(c => c.ownerId === p.id))

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

      {!withCommitments.length ? (
        <p className="empty">
          Listening.<br />
          Say something in the group you intend to do — <code>I&apos;ll send the deck tomorrow</code>
        </p>
      ) : (
        <div className="cols">
          {withCommitments.map(p => {
            const mine = commitments.filter(c => c.ownerId === p.id)
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
