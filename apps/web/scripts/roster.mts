// Fill the fixture's real Telegram ids.
//
//   1. everyone sends one message in the group
//   2. npm run roster -w @overheard/web
//
// Matches people by name against the live store and rewrites every TODO- id in
// fixtures/demo.json. Without real ids, /me finds nothing for that person.

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const WEB = process.env.WEB_URL ?? 'http://localhost:3000'

type Person = { id: string; name: string }

const { people } = (await (await fetch(`${WEB}/api/debug`)).json()) as { people: Person[] }
if (!people.length) {
  console.error('No one in the store yet. Have everyone send a message in the group first.')
  process.exit(1)
}

console.log('People the bot has seen:')
for (const p of people) console.log(`  ${p.id}  ${p.name}`)

let filled = 0
const left = new Set<string>()

for (const file of ['fixtures/demo.json', 'fixtures/board.json']) {
  const path = join(root, file)
  let raw = readFileSync(path, 'utf8')

  for (const p of people) {
    const token = `TODO-${p.name.split(/\s+/)[0].toUpperCase()}`
    if (raw.includes(token)) {
      raw = raw.replaceAll(`"${token}"`, `"${p.id}"`)
      console.log(`  -> ${file}: ${token} = ${p.id} (${p.name})`)
      filled++
    }
  }

  writeFileSync(path, raw)
  for (const m of raw.matchAll(/TODO-[A-Z]+/g)) left.add(m[0])
}

console.log(`\nfilled ${filled}; still missing: ${left.size ? [...left].join(', ') : 'none'}`)
