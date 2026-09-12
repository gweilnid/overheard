'use client'

import { FormEvent, useEffect, useState } from 'react'
import { ArrowRight, HelpCircle, ImageIcon, LayoutDashboard, Mail, MapPin, MonitorUp, Presentation } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import styles from './dashboard.module.css'

type Event = {
  id: string
  title: string
  attendees: Attendee[]
  date: string
  time: string
  place: string
  format: 'In person' | 'Online' | 'Hybrid'
  topics: { title: string; bullets: string[] }[]
  todos: { text: string; done: boolean }[]
  files: { name: string; type: 'Presentation' | 'Image' }[]
}

type Attendee = { initials: string; name: string; title: string; email: string }

const people: Record<string, Attendee> = {
  AT: { initials: 'AT', name: 'Atakan T.', title: 'Product lead', email: 'atakan@overheard.local' },
  EB: { initials: 'EB', name: 'Elif B.', title: 'Design director', email: 'elif@overheard.local' },
  MK: { initials: 'MK', name: 'Mert K.', title: 'Engineering lead', email: 'mert@overheard.local' },
  SA: { initials: 'SA', name: 'Selin A.', title: 'Operations manager', email: 'selin@overheard.local' },
  LE: { initials: 'LE', name: 'Leyla E.', title: 'Product designer', email: 'leyla@overheard.local' },
}

const mockEvents: Event[] = [
  {
    id: 'weekly',
    title: 'Product weekly',
    attendees: [people.AT, people.EB, people.MK, people.SA],
    date: 'Today', time: '10:30 – 11:15', place: 'Atlas · Room 04', format: 'Hybrid',
    topics: [
      { title: 'Autumn launch', bullets: ['Review final launch scope', 'Confirm the demo flow'] },
      { title: 'Signals from the team', bullets: ['Open commitments and blockers'] },
    ],
    todos: [{ text: 'Share launch deck with design', done: false }, { text: 'Confirm speaker order', done: true }],
    files: [{ name: 'Autumn launch v4', type: 'Presentation' }, { name: 'Reference wall', type: 'Image' }],
  },
  {
    id: 'design',
    title: 'Design critique',
    attendees: [people.AT, people.LE, people.MK],
    date: 'Tomorrow', time: '14:00 – 15:00', place: 'Figma room', format: 'Online',
    topics: [{ title: 'Dashboard direction', bullets: ['Prioritise the events overview', 'Agree on visual hierarchy'] }],
    todos: [{ text: 'Bring updated event card states', done: false }],
    files: [{ name: 'Dashboard explorations', type: 'Image' }],
  },
  {
    id: 'retro',
    title: 'Sprint retrospective',
    attendees: [people.AT, people.EB, people.LE, people.MK, people.SA],
    date: 'Fri, Sep 18', time: '16:00 – 16:45', place: 'Atlas · Room 08', format: 'In person',
    topics: [{ title: 'This sprint', bullets: ['What gave us energy?', 'What should change next time?'] }],
    todos: [{ text: 'Collect anonymous notes', done: false }],
    files: [],
  },
]

function EventIcon({ type }: { type: 'Presentation' | 'Image' }) {
  return type === 'Presentation' ? <span className={styles.deckIcon}><Presentation size={15} /></span> : <span className={styles.imageIcon}><ImageIcon size={15} /></span>
}

