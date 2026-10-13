import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { wantsVisual } from './bidi.mjs'
import { shellQuote } from './shell.mjs'

// Cursor closes stdin after the hook payload. Drain it before doing any work.
const chunks = []
for await (const chunk of process.stdin) chunks.push(chunk)

const here = dirname(fileURLToPath(import.meta.url))
const raw = readFileSync(join(here, '..', 'rules', 'arabic.mdc'), 'utf8')
const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim()
if (!body) {
  console.error('rules/arabic.mdc has an empty body')
  process.exit(1)
}

const shape = join(here, 'shape.mjs')
const display = wantsVisual(process.env)
  ? [
      'Arabic display: visual',
      `Shape command: node ${shellQuote(shape)}`,
      ...(process.platform === 'win32' ? [
        'PowerShell UTF-8 setup: [Console]::OutputEncoding = $OutputEncoding = [System.Text.UTF8Encoding]::new($false)',
        'Run that setup in the same shell command BEFORE piping Arabic to Node. Use a single-quoted here-string for the reply so backticks and dollar signs remain literal.',
      ] : []),
      'Cursor may still request shell approval. Respect its permission prompt; do not claim the command is already approved.',
    ].join('\n')
  : 'Arabic display: native'

process.stdout.write(`${JSON.stringify({ additional_context: `${body}\n\n${display}` })}\n`)
