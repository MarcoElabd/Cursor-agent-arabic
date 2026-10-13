import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isAllowedShapeCommand } from './shell.mjs'

let raw = ''
for await (const chunk of process.stdin) raw += chunk

let command = ''
try {
  const input = JSON.parse(raw)
  command = typeof input.command === 'string' ? input.command : ''
} catch {
  command = ''
}

// Only the local renderer is eligible: alone, or with one reply file.
// Pipelines, extra arguments, other scripts, and compound commands need review.
const shape = join(dirname(fileURLToPath(import.meta.url)), 'shape.mjs')
const allowed = isAllowedShapeCommand(command, shape)
process.stdout.write(`${JSON.stringify({ permission: allowed ? 'allow' : 'ask' })}\n`)
