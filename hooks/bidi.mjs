// Arabic for a screen that draws characters left to right: shape letters into
// presentation forms, then lay each line out with Smart RTL directional spans
// (inspired by https://github.com/mirbehnam/RtlTerminal).

import { containsRightToLeft, getDirectionalSpans } from './smart-rtl.mjs'

// Joining class per letter, U+0621..U+063A then U+0641..U+064A, in the same order
// as their forms in U+FE80..U+FEF4: 1 = isolated only, 2 = right-joining, 4 = dual.
const CLASSES = '12222424244444222244444444' + '4444444224'
const FORMS = new Map()
{
  let at = 0xfe80
  Array.from(CLASSES).forEach((c, i) => {
    const n = Number(c)
    FORMS.set(i < 26 ? 0x0621 + i : 0x0641 + i - 26, { at, n })
    at += n
  })
}
const TATWEEL = 0x0640
// لآ لأ لإ لا -> isolated form; final is +1
const LAM_ALEF = new Map([[0x0622, 0xfef5], [0x0623, 0xfef7], [0x0625, 0xfef9], [0x0627, 0xfefb]])

const isMark = (c) => (c >= 0x064b && c <= 0x065f) || c === 0x0670
const joinsNext = (c) => c === TATWEEL || FORMS.get(c ?? -1)?.n === 4
const joinsPrev = (c) => c === TATWEEL || (FORMS.get(c ?? -1)?.n ?? 0) >= 2

export const hasArabic = (s) => /[؀-ۿݐ-ݿ]/.test(s)

// Drops tashkeel: a combining mark lands on the wrong cell once the line is reversed.
export function shape(text) {
  const cps = Array.from(text, (ch) => ch.codePointAt(0)).filter((c) => !isMark(c))
  const out = []
  for (let i = 0; i < cps.length; i++) {
    const c = cps[i]
    const form = FORMS.get(c)
    if (!form) { out.push(c); continue }
    const prev = joinsNext(cps[i - 1])
    const lig = c === 0x0644 ? LAM_ALEF.get(cps[i + 1] ?? -1) : undefined
    if (lig) { out.push(lig + (prev ? 1 : 0)); i++; continue }
    const next = form.n === 4 && joinsPrev(cps[i + 1])
    const k = form.n === 1 ? 0 : prev && next ? 3 : prev ? 1 : next ? 2 : 0
    out.push(form.at + k)
  }
  return String.fromCodePoint(...out)
}

const MIRROR = { '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<', '«': '»', '»': '«' }

export const isRtl = (line) => containsRightToLeft(line)

/**
 * Logical Arabic (or already-shaped forms) → visual cell order using Smart RTL spans.
 * RTL spans are shaped into presentation forms, then reversed for LTR cell painters.
 */
export function reorder(line) {
  const chars = Array.from(line)
  if (chars.length === 0) return ''
  const baseRtl = isRtl(line)
  const spans = getDirectionalSpans(line, baseRtl)
  const parts = spans.map((span) => {
    const slice = chars.slice(span.start, span.start + span.length).join('')
    if (!span.isRtl) return slice
    // Shape only logical Arabic letters; presentation forms pass through shape() unchanged.
    const shaped = hasArabic(slice) ? shape(slice) : slice
    return Array.from(shaped)
      .reverse()
      .map((c) => MIRROR[c] ?? c)
      .join('')
  })
  if (baseRtl) parts.reverse()
  return parts.join('')
}

/** Greedy word wrap to `width` cells; a word longer than a line is cut. */
export function wrap(line, width) {
  const out = []
  let cur = ''
  for (const word of line.split(' ')) {
    let w = word
    while (Array.from(w).length > width) {
      if (cur) { out.push(cur); cur = '' }
      out.push(Array.from(w).slice(0, width).join(''))
      w = Array.from(w).slice(width).join('')
    }
    const next = cur ? `${cur} ${w}` : w
    if (Array.from(next).length > width) { out.push(cur); cur = w } else cur = next
  }
  out.push(cur)
  return out
}

/** A logical line to the visual lines a non-BiDi screen draws. RTL lines are right-aligned. */
export function visualLines(line, width) {
  const rtl = isRtl(line)
  // Shape inside reorder per RTL span so English runs stay untouched (RtlTerminal style).
  const visual = reorder(line)
  return wrap(visual, width).map((l) => (rtl ? l.padStart(width) : l))
}

// Terminals known to draw Arabic unjoined and left to right.
export const lacksBidi = (env) =>
  /^(vscode|wezterm|ghostty)$/i.test(env.TERM_PROGRAM ?? '') ||
  /kitty|alacritty/.test(env.TERM ?? '') ||
  env.ALACRITTY_WINDOW_ID !== undefined

/** Hosts that already paint Arabic/RTL (e.g. RtlTerminal with Smart RTL on). */
export const hasNativeRtl = (env) =>
  env.ARABIC_RTL === 'native' ||
  env.RTLTERMINAL === '1' ||
  /rtlterminal/i.test(env.TERM_PROGRAM ?? '')

/**
 * The Cursor CLI paints one character per cell from left to right, so logical
 * Arabic looks disconnected and reversed there. Shape on Windows unless the
 * user opts out or runs inside a native-RTL host such as RtlTerminal.
 */
export function wantsVisual(env, platform = process.platform) {
  if (hasNativeRtl(env)) return false
  if (env.ARABIC_RTL === 'visual') return true
  if (platform === 'win32' || env.OS === 'Windows_NT') return true
  return lacksBidi(env)
}

/** Reply text for a non-BiDi screen. Code fences stay as written. */
export function renderReply(text, width) {
  const rows = []
  let inCode = false
  for (const raw of text.replace(/\r\n/g, '\n').split('\n')) {
    if (raw.trimStart().startsWith('```')) { inCode = !inCode; rows.push(raw); continue }
    if (inCode || !hasArabic(raw)) { rows.push(raw); continue }
    const line = raw.replace(/^#{1,6}\s+/, '').replace(/^(\s*)[-*+]\s+/, '$1• ').replace(/\*\*|__|`/g, '')
    rows.push(...visualLines(line, width))
  }
  return rows.join('\n')
}
