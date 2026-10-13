import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { shellQuote } from './shell.mjs'

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
  ]) {
    assert.ok(raw.includes(line), line)
  }
})

test('sessionStart hook runs the Cursor script', () => {
  const hooks = readJson('hooks/hooks.json')
  assert.equal(hooks.version, 1)
  assert.equal(hooks.hooks.sessionStart[0].command, 'node ./hooks/cursor-session-start.mjs')
  assert.equal(hooks.hooks.beforeSubmitPrompt, undefined)
  assert.equal(hooks.hooks.beforeShellExecution[0].command, 'node ./hooks/allow-shape.mjs')
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
})

test('hook does not allow commands merely mentioning shape.mjs', async () => {
  const shapePath = join(root, 'hooks', 'shape.mjs').replaceAll('\\', '/')
  for (const command of [
    'node "/other-plugin/hooks/shape.mjs"',
    `node '${shapePath}'; node -e "process.exit(0)"`,
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

test('Windows session instructions preserve Arabic through PowerShell 5.1', {
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
  const setup = body.match(/^PowerShell UTF-8 setup: (.+)$/m)?.[1]
  const command = body.match(/^Shape command: (.+)$/m)?.[1]
  assert.ok(setup, 'Windows context must configure the native-command pipeline as UTF-8')
  assert.ok(command)
  const child = spawn('powershell.exe', ['-NoProfile', '-Command', `${setup}; 'سلام' | ${command}`], {
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
