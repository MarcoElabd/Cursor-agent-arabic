// Directional spans inspired by RtlTerminal's SmartRtl.cs
// (https://github.com/mirbehnam/RtlTerminal). Adapted for Cursor CLI cells:
// we still emit presentation forms afterward; this layer only decides runs.

const OPEN = new Map([[')', '('], [']', '['], ['}', '{'], ['>', '<']])
const CLOSE = new Set(OPEN.keys())
const OPEN_CHARS = new Set(OPEN.values())

/** Strong RTL letters: Hebrew, Arabic, Syriac, Thaana, N'Ko, presentation forms. */
export function isStrongRtlLetter(cp) {
  return (
    (cp >= 0x0590 && cp <= 0x08ff) ||
    (cp >= 0xfb1d && cp <= 0xfdff) ||
    (cp >= 0xfe70 && cp <= 0xfeff) ||
    (cp >= 0x10800 && cp <= 0x10fff) ||
    (cp >= 0x1e800 && cp <= 0x1eeff)
  )
}

function isLetterOrNumber(cp, ch) {
  if (isStrongRtlLetter(cp)) return true
  return /[\p{L}\p{N}]/u.test(ch)
}

/** 1 = RTL, 0 = LTR, -1 = neutral. */
function strongDirection(cp, ch) {
  if (isStrongRtlLetter(cp)) return 1
  if (isLetterOrNumber(cp, ch)) return 0
  return -1
}

function resolveBrackets(chars, directions) {
  const stack = []
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]
    if (OPEN_CHARS.has(ch)) {
      stack.push({ ch, i })
      continue
    }
    if (!CLOSE.has(ch)) continue
    const want = OPEN.get(ch)
    let match = -1
    for (let s = stack.length - 1; s >= 0; s--) {
      if (stack[s].ch === want) {
        match = s
        break
      }
    }
    if (match < 0) continue
    const openIndex = stack[match].i
    stack.length = match
    const content = enclosedDirection(directions, openIndex + 1, i)
    if (content < 0) continue
    directions[openIndex] = content
    directions[i] = content
  }
}

function enclosedDirection(directions, start, end) {
  let found = -1
  for (let i = start; i < end; i++) {
    if (directions[i] < 0) continue
    if (found >= 0 && found !== directions[i]) return -1
    found = directions[i]
  }
  return found
}

function resolveNeutrals(directions, whitespace, baseDirection) {
  let i = 0
  while (i < directions.length) {
    if (directions[i] >= 0) {
      i++
      continue
    }
    const start = i
    let hasWs = false
    while (i < directions.length && directions[i] < 0) {
      hasWs ||= whitespace[i]
      i++
    }
    const prev = start > 0 ? directions[start - 1] : baseDirection
    const next = i < directions.length ? directions[i] : baseDirection
    // RtlTerminal: prefer LTR when a no-space neutral sits next to an LTR side.
    const resolved =
      prev === next
        ? prev
        : !hasWs && (prev === 0 || next === 0)
          ? 0
          : baseDirection
    directions.fill(resolved, start, i)
  }
}

/**
 * @returns {{ start: number, length: number, isRtl: boolean }[]}
 * Indices are into the code-point array from `Array.from(text)`.
 */
export function getDirectionalSpans(text, baseRightToLeft) {
  const chars = Array.from(text)
  if (chars.length === 0) return []

  const baseDirection = baseRightToLeft ? 1 : 0
  const directions = chars.map((ch) => strongDirection(ch.codePointAt(0), ch))
  const whitespace = chars.map((ch) => /\s/u.test(ch))

  resolveBrackets(chars, directions)
  resolveNeutrals(directions, whitespace, baseDirection)

  const spans = []
  let start = 0
  let dir = directions[0]
  for (let i = 1; i < directions.length; i++) {
    if (directions[i] === dir) continue
    spans.push({ start, length: i - start, isRtl: dir === 1 })
    start = i
    dir = directions[i]
  }
  spans.push({ start, length: directions.length - start, isRtl: dir === 1 })
  return spans
}

export function containsRightToLeft(text) {
  for (const ch of text) {
    if (isStrongRtlLetter(ch.codePointAt(0))) return true
  }
  return false
}
