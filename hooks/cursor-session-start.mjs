import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { wantsVisual } from './bidi.mjs'
import { shapeCommand } from './shell.mjs'

// Cursor closes stdin after the hook payload. Drain it before doing any work.
const chunks = []
for await (const chunk of process.stdin) chunks.push(chunk)
const rawInput = Buffer.concat(chunks.map((c) => typeof c === 'string' ? Buffer.from(c) : c)).toString('utf8')

let input = {}
try {
  input = JSON.parse(rawInput || '{}')
} catch {
  input = {}
}

const here = dirname(fileURLToPath(import.meta.url))
const raw = readFileSync(join(here, '..', 'rules', 'arabic.mdc'), 'utf8')
const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim()
if (!body) {
  console.error('rules/arabic.mdc has an empty body')
  process.exit(1)
}

const shape = join(here, 'shape.mjs')
const display = wantsVisual(process.env)
  ? visualDisplay(shape, input)
  : [
      'Arabic display: native',
      'Write Arabic in normal logical order. Do not reshape it and do not run the shape command.',
      'Use this mode only when the screen already draws Arabic correctly.',
    ].join('\n')

const additional_context = `${body}\n\n${display}`
const isPrompt = input.hook_event_name === 'beforeSubmitPrompt' || typeof input.prompt === 'string'
const output = isPrompt ? { continue: true, additional_context } : { additional_context }
process.stdout.write(`${JSON.stringify(output)}\n`)

function visualDisplay(shapePath, hookInput) {
  const id = String(hookInput.conversation_id || hookInput.session_id || 'reply')
  const safe = id.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80) || 'reply'
  const file = join(tmpdir(), `cursor-arabic-${safe}.txt`).replaceAll('\\', '/')
  return [
    'Arabic display: visual',
    `Reply file: ${file}`,
    'Write the full reply to Reply file with the file tool, as UTF-8, before the shape command. Do not create that file in PowerShell, and do not pipe Arabic into Node.',
    `Shape command: ${shapeCommand(shapePath, file)}`,
    'Cursor may still request shell approval. After success, the user-visible message is only the command stdout, copied exactly, including leading spaces. Do not also print the unshaped Arabic.',
  ].join('\n')
}
