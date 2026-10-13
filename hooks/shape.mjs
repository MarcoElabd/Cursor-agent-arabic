import { renderReply } from './bidi.mjs'

const chunks = []
for await (const chunk of process.stdin) chunks.push(chunk)
const text = Buffer.concat(chunks.map((c) => typeof c === 'string' ? Buffer.from(c) : c)).toString('utf8')
const columns = Number(process.env.COLUMNS)
const width = Number.isFinite(columns) && columns >= 40 ? columns - 4 : 80
const out = renderReply(text, width)
process.stdout.write(out.endsWith('\n') || out.length === 0 ? out : `${out}\n`)
