import { withPowerShellUtf8 } from './shell.mjs'

let raw = ''
for await (const chunk of process.stdin) raw += chunk

let input = {}
try {
  input = JSON.parse(raw || '{}')
} catch {
  input = {}
}

const toolInput = input.tool_input
const command = toolInput && typeof toolInput.command === 'string' ? toolInput.command : ''
const next = withPowerShellUtf8(command)

// Ask is not an approval. preToolUse does not enforce it, and allow would
// skip the Agent's normal shell prompt for every command.
if (!command.trim() || next === command.trim()) {
  process.stdout.write(`${JSON.stringify({ permission: 'ask' })}\n`)
} else {
  process.stdout.write(`${JSON.stringify({
    permission: 'ask',
    updated_input: { ...toolInput, command: next },
  })}\n`)
}
