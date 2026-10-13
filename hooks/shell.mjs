/** Quote a literal path for PowerShell on Windows or a POSIX shell elsewhere. */
export function shellQuote(path, platform = process.platform) {
  const normalized = platform === 'win32' ? path.replaceAll('\\', '/') : path
  if (platform === 'win32') return `'${normalized.replaceAll("'", "''")}'`
  return `'${normalized.replaceAll("'", "'\"'\"'")}'`
}

/** Makes PowerShell decode a native program's stdout as UTF-8. */
export const UTF8_SETUP = "[Console]::OutputEncoding = $OutputEncoding = [System.Text.UTF8Encoding]::new($false)"

/** Used when the CLI never receives a session Shape command. */
export const FALLBACK_SHAPE_COMMAND = 'node "$env:USERPROFILE\\.cursor\\plugins\\local\\arabic\\hooks\\shape.mjs" "$env:TEMP\\cursor-arabic-reply.txt" "$env:TEMP\\cursor-arabic-shaped.txt"'

/** Exact command the agent may run. On Windows, UTF-8 is set in the same command. */
export function shapeCommand(shapePath, filePath, platform = process.platform, outPath) {
  let command = `node ${shellQuote(shapePath, platform)}`
  if (filePath) command += ` ${shellQuote(filePath, platform)}`
  if (outPath) command += ` ${shellQuote(outPath, platform)}`
  if (platform === 'win32') command = `${UTF8_SETUP}; ${command}`
  return command
}

function takeQuoted(input, platform) {
  if (!input.startsWith("'")) return null
  if (platform === 'win32') {
    let i = 1
    let value = ''
    while (i < input.length) {
      if (input[i] === "'" && input[i + 1] === "'") { value += "'"; i += 2; continue }
      if (input[i] === "'") return { value, rest: input.slice(i + 1) }
      value += input[i++]
    }
    return null
  }
  const end = input.indexOf("'", 1)
  if (end < 1) return null
  return { value: input.slice(1, end), rest: input.slice(end + 1) }
}

/**
 * True only for this plugin's renderer, with up to two quoted files.
 * Also allows the fixed PowerShell fallback that writes a shaped file.
 * Pipelines and extra commands are rejected.
 */
export function isAllowedShapeCommand(command, shapePath, platform = process.platform) {
  const trimmed = command.trim()
  if (trimmed === FALLBACK_SHAPE_COMMAND) return true
  let rest = trimmed
  const prefix = `${UTF8_SETUP}; `
  if (rest.startsWith(prefix)) {
    if (platform !== 'win32') return false
    rest = rest.slice(prefix.length).trim()
  }
  const bare = `node ${shellQuote(shapePath, platform)}`
  if (rest === bare) return true
  if (!rest.startsWith(`${bare} `)) return false
  let tail = rest.slice(bare.length + 1)
  for (let n = 0; n < 2; n++) {
    const token = takeQuoted(tail, platform)
    if (!token || token.value.length === 0 || /[\r\n]/.test(token.value)) return false
    tail = token.rest.trim()
    if (!tail) return true
  }
  return false
}