export default function DashboardPage() {
  const [signedIn, setSignedIn] = useState(false)
  const [events, setEvents] = useState<Event[]>(mockEvents)
  const [selectedId, setSelectedId] = useState(mockEvents[0].id)
  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState<Attendee | null>(null)
  const selected = events.find(event => event.id === selectedId) ?? events[0] ?? mockEvents[0]

  useEffect(() => {
    fetch('/api/events')
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Could not load events')))
      .then(({ events: apiEvents }: { events: Event[] }) => {
        if (apiEvents.length) {
          setEvents(apiEvents)
          setSelectedId(current => apiEvents.some(event => event.id === current) ? current : apiEvents[0].id)
        }
      })
      .catch(() => {})
  }, [])

  function signIn(event: FormEvent) {
    event.preventDefault()
    if (email.trim()) setSignedIn(true)
  }

  if (!signedIn) {
    return (
      <main className={styles.authPage}>
        <section className={styles.authPanel}>
          <div className={styles.wordmark}><span>o</span> overheard</div>
          <p className={styles.eyebrow}>YOUR TEAM’S MEETING MEMORY</p>
          <h1>Good meetings<br />shouldn’t disappear.</h1>
          <p className={styles.intro}>Keep the conversations, decisions, and next steps around every event in one calm place.</p>
          <div className={styles.authQuote}>“The quiet layer between what we say and what we do.”</div>
        </section>
        <section className={styles.loginPanel}>
          <div className={styles.loginCard}>
            <div className={styles.smallLogo}><span>o</span></div>
            <p className={styles.eyebrow}>WELCOME BACK</p>
            <h2>Sign in to your space</h2>
            <p className={styles.muted}>This is a mock sign-in for the dashboard preview.</p>
            <form onSubmit={signIn}>
              <label htmlFor="email">Work email</label>
              <input id="email" type="email" placeholder="you@company.com" value={email} onChange={event => setEmail(event.target.value)} required />
              <Button type="submit" className={styles.signInButton}>Continue <ArrowRight /></Button>
            </form>
            <p className={styles.legal}>By continuing, you agree to a kinder way of keeping track.</p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className={styles.dashboard}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}><span>o</span> overheard</div>
        <nav>
          <a className={styles.navActive} href="#events"><LayoutDashboard /> Events</a>
          <a href="#notes"><span>□</span> My notes</a>
          <a href="#team"><span>◎</span> Team</a>
        </nav>
        <div className={styles.sidebarFooter}>
          <button className={styles.help}><HelpCircle /> <span>Help & feedback</span></button>
          <button className={styles.profile}><b>AT</b><span><strong>Atakan T.</strong><small>Personal workspace</small></span><i>⌄</i></button>
        </div>
      </aside>

      <section className={styles.content} id="events">
        <header className={styles.topbar}>
          <div><p className={styles.eyebrow}>SEPTEMBER 2026</p><h1>Events</h1></div>
        </header>

        <div className={styles.layout}>
          <section className={styles.eventList} aria-label="Events">
            <div className={styles.listHeading}><span>UPCOMING</span><b>{events.length}</b></div>
            {events.map(event => <Card key={event.id} className={`${styles.eventCard} ${selectedId === event.id ? styles.selected : ''}`} onClick={() => setSelectedId(event.id)} role="button" tabIndex={0} onKeyDown={key => key.key === 'Enter' && setSelectedId(event.id)}>
              <div className={styles.eventDate}><strong>{event.date === 'Today' ? '12' : event.date === 'Tomorrow' ? '13' : '18'}</strong><span>SEP</span></div>
              <div className={styles.eventSummary}><h3>{event.title}</h3><p>{event.time}</p><p className={styles.location}><MapPin size={12} /> {event.place}</p></div>
              <AvatarGroup className={styles.avatarStack}>{event.attendees.slice(0, 3).map(person => <Avatar key={person.email} size="sm"><AvatarFallback>{person.initials}</AvatarFallback></Avatar>)}{event.attendees.length > 3 && <AvatarGroupCount>+{event.attendees.length - 3}</AvatarGroupCount>}</AvatarGroup>
            </Card>)}
            <Button variant="ghost" className={styles.pastEvents}>View past events <ArrowRight /></Button>
          </section>

          <Card className={styles.detail}>
            <div className={styles.detailHeader}>
              <div className={styles.datePill}><strong>{selected.date === 'Today' ? '12' : selected.date === 'Tomorrow' ? '13' : '18'}</strong><span>SEP</span></div>
              <div><p className={styles.eyebrow}>{selected.format} EVENT</p><h2>{selected.title}</h2><p className={styles.detailMeta}>{selected.time} <em>·</em> {selected.place}</p></div>
            </div>
            {selected.format !== 'Online' && <div className={styles.roomNotice}><MonitorUp /><div><strong>Presentation board available</strong><p>{selected.place} is ready for shared presentations.</p></div></div>}
            <div className={styles.people}><p className={styles.sectionLabel}>ATTENDEES <Badge variant="secondary">{selected.attendees.length}</Badge></p><div className={styles.peopleRow}>{selected.attendees.map(person => <button key={person.email} className={styles.attendeeButton} onClick={() => setProfile(person)} aria-label={`View ${person.name}'s profile`}><Avatar size="sm"><AvatarFallback>{person.initials}</AvatarFallback></Avatar><span>{person.name}</span></button>)}</div><p className={styles.peopleHint}>Select an attendee to view their profile.</p></div>
            <div className={styles.detailGrid}>
              <section><p className={styles.sectionLabel}>TOPICS TO TALK ABOUT</p>{selected.topics.map(topic => <div className={styles.topic} key={topic.title}><h3>{topic.title}</h3><ul>{topic.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}</ul></div>)}</section>
              <section><p className={styles.sectionLabel}>NOTES & TO-DOS</p>{selected.todos.map(todo => <div key={todo.text} className={`${styles.todo} ${todo.done ? styles.done : ''}`}><Checkbox checked={todo.done} disabled aria-label={todo.done ? 'Complete' : 'Open'} />{todo.text}</div>)}</section>
            </div>
            <section className={styles.resources}><p className={styles.sectionLabel}>EVENT BUCKET</p><div className={styles.fileGrid}>{selected.files.map(file => <div className={styles.file} key={file.name}><EventIcon type={file.type} /><span><strong>{file.name}</strong><small>{file.type}</small></span><b>↗</b></div>)}{selected.files.length === 0 && <p className={styles.emptyBucket}>No shared files for this event.</p>}</div></section>
          </Card>
        </div>
      </section>
      <Dialog open={Boolean(profile)} onOpenChange={open => !open && setProfile(null)}>
        <DialogContent className={styles.profileDialog}>
          {profile && <><DialogHeader><Avatar size="lg" className={styles.profileAvatar}><AvatarFallback>{profile.initials}</AvatarFallback></Avatar><DialogTitle>{profile.name}</DialogTitle><DialogDescription>{profile.title}</DialogDescription></DialogHeader><div className={styles.profileEmail}><Mail size={15} /><a href={`mailto:${profile.email}`}>{profile.email}</a></div></>}
        </DialogContent>
      </Dialog>
    </main>
  )
}
