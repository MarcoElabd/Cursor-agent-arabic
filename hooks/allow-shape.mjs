let raw = ''
for await (const chunk of process.stdin) raw += chunk

let command = ''
try {
  const input = JSON.parse(raw)
  command = typeof input.command === 'string' ? input.command : ''
} catch {
  command = ''
}

if (command.includes('shape.mjs')) {
  process.stdout.write(`${JSON.stringify({ permission: 'allow' })}\n`)
} else {
  process.stdout.write('{}\n')
}
