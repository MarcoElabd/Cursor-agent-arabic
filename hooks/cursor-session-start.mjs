import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Cursor closes stdin after the hook payload. Drain it before doing any work.
const chunks = []
for await (const chunk of process.stdin) chunks.push(chunk)

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const raw = readFileSync(join(root, 'rules', 'arabic.mdc'), 'utf8')
const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim()
if (!body) {
  console.error('rules/arabic.mdc has an empty body')
  process.exit(1)
}

// additional_context is the field Cursor adds to the session system context.
process.stdout.write(`${JSON.stringify({ additional_context: body })}\n`)
