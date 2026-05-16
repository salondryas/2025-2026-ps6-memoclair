const { readJson, writeJson } = require('../repositories/care-data.repository')
const { readStore } = require('../repositories/profile.repository')
const { readMeta } = require('../repositories/media.repository')
const { getSettings } = require('./settings.service')
const { getPatientStatistics } = require('./statistics.service')

const DIMENSIONS = 64

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2)
}

function hashToken(token) {
  let hash = 0
  for (let i = 0; i < token.length; i += 1) hash = ((hash * 31) + token.charCodeAt(i)) % 2147483647
  return Math.abs(hash) % DIMENSIONS
}

function embed(text) {
  const vector = Array(DIMENSIONS).fill(0)
  tokenize(text).forEach((token) => { vector[hashToken(token)] += 1 })
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1
  return vector.map((value) => value / norm)
}

function similarity(left, right) {
  return left.reduce((sum, value, index) => sum + value * right[index], 0)
}

async function buildDocuments(patientId) {
  const store = await readStore()
  const profile = store.profiles.find((entry) => entry.id === patientId) || { id: patientId }
  const media = await readMeta(patientId)
  const settings = await getSettings(patientId)
  const stats = await getPatientStatistics(patientId)

  return [
    {
      id: `profile:${patientId}`,
      type: 'profile',
      text: `${profile.displayName || patientId} ${profile.stage || ''} ${profile.subtitle || ''} ${settings.reminiscence.preferredThemes.join(' ')}`,
      payload: profile,
    },
    ...media.map((item) => ({
      id: `media:${item.id}`,
      type: 'media',
      text: `${item.title || item.originalName || ''} ${item.cueType || ''} ${item.clinicalNote || ''} ${item.kind || ''}`,
      payload: item,
    })),
    {
      id: `stats:${patientId}`,
      type: 'statistics',
      text: `indices ${stats.supportSignals.hintCount} guidage ${stats.supportSignals.guidedCount} abandon ${stats.supportSignals.earlyStops} latence ${stats.averageLatencyMs}`,
      payload: stats,
    },
  ]
}

async function indexPatient(patientId) {
  const documents = await buildDocuments(patientId)
  const entries = documents.map((document) => ({
    ...document,
    embedding: embed(document.text),
  }))
  return writeJson('vector-store', patientId, {
    patientId,
    entries,
    embeddingProvider: 'local-hash-v1',
    updatedAt: new Date().toISOString(),
  })
}

function buildTherapeuticPrompt(query, results) {
  const context = results.map((entry) => `- ${entry.type}: ${entry.text}`).join('\n')
  return `Question douce: ${query || 'évoquer un souvenir rassurant'}\nContexte patient:\n${context}\nRépondre avec une relance courte, tolérante à l’aphasie, sans score.`
}

async function queryPatient(patientId, query, options = {}) {
  const store = await readJson('vector-store', patientId, null) || await indexPatient(patientId)
  const queryEmbedding = embed(`${query || ''} ${options.emotionalState || ''} ${options.cognitiveState || ''}`)
  const results = store.entries
    .map((entry) => ({ ...entry, score: similarity(queryEmbedding, entry.embedding) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, Number(options.topK || 5))

  return {
    patientId,
    query,
    results,
    therapeuticPrompt: buildTherapeuticPrompt(query, results),
    safety: 'Réminiscence douce, validation non stricte, aucune interprétation diagnostique automatique.',
  }
}

async function rememberInteraction(patientId, payload) {
  const memory = await readJson('long-term-memory', patientId, { patientId, interactions: [] })
  memory.interactions.unshift({
    ...payload,
    recordedAt: new Date().toISOString(),
  })
  memory.interactions = memory.interactions.slice(0, 200)
  return writeJson('long-term-memory', patientId, memory)
}

async function getFineTuningReadiness() {
  return {
    status: 'scaffolded',
    currentMode: 'RAG local + prompts thérapeutiques',
    requiresForRealFineTuning: ['corpus clinique autorisé', 'consentement', 'anonymisation', 'pipeline ML externe', 'validation éthique'],
  }
}

module.exports = {
  indexPatient,
  queryPatient,
  rememberInteraction,
  getFineTuningReadiness,
}
