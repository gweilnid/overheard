import { NextResponse } from 'next/server'

// Replace this fixture with the first events API integration when it is ready.
export async function GET() {
  const people = {
    AT: { initials: 'AT', name: 'Atakan T.', title: 'Product lead', email: 'atakan@overheard.local' },
    EB: { initials: 'EB', name: 'Elif B.', title: 'Design director', email: 'elif@overheard.local' },
    MK: { initials: 'MK', name: 'Mert K.', title: 'Engineering lead', email: 'mert@overheard.local' },
    SA: { initials: 'SA', name: 'Selin A.', title: 'Operations manager', email: 'selin@overheard.local' },
    LE: { initials: 'LE', name: 'Leyla E.', title: 'Product designer', email: 'leyla@overheard.local' },
  }

  return NextResponse.json({
    events: [
      {
        id: 'weekly',
        title: 'Product weekly',
        attendees: [people.AT, people.EB, people.MK, people.SA],
        date: 'Today',
        time: '10:30 – 11:15',
        place: 'Atlas · Room 04',
        format: 'Hybrid',
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
        date: 'Tomorrow',
        time: '14:00 – 15:00',
        place: 'Figma room',
        format: 'Online',
        topics: [{ title: 'Dashboard direction', bullets: ['Prioritise the events overview', 'Agree on visual hierarchy'] }],
        todos: [{ text: 'Bring updated event card states', done: false }],
        files: [{ name: 'Dashboard explorations', type: 'Image' }],
      },
      {
        id: 'retro',
        title: 'Sprint retrospective',
        attendees: [people.AT, people.EB, people.LE, people.MK, people.SA],
        date: 'Fri, Sep 18',
        time: '16:00 – 16:45',
        place: 'Atlas · Room 08',
        format: 'In person',
        topics: [{ title: 'This sprint', bullets: ['What gave us energy?', 'What should change next time?'] }],
        todos: [{ text: 'Collect anonymous notes', done: false }],
        files: [],
      },
    ],
  })
}
