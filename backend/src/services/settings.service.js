const { readJson, writeJson } = require('../repositories/care-data.repository')

const DEFAULT_SETTINGS = {
  accessibility: {
    textSize: 1,
    highContrastEnabled: false,
    audioReadingEnabled: true,
  },
  reminiscence: {
    preferredThemes: ['famille', 'lieux', 'musique'],
    maxSessionMinutes: 10,
    locationHintsFirst: true,
  },
  familyAccess: {
    authorizedCaregiverIds: [],
    restrictions: [],
  },
}

function mergeSettings(current, patch) {
  return {
    ...current,
    ...patch,
    accessibility: { ...current.accessibility, ...(patch.accessibility || {}) },
    reminiscence: { ...current.reminiscence, ...(patch.reminiscence || {}) },
    familyAccess: { ...current.familyAccess, ...(patch.familyAccess || {}) },
  }
}

async function getSettings(patientId) {
  return readJson('settings', patientId, DEFAULT_SETTINGS)
}

async function updateSettings(patientId, patch) {
  const current = await getSettings(patientId)
  return writeJson('settings', patientId, {
    ...mergeSettings(current, patch || {}),
    patientId,
    updatedAt: new Date().toISOString(),
  })
}

module.exports = { getSettings, updateSettings }
