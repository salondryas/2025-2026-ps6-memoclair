const { readJson, writeJson } = require('../repositories/care-data.repository')

function computeDifficulty(metrics) {
  const latency = Number(metrics.averageLatencyMs || 0)
  const hints = Number(metrics.hintCount || 0)
  const skips = Number(metrics.skippedCount || 0)

  if (skips > 2 || hints > 4 || latency > 12000) return 'facile'
  if (skips > 0 || hints > 1 || latency > 7000) return 'moyen'
  return 'difficile'
}

async function getLevel(patientId) {
  return readJson('levels', patientId, {
    patientId,
    currentDifficulty: 'moyen',
    therapeuticGoals: ['maintenir le lien', 'favoriser la réminiscence douce'],
    motivation: 'valoriser les souvenirs évoqués sans score',
    updatedAt: null,
  })
}

async function adaptLevel(patientId, metrics) {
  const current = await getLevel(patientId)
  const next = {
    ...current,
    patientId,
    currentDifficulty: computeDifficulty(metrics || {}),
    lastMetrics: metrics || {},
    updatedAt: new Date().toISOString(),
  }
  return writeJson('levels', patientId, next)
}

module.exports = { getLevel, adaptLevel }
