import assert from 'node:assert/strict'
import { test } from 'node:test'
import { containsRightToLeft, getDirectionalSpans, isStrongRtlLetter } from './smart-rtl.mjs'
import { reorder } from './bidi.mjs'

test('detects Arabic and Hebrew as strong RTL', () => {
  assert.equal(isStrongRtlLetter('م'.codePointAt(0)), true)
  assert.equal(isStrongRtlLetter('ש'.codePointAt(0)), true)
  assert.equal(isStrongRtlLetter('a'.codePointAt(0)), false)
  assert.equal(containsRightToLeft('hello مرحبا'), true)
  assert.equal(containsRightToLeft('hello'), false)
})

test('Smart RTL keeps English runs LTR inside an Arabic line', () => {
  const spans = getDirectionalSpans('استخدم git status الآن', true)
  assert.ok(spans.some((s) => s.isRtl))
  assert.ok(spans.some((s) => !s.isRtl))
  const visual = reorder('استخدم git status الآن')
  assert.match(visual, /git status/)
  assert.equal(/[\u0621-\u064A]/.test(visual), false)
})

test('matching brackets take the direction of their contents', () => {
  const spans = getDirectionalSpans('(مرحبا)', true)
  assert.equal(spans.length, 1)
  assert.equal(spans[0].isRtl, true)
  const visual = reorder('(مرحبا)')
  assert.equal(visual.startsWith('('), true)
  assert.equal(visual.endsWith(')'), true)
  assert.equal(/[\u0621-\u064A]/.test(visual), false)
  assert.equal(/[\uFE70-\uFEFF]/.test(visual), true)
})
