const path = require('path')
const {
  readMeta, writeMeta, saveFile, deleteFile,
} = require('../repositories/media.repository')
const { clearCache } = require('../repositories/games-cache.repository')

const DUO_CACHE = 'duo-cache'
const GAME_B_CACHE = 'game-b-cache'

function buildFileName(originalName) {
  const ext = path.extname(originalName).toLowerCase()
  const uid = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
  return `${uid}${ext}`
}

function buildMediaItem(patientId, file, body, fileName) {
  const {
    title, kind, cueType, clinicalNote,
  } = body
  return {
    id: `${patientId}-${kind}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    patientId,
    title: title.trim(),
    kind,
    fileName,
    originalName: file.originalname,
    mimeType: file.mimetype,
    cueType: cueType || 'object',
    clinicalNote: (clinicalNote || '').trim(),
    createdAt: new Date().toISOString(),
    source: 'upload',
  }
}

async function listMedia(patientId) {
  return readMeta(patientId)
}

async function uploadMedia(patientId, file, body) {
  const { title, kind } = body
  if (!patientId || !title || !kind) {
    const err = new Error('Champs obligatoires manquants : patientId, title, kind.')
    err.statusCode = 400
    throw err
  }

  const fileName = buildFileName(file.originalname)
  await saveFile(patientId, fileName, file.buffer)

  const item = buildMediaItem(patientId, file, body, fileName)
  const existing = await readMeta(patientId)
  await writeMeta(patientId, [item, ...existing])

  await Promise.all([
    clearCache(DUO_CACHE, patientId),
    clearCache(GAME_B_CACHE, patientId),
  ])

  return item
}

async function deleteMedia(patientId, itemId) {
  const items = await readMeta(patientId)
  const item = items.find((i) => i.id === itemId)

  if (!item) {
    const err = new Error('Média non trouvé.')
    err.statusCode = 404
    throw err
  }

  await deleteFile(patientId, item.fileName)
  await writeMeta(patientId, items.filter((i) => i.id !== itemId))

  await Promise.all([
    clearCache(DUO_CACHE, patientId),
    clearCache(GAME_B_CACHE, patientId),
  ])
}

module.exports = { listMedia, uploadMedia, deleteMedia }
