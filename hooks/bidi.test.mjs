import { spawn } from 'node:child_process'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { lacksBidi, renderReply, reorder, shape, visualLines, wantsVisual, wrap } from './bidi.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

test('shapes letters into joined presentation forms', () => {
  expectEqual(shape('سلام'), 'ﺳﻼﻡ')
  expectEqual(shape('مَرحبا'), shape('مرحبا'))
})

test('reorders RTL lines and keeps English runs LTR', () => {
  expectEqual(reorder('ابج git status دهو'), 'وهد git status جبا')
  expectEqual(reorder('hello مرحبا'), 'hello ابحرم')
  expectEqual(reorder('(مرحبا)'), '(ابحرم)')
  expectEqual(reorder('رقم 123'), '123 مقر')
})

test('wraps to width and right-aligns RTL lines', () => {
  assert.deepEqual(wrap('aa bb cc', 5), ['aa bb', 'cc'])
  const lines = visualLines('هذا سطر طويل جدا يجب أن يلتف', 10)
  assert.equal(lines.length > 1, true)
  for (const l of lines) assert.equal(Array.from(l).length, 10)
})

test('keeps code fences and shapes only Arabic prose', () => {
  const out = renderReply('مرحبا\n```\nمرحبا\n```\nhello', 20)
  const [prose, fence, code] = out.split('\n')
  assert.equal(fence, '```')
  assert.equal(code, 'مرحبا')
  assert.equal(prose.includes('مرحبا'), false)
  assert.equal(prose.trim().length > 0, true)
})

test('auto mode picks visual only for terminals without BiDi', () => {
  assert.equal(lacksBidi({ TERM_PROGRAM: 'vscode', TERM: 'xterm-256color' }), true)
  assert.equal(lacksBidi({ TERM: 'xterm-kitty' }), true)
  assert.equal(lacksBidi({ TERM: 'xterm-256color', ALACRITTY_WINDOW_ID: '1' }), true)
  assert.equal(lacksBidi({ TERM: 'xterm-256color' }), false)
  assert.equal(wantsVisual({ ARABIC_RTL: 'native', TERM_PROGRAM: 'vscode' }), false)
  assert.equal(wantsVisual({}), true)
})

test('shape command prints presentation forms', async () => {
  const child = spawn(process.execPath, [join(root, 'hooks', 'shape.mjs')], {
    env: { ...process.env, COLUMNS: '40' },
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  let out = ''
  child.stdout.setEncoding('utf8')
  child.stdout.on('data', (chunk) => { out += chunk })
  child.stdin.end('سلام\n')
  const code = await new Promise((resolve) => child.on('close', resolve))
  assert.equal(code, 0)
  assert.equal(out.includes('سلام'), false)
  assert.equal(out.includes('ﺳ'), true)
})

function expectEqual(actual, expected) {
  assert.equal(actual, expected)
}
