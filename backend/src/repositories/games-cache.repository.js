const path = require('path')
const {
  mkdir, readFile, writeFile, unlink,
} = require('fs/promises')

const DB_ROOT = path.join(__dirname, '../../database')

function getCachePath(cacheDir, patientId) {
  return path.join(DB_ROOT, cacheDir, `${patientId}.json`)
}

async function readCache(cacheDir, patientId) {
  try {
    const data = await readFile(getCachePath(cacheDir, patientId), 'utf8')
    return JSON.parse(data)
  } catch (err) {
    return null
  }
}

async function writeCache(cacheDir, patientId, fingerprint, payload) {
  const filePath = getCachePath(cacheDir, patientId)
  await mkdir(path.dirname(filePath), { recursive: true })
  const entry = { fingerprint, generatedAt: new Date().toISOString(), ...payload }
  await writeFile(filePath, JSON.stringify(entry, null, 2), 'utf8')
}

async function clearCache(cacheDir, patientId) {
  try {
    await unlink(getCachePath(cacheDir, patientId))
  } catch (err) {
    // fichier absent, rien à faire
  }
}

function getFingerprint(items) {
  return items.map((i) => i.id).sort().join('|')
}

module.exports = {
  readCache,
  writeCache,
  clearCache,
  getFingerprint,
}
