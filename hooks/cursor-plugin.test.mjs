import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { CHCP_UTF8, FALLBACK_SHAPE_COMMAND, isAllowedShapeCommand, POWERSHELL_UTF8_PREFIX, shapeCommand, shellQuote, withPowerShellUtf8 } from './shell.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'))

test('Cursor manifest points at the rule and the Cursor hook file', () => {
  const plugin = readJson('.cursor-plugin/plugin.json')
  assert.equal(plugin.name, 'arabic')
  assert.equal(plugin.rules, './rules/')
  assert.equal(plugin.hooks, './hooks/hooks.json')
  assert.match(plugin.version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/)
  assert.equal(plugin.license, 'MIT')
})

test('marketplace installs the root plugin', () => {
  const market = readJson('.cursor-plugin/marketplace.json')
  assert.equal(market.plugins.length, 1)
  assert.equal(market.plugins[0].name, 'arabic')
  assert.equal(market.plugins[0].source, '.')
})

test('Arabic rule is always applied', () => {
  const raw = readFileSync(join(root, 'rules', 'arabic.mdc'), 'utf8')
  assert.match(raw, /^---\r?\n[\s\S]*?alwaysApply:\s*true[\s\S]*?\r?\n---/)
  for (const line of [
    'Always answer the user in Arabic (Modern Standard Arabic, or the dialect the user writes in).',
    'Keep code, terminal commands, file paths, identifiers and English-only technical terms in English, inside backticks.',
    'Prefer bullet lists over markdown tables.',
    'Do your internal reasoning / thinking in Arabic as well.',
    'Arabic display:',
    FALLBACK_SHAPE_COMMAND,
    'or when no Arabic display line is present',
    'The Cursor desktop app (Agent, Ask, and Editor) draws Arabic itself.',
  ]) {
    assert.ok(raw.includes(line), line)
  }
})

test('sessionStart hook runs the Cursor script', () => {
  const hooks = readJson('hooks/hooks.json')
  assert.equal(hooks.version, 1)
  assert.equal(hooks.hooks.sessionStart[0].command, 'node ./hooks/cursor-session-start.mjs')
  assert.equal(hooks.hooks.beforeSubmitPrompt[0].command, 'node ./hooks/cursor-session-start.mjs')
  assert.equal(hooks.hooks.beforeShellExecution[0].command, 'node ./hooks/allow-shape.mjs')
  assert.equal(hooks.hooks.preToolUse[0].command, 'node ./hooks/powershell-utf8.mjs')
  assert.equal(hooks.hooks.preToolUse[0].matcher, 'Shell')
})

