const path = require('path')
const {
  mkdir, readFile, writeFile, readdir,
} = require('fs/promises')

const DB_ROOT = path.join(__dirname, '../../database')

function resolveFile(folder, id) {
  return path.join(DB_ROOT, folder, `${id}.json`)
}

async function readJson(folder, id, fallback) {
  try {
    const raw = await readFile(resolveFile(folder, id), 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    return fallback
  }
}

async function writeJson(folder, id, value) {
  const filePath = resolveFile(folder, id)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(value, null, 2), 'utf8')
  return value
}

async function listJson(folder) {
  try {
    const dir = path.join(DB_ROOT, folder)
    const files = await readdir(dir)
    const values = await Promise.all(files
      .filter((file) => file.endsWith('.json'))
      .map(async (file) => readJson(folder, file.replace(/\.json$/, ''), null)))
    return values.filter(Boolean)
  } catch (err) {
    return []
  }
}

module.exports = { readJson, writeJson, listJson }
