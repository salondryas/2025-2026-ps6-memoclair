const { addSessionToPatient, getSessionsByPatient } = require('../utils/json-store.adapter')

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function countFromValue(value) {
  if (Array.isArray(value)) return value.length
  const numeric = toNumber(value)
  return numeric === null ? 0 : Math.max(0, numeric)
}

function firstDefined(values) {
  return values.find((v) => v !== undefined && v !== null)
}

function countCorrectQcmAnswers(gameData) {
  const qcmAnswers = gameData.qcmAnswers
    || gameData.multipleChoiceAnswers
    || gameData.multipleChoiceResults
    || gameData.qcm
    || []

  if (!Array.isArray(qcmAnswers)) return { total: 0, correct: 0 }

  const isCorrect = (answer) => {
    if (!answer) return false
    if (typeof answer.isCorrect === 'boolean') return answer.isCorrect
    if (typeof answer.correct === 'boolean') return answer.correct
    if (typeof answer.result === 'string') return answer.result.toLowerCase() === 'correct'

    const selected = answer.selectedChoiceId
      || answer.selectedAnswerId
      || answer.selectedId
      || answer.selected
      || answer.answerId
      || answer.choiceId
      || answer.userAnswer
    const expected = answer.correctChoiceId
      || answer.correctAnswerId
      || answer.correctId
      || answer.correctChoice
      || answer.expected

    if (selected === undefined || expected === undefined) return false
    return String(selected) === String(expected)
  }

  const correct = qcmAnswers.reduce((count, answer) => (isCorrect(answer) ? count + 1 : count), 0)
  return { total: qcmAnswers.length, correct }
}

function extractChronologyTimeInSeconds(gameData) {
  const clickToPlace = gameData.clickToPlace || {}
  const chronology = gameData.chronology || {}

  const directCandidates = [
    gameData.chronologyTimeInSeconds,
    gameData.clickToPlaceTimeInSeconds,
    gameData.chronoTimeInSeconds,
    gameData.chronoDurationSeconds,
    gameData.reconstitutionTimeInSeconds,
    clickToPlace.timeInSeconds,
    clickToPlace.durationSeconds,
    chronology.timeInSeconds,
    chronology.durationSeconds,
  ]

  for (let i = 0; i < directCandidates.length; i += 1) {
    const numeric = toNumber(directCandidates[i])
    if (numeric !== null && numeric >= 0) return Math.round(numeric)
  }

  const millisecondCandidates = [
    gameData.clickToPlaceTimeMs,
    gameData.chronologyTimeMs,
    clickToPlace.timeMs,
    clickToPlace.durationMs,
    chronology.timeMs,
    chronology.durationMs,
  ]

  for (let i = 0; i < millisecondCandidates.length; i += 1) {
    const numeric = toNumber(millisecondCandidates[i])
    if (numeric !== null && numeric >= 0) return Math.round(numeric / 1000)
  }

  return 0
}

function computeAssistanceLevel(gameData) {
  const assistance = gameData.assistance || {}

  const hintTimerTriggers = countFromValue(firstDefined([
    gameData.hintTimerTriggers,
    gameData.hintCount,
    gameData.hintsTriggered,
    gameData.hints,
    assistance.hintTimerTriggers,
  ]))

  const autoRevealTriggers = countFromValue(firstDefined([
    gameData.autoRevealTimerTriggers,
    gameData.autoRevealCount,
    gameData.guidedMoments,
    assistance.autoRevealTimerTriggers,
  ]))

  const visualHintTriggers = countFromValue(firstDefined([
    gameData.visualHintTriggers,
    gameData.visualHints,
    gameData.indicesVisuels,
    assistance.visualHintTriggers,
  ]))

  const totalTriggers = hintTimerTriggers + autoRevealTriggers + visualHintTriggers

  if (totalTriggers <= 1) return 'leger'
  if (totalTriggers <= 3) return 'modere'
  return 'important'
}

async function processAndSaveGameASession(patientId, gameData) {
  if (!patientId || typeof patientId !== 'string' || !patientId.trim()) {
    throw new Error('patientId requis.')
  }
  if (!gameData || typeof gameData !== 'object' || Array.isArray(gameData)) {
    throw new Error('gameData invalide.')
  }

  const { total, correct } = countCorrectQcmAnswers(gameData)
  const visualRecognitionRate = total > 0 ? Math.round((correct / total) * 100) : 0
  const chronologyTimeInSeconds = extractChronologyTimeInSeconds(gameData)
  const assistanceLevel = computeAssistanceLevel(gameData)

  const formattedSession = {
    gameType: 'game-a',
    createdAt: new Date().toISOString(),
    visualRecognitionRate,
    chronologyTimeInSeconds,
    assistanceLevel,
  }

  await addSessionToPatient(patientId, formattedSession)
  return formattedSession
}

async function listSessions(patientId) {
  if (!patientId || typeof patientId !== 'string' || !patientId.trim()) return []
  return getSessionsByPatient(patientId.trim())
}

module.exports = {
  listSessions,
  processAndSaveGameASession,
}
