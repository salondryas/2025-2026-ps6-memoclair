const path = require('path')
const { mkdir, readFile, writeFile } = require('fs/promises')

const DB_ROOT = path.join(__dirname, '../../database')
const STORE_FILE = path.join(DB_ROOT, 'profiles-store.json')

function createEmptyStore() {
  return { profiles: [], associations: [], sessions: [] }
}

async function readStore() {
  try {
    const raw = await readFile(STORE_FILE, 'utf8')
    const store = JSON.parse(raw)
    return {
      profiles: Array.isArray(store.profiles) ? store.profiles : [],
      associations: Array.isArray(store.associations) ? store.associations : [],
      sessions: Array.isArray(store.sessions) ? store.sessions : [],
    }
  } catch (err) {
    return createEmptyStore()
  }
}

async function writeStore(store) {
  await mkdir(DB_ROOT, { recursive: true })
  await writeFile(STORE_FILE, JSON.stringify(store, null, 2), 'utf8')
}

module.exports = { readStore, writeStore }
