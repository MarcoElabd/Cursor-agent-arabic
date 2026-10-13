import { readFileSync } from 'node:fs'
import { renderReply, wantsVisual } from './bidi.mjs'

const file = process.argv[2]
let text
if (file) {
  try {
    text = readFileSync(file, 'utf8')
  } catch (err) {
    console.error(`Could not read the reply file: ${err.message}`)
    process.exit(1)
  }
} else {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  text = Buffer.concat(chunks.map((c) => typeof c === 'string' ? Buffer.from(c) : c)).toString('utf8')
}

const columns = Number(process.env.COLUMNS)
const width = Number.isFinite(columns) && columns >= 40 ? columns - 4 : 80
const out = wantsVisual(process.env) ? renderReply(text, width) : text
process.stdout.write(out.endsWith('\n') || out.length === 0 ? out : `${out}\n`)
