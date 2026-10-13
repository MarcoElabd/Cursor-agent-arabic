// Arabic for a screen that draws characters left to right: shape letters into
// presentation forms, then lay each line out in visual cell order.

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

const dirOf = (ch) =>
  /[٠-٩۰-۹]/.test(ch) ? 'L'
  : /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/.test(ch) ? 'R'
  : /[\p{L}\p{N}]/u.test(ch) ? 'L' : 'N'
const MIRROR = { '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<', '«': '»', '»': '«' }

export const isRtl = (line) => Array.from(line).map(dirOf).find((d) => d !== 'N') === 'R'

/** One already-shaped line, logical order in, visual order out. */
export function reorder(line) {
  const chars = Array.from(line)
  const base = isRtl(line) ? 'R' : 'L'
  const dirs = chars.map(dirOf)
  for (let i = 0; i < dirs.length; ) {
    if (dirs[i] !== 'N') { i++; continue }
    let j = i
    while (j < dirs.length && dirs[j] === 'N') j++
    const before = i > 0 ? dirs[i - 1] : base
    const after = j < dirs.length ? dirs[j] : base
    dirs.fill(before === after ? before : base, i, j)
    i = j
  }
  const runs = []
  chars.forEach((ch, i) => {
    const last = runs[runs.length - 1]
    const d = dirs[i]
    if (last && last.d === d) last.s.push(ch)
    else runs.push({ d, s: [ch] })
  })
  if (base === 'R') runs.reverse()
  return runs.map((r) => r.d === 'R' ? r.s.reverse().map((c) => MIRROR[c] ?? c).join('') : r.s.join('')).join('')
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
  const shaped = shape(line)
  const rtl = isRtl(shaped)
  return wrap(shaped, width).map((l) => {
    const v = reorder(l)
    return rtl ? v.padStart(width) : v
  })
}

// Terminals known to draw Arabic unjoined and left to right.
// Anything else is trusted to do BiDi itself, unless ARABIC_RTL overrides it.
export const lacksBidi = (env) =>
  /^(vscode|wezterm|ghostty)$/i.test(env.TERM_PROGRAM ?? '') ||
  /kitty|alacritty/.test(env.TERM ?? '') ||
  env.ALACRITTY_WINDOW_ID !== undefined

/** Cursor Agent lays glyphs in left-to-right cells. Shape unless the user opts out. */
export function wantsVisual(env) {
  if (env.ARABIC_RTL === 'native') return false
  if (env.ARABIC_RTL === 'visual') return true
  if (lacksBidi(env)) return true
  if (env.CURSOR_CLI || env.CURSOR_AGENT) return true
  return true
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
