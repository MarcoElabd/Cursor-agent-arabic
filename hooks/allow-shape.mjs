import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { shellQuote } from './shell.mjs'

let raw = ''
for await (const chunk of process.stdin) raw += chunk

let command = ''
try {
  const input = JSON.parse(raw)
  command = typeof input.command === 'string' ? input.command : ''
} catch {
  command = ''
}

// Only the exact local renderer is eligible. Pipelines, extra arguments,
// other scripts with the same filename, and compound commands need review.
const shape = join(dirname(fileURLToPath(import.meta.url)), 'shape.mjs')
const allowed = command.trim() === `node ${shellQuote(shape)}`
process.stdout.write(`${JSON.stringify({ permission: allowed ? 'allow' : 'ask' })}\n`)