test('permission hook allows the standalone local shape command', async () => {
  const child = spawn(process.execPath, [join(root, 'hooks', 'allow-shape.mjs')], {
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  let out = ''
  child.stdout.setEncoding('utf8')
  child.stdout.on('data', (chunk) => { out += chunk })
  const shapePath = join(root, 'hooks', 'shape.mjs').replaceAll('\\', '/')
  child.stdin.end(JSON.stringify({ command: `node '${shapePath}'` }))
  const code = await new Promise((resolve) => child.on('close', resolve))
  assert.equal(code, 0)
  assert.deepEqual(JSON.parse(out), { permission: 'allow' })

  const other = spawn(process.execPath, [join(root, 'hooks', 'allow-shape.mjs')], {
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  let otherOut = ''
  other.stdout.setEncoding('utf8')
  other.stdout.on('data', (chunk) => { otherOut += chunk })
  other.stdin.end(JSON.stringify({ command: 'git status' }))
  const otherCode = await new Promise((resolve) => other.on('close', resolve))
  assert.equal(otherCode, 0)
  assert.deepEqual(JSON.parse(otherOut), { permission: 'ask' })
})

test('sessionStart hook emits the rule body as additional_context', async () => {
  const raw = readFileSync(join(root, 'rules', 'arabic.mdc'), 'utf8')
  const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim()
  const child = spawn(process.execPath, [join(root, 'hooks', 'cursor-session-start.mjs')], {
    cwd: root,
    env: { ...process.env, ARABIC_RTL: 'visual' },
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  let out = ''
  let err = ''
  child.stdout.setEncoding('utf8')
  child.stderr.setEncoding('utf8')
  child.stdout.on('data', (chunk) => { out += chunk })
  child.stderr.on('data', (chunk) => { err += chunk })
  child.stdin.end(JSON.stringify({ session_id: 'test', is_background_agent: false, composer_mode: 'agent' }))
  const code = await new Promise((resolve) => child.on('close', resolve))
  assert.equal(err, '')
  assert.equal(code, 0)
  const parsed = JSON.parse(out)
  assert.equal(parsed.additional_context.startsWith(body), true)
  assert.match(parsed.additional_context, /Arabic display: visual/)
  assert.match(parsed.additional_context, /hooks\/shape\.mjs/)
  assert.match(parsed.additional_context, /^Reply file: .+\.txt$/m)
  assert.equal(parsed.additional_context.includes('|'), false)
  assert.equal(parsed.continue, undefined)
})

test('Cursor app sessions keep logical Arabic', async () => {
  const env = { ...process.env, OS: 'Windows_NT' }
  for (const key of ['ARABIC_RTL', 'TERM', 'TERM_PROGRAM', 'WT_SESSION', 'ALACRITTY_WINDOW_ID', 'CURSOR_CLI', 'CURSOR_AGENT']) {
    delete env[key]
  }
  const child = spawn(process.execPath, [join(root, 'hooks', 'cursor-session-start.mjs')], {
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  let out = ''
  child.stdout.setEncoding('utf8')
  child.stdout.on('data', (chunk) => { out += chunk })
  child.stdin.end(JSON.stringify({ session_id: 'ide', composer_mode: 'agent', hook_event_name: 'sessionStart' }))
  assert.equal(await new Promise((resolve) => child.on('close', resolve)), 0)
  const parsed = JSON.parse(out)
  assert.match(parsed.additional_context, /Arabic display: native/)
  assert.match(parsed.additional_context, /Do not run shape\.mjs/)
  assert.equal(/^Shape command: /m.test(parsed.additional_context), false)
})

test('Windows CLI sessions shape Arabic so cells are not disconnected', async () => {
  const env = { ...process.env, OS: 'Windows_NT', TERM_PROGRAM: 'vscode', TERM: 'xterm-256color', WT_SESSION: 'wt' }
  delete env.ARABIC_RTL
  delete env.ALACRITTY_WINDOW_ID
  const child = spawn(process.execPath, [join(root, 'hooks', 'cursor-session-start.mjs')], {
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  let out = ''
  child.stdout.setEncoding('utf8')
  child.stdout.on('data', (chunk) => { out += chunk })
  child.stdin.end(JSON.stringify({ session_id: 'ps', composer_mode: 'agent' }))
  assert.equal(await new Promise((resolve) => child.on('close', resolve)), 0)
  const parsed = JSON.parse(out)
  assert.match(parsed.additional_context, /Arabic display: visual/)
  assert.match(parsed.additional_context, /^Shape command: /m)
  assert.match(parsed.additional_context, /^Reply file: /m)
  assert.match(parsed.additional_context, /^Shaped file: /m)
  assert.equal(parsed.additional_context.includes('|'), false)
  assert.equal(isAllowedShapeCommand(FALLBACK_SHAPE_COMMAND, join(root, 'hooks', 'shape.mjs')), true)
})

test('beforeSubmitPrompt keeps the prompt and repeats the display mode', async () => {
  const child = spawn(process.execPath, [join(root, 'hooks', 'cursor-session-start.mjs')], {
    env: { ...process.env, ARABIC_RTL: 'visual' },
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  let out = ''
  child.stdout.setEncoding('utf8')
  child.stdout.on('data', (chunk) => { out += chunk })
  child.stdin.end(JSON.stringify({
    hook_event_name: 'beforeSubmitPrompt',
    prompt: 'اشرح لي git status',
    conversation_id: 'chat-1',
  }))
  assert.equal(await new Promise((resolve) => child.on('close', resolve)), 0)
  const parsed = JSON.parse(out)
  assert.equal(parsed.continue, true)
  assert.match(parsed.additional_context, /Arabic display: visual/)
  assert.match(parsed.additional_context, /cursor-arabic-chat-1\.txt/)
})

test('Agent PowerShell commands switch off code page 437', () => {
  const wrapped = withPowerShellUtf8('git status', 'win32')
  assert.equal(wrapped, `${POWERSHELL_UTF8_PREFIX}git status`)
  assert.equal(wrapped.startsWith(`${CHCP_UTF8}; `), true)
  assert.equal(withPowerShellUtf8(wrapped, 'win32'), wrapped)
  assert.equal(withPowerShellUtf8('git status', 'linux'), 'git status')
  const shaped = withPowerShellUtf8(FALLBACK_SHAPE_COMMAND, 'win32')
  assert.equal(isAllowedShapeCommand(shaped, 'C:/unused/shape.mjs', 'win32'), true)
  assert.equal(isAllowedShapeCommand(`'سلام' | ${wrapped}`, 'C:/unused/shape.mjs', 'win32'), false)
})

test('Agent shell hook rewrites a Windows PowerShell command and does not approve it', async () => {
  const child = spawn(process.execPath, [join(root, 'hooks', 'powershell-utf8.mjs')], {
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  let out = ''
  child.stdout.setEncoding('utf8')
  child.stdout.on('data', (chunk) => { out += chunk })
  child.stdin.end(JSON.stringify({
    tool_name: 'Shell',
    tool_input: { command: 'git status', working_directory: 'C:/repo' },
  }))
  assert.equal(await new Promise((resolve) => child.on('close', resolve)), 0)
  const parsed = JSON.parse(out)
  assert.equal(parsed.permission, 'ask')
  if (process.platform === 'win32') {
    assert.equal(parsed.updated_input.command, `${POWERSHELL_UTF8_PREFIX}git status`)
    assert.equal(parsed.updated_input.working_directory, 'C:/repo')
  } else {
    assert.equal(parsed.updated_input, undefined)
  }
})

test('Windows shape command reads a UTF-8 file and never takes Arabic from the pipeline', () => {
  const shape = "C:\\Users\\O'Brien\\$HOME\\arabic plugin\\shape.mjs"
  const file = "C:\\Users\\O'Brien\\$HOME\\cursor-arabic-reply.txt"
  const command = shapeCommand(shape, file, 'win32')
  assert.equal(command.includes('سلام'), false)
  assert.equal(command.includes('|'), false)
  assert.equal(isAllowedShapeCommand(command, shape, 'win32'), true)
  assert.equal(isAllowedShapeCommand(`'سلام' | node ${shellQuote(shape, 'win32')}`, shape, 'win32'), false)
  assert.equal(isAllowedShapeCommand(`${command}; Remove-Item ${shellQuote(file, 'win32')}`, shape, 'win32'), false)
})

test('permission hook allows the renderer plus one reply file', async () => {
  const shapePath = join(root, 'hooks', 'shape.mjs')
  const file = join(root, 'reply.txt')
  const command = `node ${shellQuote(shapePath)} ${shellQuote(file)}`
  const child = spawn(process.execPath, [join(root, 'hooks', 'allow-shape.mjs')], {
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  let out = ''
  child.stdout.setEncoding('utf8')
  child.stdout.on('data', (chunk) => { out += chunk })
  child.stdin.end(JSON.stringify({ command }))
  assert.equal(await new Promise((resolve) => child.on('close', resolve)), 0)
  assert.deepEqual(JSON.parse(out), { permission: 'allow' })
})

test('hook does not allow commands merely mentioning shape.mjs', async () => {
  const shapePath = join(root, 'hooks', 'shape.mjs').replaceAll('\\', '/')
  for (const command of [
    'node "/other-plugin/hooks/shape.mjs"',
    `node '${shapePath}'; node -e "process.exit(0)"`,
    `'سلام' | node '${shapePath}'`,
    'echo shape.mjs',
  ]) {
    const child = spawn(process.execPath, [join(root, 'hooks', 'allow-shape.mjs')], {
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    let out = ''
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk) => { out += chunk })
    child.stdin.end(JSON.stringify({ command }))
    assert.equal(await new Promise((resolve) => child.on('close', resolve)), 0)
    assert.deepEqual(JSON.parse(out), { permission: 'ask' }, command)
  }
})

test('Windows visual mode shapes a UTF-8 file through PowerShell 5.1', {
  skip: process.platform !== 'win32',
}, async () => {
  const hook = spawn(process.execPath, [join(root, 'hooks', 'cursor-session-start.mjs')], {
    env: { ...process.env, ARABIC_RTL: 'visual' },
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  let context = ''
  hook.stdout.setEncoding('utf8')
  hook.stdout.on('data', (chunk) => { context += chunk })
  hook.stdin.end('{}')
  assert.equal(await new Promise((resolve) => hook.on('close', resolve)), 0)
  const body = JSON.parse(context).additional_context
  const file = body.match(/^Reply file: (.+)$/m)?.[1]
  const command = body.match(/^Shape command: (.+)$/m)?.[1]
  assert.ok(file)
  assert.ok(command)
  assert.equal(command.includes('|'), false)
  writeFileSync(file, 'سلام\n', 'utf8')
  const child = spawn('powershell.exe', ['-NoProfile', '-Command', command], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let out = ''
  child.stdout.setEncoding('utf8')
  child.stdout.on('data', (chunk) => { out += chunk })
  assert.equal(await new Promise((resolve) => child.on('close', resolve)), 0)
  assert.equal(out.trim(), 'ﻡﻼﺳ')
})

test('Windows shell quoting preserves spaces, apostrophes and dollar signs in paths', {
  skip: process.platform !== 'win32',
}, async () => {
  const path = "C:\\Users\\O'Brien\\$HOME\\arabic plugin\\shape.mjs"
  const command = `& ${shellQuote(process.execPath)} -e 'process.stdout.write(process.argv[1])' ${shellQuote(path)}`
  const child = spawn('powershell.exe', ['-NoProfile', '-Command', command], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let out = ''
  child.stdout.setEncoding('utf8')
  child.stdout.on('data', (chunk) => { out += chunk })
  assert.equal(await new Promise((resolve) => child.on('close', resolve)), 0)
  assert.equal(out, "C:/Users/O'Brien/$HOME/arabic plugin/shape.mjs")
})
