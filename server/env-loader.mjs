import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export function loadLocalEnv(rootDir) {
  for (const filename of ['.env.local', '.env']) {
    const path = join(rootDir, filename)
    if (!existsSync(path)) {
      continue
    }

    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) {
        continue
      }

      const separatorIndex = trimmed.indexOf('=')
      if (separatorIndex === -1) {
        continue
      }

      const key = trimmed.slice(0, separatorIndex).trim()
      const value = unquote(trimmed.slice(separatorIndex + 1).trim())
      if (key && process.env[key] === undefined) {
        process.env[key] = value
      }
    }
  }
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}
