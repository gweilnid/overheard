'use client'
// SEAT 4 owns this file.
import { useEffect, useState } from 'react'
import type { Commitment, Person } from '@overheard/types'

export default function Board() {
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [people, setPeople] = useState<Person[]>([])

  useEffect(() => {
    const load = () =>
      fetch('/api/commitments')
        .then(r => r.json())
        .then(d => { setCommitments(d.commitments); setPeople(d.people) })
        .catch(() => {})
    load()
    const t = setInterval(load, 2000)
    return () => clearInterval(t)
  }, [])

  // TODO SEAT 4: make this look good on a projector, seen from four metres.
  // Columns per person. Card = what + due + the VERBATIM quote underneath.
  // Done cards struck through, NOT removed — the audience must see the change.
  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 40 }}>Overheard</h1>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {people.map(p => (
          <section key={p.id} style={{ minWidth: 280 }}>
            <h2 style={{ fontSize: 24 }}>{p.name}</h2>
            {commitments.filter(c => c.ownerId === p.id).map(c => (
              <article key={c.id} style={{
                background: '#1a1a1e', padding: 16, borderRadius: 10, marginBottom: 12,
                textDecoration: c.status === 'done' ? 'line-through' : 'none',
                opacity: c.status === 'done' ? 0.45 : 1,
              }}>
                <div style={{ fontSize: 20 }}>{c.what}</div>
                {c.due && <div style={{ opacity: 0.7 }}>{c.due}</div>}
                <div style={{ marginTop: 10, fontStyle: 'italic', opacity: 0.55 }}>
                  “{c.quote}”
                </div>
              </article>
            ))}
          </section>
        ))}
      </div>
    </main>
  )
}
