/** Quote a literal path for PowerShell on Windows or a POSIX shell elsewhere. */
export function shellQuote(path, platform = process.platform) {
  if (platform === 'win32') return `'${path.replaceAll('\\', '/').replaceAll("'", "''")}'`
  return `'${path.replaceAll("'", "'\"'\"'")}'`
}
