const { readStore, writeStore } = require('../repositories/profile.repository')
const { readMeta } = require('../repositories/media.repository')

function average(values) {
  if (!values.length) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

async function getPatientStatistics(patientId) {
  const store = await readStore()
  const sessions = store.sessions.filter((session) => session.patientId === patientId)
  const media = await readMeta(patientId)
  const latencies = sessions.map((session) => Number(session.averageLatencyMs || 0)).filter(Boolean)

  return {
    patientId,
    sessionCount: sessions.length,
    mediaCount: media.length,
    supportSignals: {
      hintCount: sessions.reduce((sum, session) => sum + Number(session.hintCount || 0), 0),
      skippedCount: sessions.reduce((sum, session) => sum + Number(session.skippedCount || 0), 0),
      guidedCount: sessions.reduce((sum, session) => sum + Number(session.guidedCount || 0), 0),
      earlyStops: sessions.filter((session) => session.earlyStop).length,
    },
    averageLatencyMs: average(latencies),
    emotionalStates: sessions.reduce((acc, session) => {
      const key = session.emotionalState || 'unknown'
      return { ...acc, [key]: (acc[key] || 0) + 1 }
    }, {}),
    history: sessions,
    clinicalWarning: 'Ces indicateurs décrivent une séance MemoClair et ne remplacent ni MMSE, ni ADL, ni avis clinique.',
  }
}

async function recordMetrics(payload) {
  const store = await readStore()
  const session = {
    id: `session-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    patientId: payload.patientId,
    gameType: payload.gameType || 'game-b',
    durationSeconds: Number(payload.durationSeconds || 0),
    hintCount: Number(payload.hintCount || 0),
    skippedCount: Number(payload.skippedCount || 0),
    guidedCount: Number(payload.guidedCount || 0),
    averageLatencyMs: Number(payload.averageLatencyMs || 0),
    earlyStop: Boolean(payload.earlyStop),
    emotionalState: payload.emotionalState || 'unknown',
    createdAt: new Date().toISOString(),
  }
  store.sessions.unshift(session)
  await writeStore(store)
  return session
}

module.exports = { getPatientStatistics, recordMetrics }
