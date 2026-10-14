/** Quote a literal path for PowerShell on Windows or a POSIX shell elsewhere. */
export function shellQuote(path, platform = process.platform) {
  const normalized = platform === 'win32' ? path.replaceAll('\\', '/') : path
  if (platform === 'win32') return `'${normalized.replaceAll("'", "''")}'`
  return `'${normalized.replaceAll("'", "'\"'\"'")}'`
}

/** Switches the console off code page 437 before PowerShell encodes a native program. */
export const CHCP_UTF8 = 'chcp 65001 > $null'

/** Makes PowerShell send and read Arabic as UTF-8 instead of code page 437. */
export const UTF8_SETUP = "[Console]::InputEncoding = [Console]::OutputEncoding = $OutputEncoding = [System.Text.UTF8Encoding]::new($false)"

/** Prefixed to Agent shell commands on Windows. */
export const POWERSHELL_UTF8_PREFIX = `${CHCP_UTF8}; ${UTF8_SETUP}; `

/** Put an Agent PowerShell command on UTF-8. Other platforms are unchanged. */
export function withPowerShellUtf8(command, platform = process.platform) {
  if (platform !== 'win32') return command
  const trimmed = command.trim()
  if (!trimmed || trimmed.startsWith(POWERSHELL_UTF8_PREFIX)) return trimmed || command
  if (trimmed.startsWith(`${UTF8_SETUP}; `)) return `${CHCP_UTF8}; ${trimmed}`
  if (trimmed.startsWith(`${CHCP_UTF8}; `)) {
    const rest = trimmed.slice(`${CHCP_UTF8}; `.length).trim()
    return `${POWERSHELL_UTF8_PREFIX}${rest}`
  }
  return `${POWERSHELL_UTF8_PREFIX}${trimmed}`
}

/** Used when the CLI never receives a session Shape command. */
export const FALLBACK_SHAPE_COMMAND = 'node "$env:USERPROFILE\\.cursor\\plugins\\local\\arabic\\hooks\\shape.mjs" "$env:TEMP\\cursor-arabic-reply.txt" "$env:TEMP\\cursor-arabic-shaped.txt"'

/** Exact command the agent may run. On Windows, UTF-8 is set in the same command. */
export function shapeCommand(shapePath, filePath, platform = process.platform, outPath) {
  let command = `node ${shellQuote(shapePath, platform)}`
  if (filePath) command += ` ${shellQuote(filePath, platform)}`
  if (outPath) command += ` ${shellQuote(outPath, platform)}`
  if (platform === 'win32') command = `${POWERSHELL_UTF8_PREFIX}${command}`
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
  let rest = command.trim()
  if (platform === 'win32' && rest.startsWith(`${CHCP_UTF8}; `)) rest = rest.slice(`${CHCP_UTF8}; `.length).trim()
  if (rest.startsWith(`${UTF8_SETUP}; `)) {
    if (platform !== 'win32') return false
    rest = rest.slice(`${UTF8_SETUP}; `.length).trim()
  }
  if (rest === FALLBACK_SHAPE_COMMAND) return true
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
