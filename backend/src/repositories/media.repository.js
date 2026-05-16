const path = require('path')
const {
  mkdir, readFile, writeFile, unlink, access,
} = require('fs/promises')

const DB_ROOT = path.join(__dirname, '../../database')
const UPLOADS_BASE = path.join(__dirname, '../../uploads')
const MEDIA_DIR = path.join(DB_ROOT, 'media')

function getMetaPath(patientId) {
  return path.join(MEDIA_DIR, `${patientId}.json`)
}

function getFilePath(patientId, fileName) {
  return path.join(UPLOADS_BASE, patientId, fileName)
}

async function readMeta(patientId) {
  try {
    const raw = await readFile(getMetaPath(patientId), 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    return []
  }
}

async function writeMeta(patientId, items) {
  await mkdir(MEDIA_DIR, { recursive: true })
  await writeFile(getMetaPath(patientId), JSON.stringify(items, null, 2), 'utf8')
}

async function saveFile(patientId, fileName, buffer) {
  const dir = path.join(UPLOADS_BASE, patientId)
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, fileName), buffer)
}

async function deleteFile(patientId, fileName) {
  try {
    const filePath = getFilePath(patientId, fileName)
    await access(filePath)
    await unlink(filePath)
  } catch (err) {
    // fichier absent, rien à faire
  }
}

module.exports = {
  readMeta,
  writeMeta,
  saveFile,
  deleteFile,
}
