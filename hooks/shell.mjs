/** Quote a literal path for PowerShell on Windows or a POSIX shell elsewhere. */
export function shellQuote(path, platform = process.platform) {
  const normalized = platform === 'win32' ? path.replaceAll('\\', '/') : path
  if (platform === 'win32') return `'${normalized.replaceAll("'", "''")}'`
  return `'${normalized.replaceAll("'", "'\"'\"'")}'`
}

/** Makes PowerShell decode a native program's stdout as UTF-8. */
export const UTF8_SETUP = "[Console]::OutputEncoding = $OutputEncoding = [System.Text.UTF8Encoding]::new($false)"

/** Exact command the agent may run. On Windows, UTF-8 is set in the same command. */
export function shapeCommand(shapePath, filePath, platform = process.platform) {
  let command = `node ${shellQuote(shapePath, platform)}`
  if (filePath) command += ` ${shellQuote(filePath, platform)}`
  if (platform === 'win32') command = `${UTF8_SETUP}; ${command}`
  return command
}

function unquoteLiteral(token, platform) {
  if (!token.startsWith("'") || !token.endsWith("'") || token.length < 2) return null
  const body = token.slice(1, -1)
  if (platform === 'win32') {
    if (!/^([^']|'')*$/.test(body)) return null
    return body.replaceAll("''", "'")
  }
  if (body.includes("'")) return null
  return body
}

/**
 * True only for this plugin's renderer, alone or with one quoted reply file.
 * On Windows the UTF-8 setup may come first. Pipelines and extra commands are rejected.
 */
export function isAllowedShapeCommand(command, shapePath, platform = process.platform) {
  let rest = command.trim()
  const prefix = `${UTF8_SETUP}; `
  if (rest.startsWith(prefix)) {
    if (platform !== 'win32') return false
    rest = rest.slice(prefix.length).trim()
  }
  const bare = `node ${shellQuote(shapePath, platform)}`
  if (rest === bare) return true
  if (!rest.startsWith(`${bare} `)) return false
  const file = unquoteLiteral(rest.slice(bare.length + 1), platform)
  return typeof file === 'string' && file.length > 0 && !/[\r\n]/.test(file)
}
