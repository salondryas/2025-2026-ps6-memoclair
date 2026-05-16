const { readStore, writeStore } = require('../repositories/profile.repository')

const PROFILE_TYPES = ['professional', 'patient', 'family']
const STAGES = ['leger', 'modere', 'avance']

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function validateProfilePayload(payload) {
  const errors = []
  if (!PROFILE_TYPES.includes(payload.type)) errors.push('type invalide.')
  if (!payload.firstName || !payload.firstName.trim()) errors.push('firstName requis.')
  if (!payload.lastName || !payload.lastName.trim()) errors.push('lastName requis.')

  if (payload.type === 'professional') {
    if (!payload.jobTitle || !payload.jobTitle.trim()) errors.push('jobTitle requis pour un soignant.')
    if (!payload.organization || !payload.organization.trim()) errors.push('organization requis pour un soignant.')
  }
  if (payload.type === 'patient' && !STAGES.includes(payload.stage)) {
    errors.push('stage requis pour un accueilli.')
  }
  if (payload.type === 'family' && (!payload.relationship || !payload.relationship.trim())) {
    errors.push('relationship requis pour un aidant familial.')
  }
  return errors
}

async function listProfiles(type) {
  const store = await readStore()
  return type ? store.profiles.filter((p) => p.type === type) : store.profiles
}

async function createProfile(payload) {
  const errors = validateProfilePayload(payload)
  if (errors.length) {
    const err = new Error(errors.join(' '))
    err.statusCode = 400
    throw err
  }

  const now = new Date().toISOString()
  const profile = {
    id: payload.id || createId(payload.type),
    type: payload.type,
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    displayName: `${payload.firstName.trim()} ${payload.lastName.trim()}`,
    createdByProfessionalId: payload.type === 'professional' ? null : (payload.createdByProfessionalId || null),
    stage: payload.stage || null,
    jobTitle: payload.jobTitle || null,
    organization: payload.organization || null,
    relationship: payload.relationship || null,
    email: payload.email || null,
    phone: payload.phone || null,
    avatarUrl: payload.avatarUrl || null,
    createdAt: now,
    updatedAt: now,
  }

  const store = await readStore()
  store.profiles.push(profile)
  await writeStore(store)
  return profile
}

async function deleteProfile(profileId) {
  const store = await readStore()
  const profile = store.profiles.find((p) => p.id === profileId)
  if (!profile) {
    const err = new Error('Profil introuvable.')
    err.statusCode = 404
    throw err
  }

  store.profiles = store.profiles
    .filter((p) => p.id !== profileId)
    .map((p) => (p.createdByProfessionalId === profileId ? { ...p, createdByProfessionalId: null } : p))
  store.associations = store.associations.filter(
    (a) => a.familyId !== profileId && a.patientId !== profileId,
  )
  store.sessions = store.sessions.filter((s) => s.patientId !== profileId)
  await writeStore(store)
}

async function listAssociations() {
  const store = await readStore()
  return store.associations
}

async function setFamilyPatients(familyId, patientIds) {
  const store = await readStore()
  const ids = Array.from(new Set(patientIds || []))
  store.associations = [
    ...store.associations.filter((a) => a.familyId !== familyId),
    ...ids.map((patientId) => ({ familyId, patientId })),
  ]
  await writeStore(store)
  return store.associations.filter((a) => a.familyId === familyId)
}

async function setPatientFamilies(patientId, familyIds) {
  const store = await readStore()
  const ids = Array.from(new Set(familyIds || []))
  store.associations = [
    ...store.associations.filter((a) => a.patientId !== patientId),
    ...ids.map((familyId) => ({ familyId, patientId })),
  ]
  await writeStore(store)
  return store.associations.filter((a) => a.patientId === patientId)
}

async function listSessions(patientId) {
  const store = await readStore()
  return patientId ? store.sessions.filter((session) => session.patientId === patientId) : store.sessions
}

async function createSession(payload) {
  if (!payload.patientId) {
    const err = new Error('patientId requis.')
    err.statusCode = 400
    throw err
  }

  const store = await readStore()
  const session = {
    id: createId('session'),
    patientId: payload.patientId,
    gameType: payload.gameType || 'game-b',
    startedAt: payload.startedAt || new Date().toISOString(),
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

module.exports = {
  listProfiles,
  createProfile,
  deleteProfile,
  listAssociations,
  setFamilyPatients,
  setPatientFamilies,
  listSessions,
  createSession,
}
