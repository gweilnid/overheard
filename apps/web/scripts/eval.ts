// SEAT 2's tuning loop:  npm run eval
//
// Runs the extractor against fixtures/demo.json and prints what it found next
// to what it should have found. Tune the prompt until they match.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Load .env.local before importing anything that reads process.env at module load.
const root = join(import.meta.dirname, '..')
try {
  for (const line of readFileSync(join(root, '.env.local'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
} catch {
  console.error('No apps/web/.env.local — copy .env.example and add OPENROUTER_API_KEY')
  process.exit(1)
}

const { extract } = await import('../lib/extract')
const fixture = JSON.parse(readFileSync(join(root, 'fixtures/demo.json'), 'utf8'))

console.log(`model: ${process.env.OPENROUTER_MODEL ?? 'anthropic/claude-sonnet-4.5'}`)
console.log(`${fixture.messages.length} messages, ${fixture.roster.length} people\n`)

const diff = await extract({
  messages: fixture.messages,
  open: [],
  roster: fixture.roster,
})

console.log('--- CREATED ---')
if (!diff.create.length) console.log('  (nothing)')
for (const c of diff.create) {
  console.log(`  ${c.ownerName}: ${c.what}`)
  console.log(`    due=${c.due ?? '-'}  toWhom=${c.toWhom ?? '-'}  conf=${c.confidence}`)
  console.log(`    from [${c.sourceMessageId}] "${c.quote}"`)
}
if (diff.update.length) console.log('--- UPDATED ---', diff.update)
if (diff.close.length) console.log('--- CLOSED ---', diff.close)

console.log('\n--- EXPECTED ---')
for (const e of fixture.expected) {
  console.log(`  ${e.what ? `${e.ownerName}: ${e.what} (msg ${e.sourceMessageId})` : ''}`)
  console.log(`    note: ${e.note}`)
}
