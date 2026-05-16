const path = require('path')
const { mkdir, readFile, writeFile } = require('fs/promises')

const DB_ROOT = path.join(__dirname, '../../database')
const PATIENTS_DIR = path.join(DB_ROOT, 'patients')

function getPatientFilePath(patientId) {
  if (!patientId || typeof patientId !== 'string' || !patientId.trim()) {
    throw new Error('patientId requis.')
  }

  return path.join(PATIENTS_DIR, `${patientId.trim()}.json`)
}

function resolveSessionHistoryKey(patient) {
  if (Array.isArray(patient.sessionsHistory)) return 'sessionsHistory'
  if (Array.isArray(patient.sessionHistory)) return 'sessionHistory'
  if (Array.isArray(patient.sessions)) return 'sessions'
  return 'sessionsHistory'
}

async function getPatient(patientId) {
  const filePath = getPatientFilePath(patientId)
  const rawPatient = await readFile(filePath, 'utf8')
  return JSON.parse(rawPatient)
}

async function addSessionToPatient(patientId, sessionData) {
  const patient = await getPatient(patientId)
  const historyKey = resolveSessionHistoryKey(patient)

  if (!Array.isArray(patient[historyKey])) {
    patient[historyKey] = []
  }

  patient[historyKey].push(sessionData)

  await mkdir(PATIENTS_DIR, { recursive: true })
  await writeFile(getPatientFilePath(patientId), JSON.stringify(patient, null, 2), 'utf8')

  return patient
}

async function getSessionsByPatient(patientId) {
  const patient = await getPatient(patientId)
  const historyKey = resolveSessionHistoryKey(patient)
  return Array.isArray(patient[historyKey]) ? patient[historyKey] : []
}

module.exports = {
  getPatient,
  addSessionToPatient,
  getSessionsByPatient,
}
