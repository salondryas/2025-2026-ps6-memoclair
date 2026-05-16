const path = require('path')
const { readFile, stat } = require('fs/promises')
const { callGemini, parseGeminiText } = require('./gemini.service')
const { readMeta } = require('../repositories/media.repository')
const {
  readCache, writeCache, getFingerprint,
} = require('../repositories/games-cache.repository')

const UPLOADS_BASE = path.join(__dirname, '../../uploads')
const GAME_B_CACHE = 'game-b-cache'
const DUO_CACHE = 'duo-cache'
const MAX_FILE_BYTES = 3 * 1024 * 1024

function pickRandom(arr, n) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = copy[i]
    copy[i] = copy[j]
    copy[j] = tmp
  }
  return copy.slice(0, n)
}

async function readFileAsBase64(filePath) {
  try {
    const stats = await stat(filePath)
    if (stats.size > MAX_FILE_BYTES) return null
    const buffer = await readFile(filePath)
    return buffer.toString('base64')
  } catch (err) {
    return null
  }
}

// ── Jeu B ─────────────────────────────────────────────────────

async function generateThirdChoices(rounds) {
  const questionsInfo = rounds
    .map((r, i) => `${i + 1}. Question : "${r.question}"\n   Bonne réponse : "${r.choicesAccueilli[0]}"\n   Mauvaise réponse existante : "${r.choicesAccueilli[1]}"`)
    .join('\n\n')

  const parts = [{
    text: `Pour chaque question de réminiscence ci-dessous, génère UNE SEULE mauvaise réponse supplémentaire.
Elle doit être :
- Plausible mais clairement fausse
- Courte (max 8 mots)
- À la 1ère personne, comme les réponses existantes
- Différente des réponses déjà données

${questionsInfo}

Réponds UNIQUEMENT avec un tableau JSON de ${rounds.length} chaînes de caractères, une par question :
["3ème choix Q1", "3ème choix Q2", ...]`,
  }]

  const response = await callGemini(parts)
  const cleaned = parseGeminiText(response)
  const result = JSON.parse(cleaned)
  if (!Array.isArray(result)) throw new Error('Réponse Gemini invalide pour les 3èmes choix.')
  return result
}

async function transformDuoToGameB(rounds) {
  const thirdChoices = await generateThirdChoices(rounds)
  return rounds.map((r, i) => ({
    id: `duo-${i}`,
    mediaType: r.mediaType,
    imageSrc: r.mediaType === 'image' ? r.mediaSrc : undefined,
    audioSrc: r.mediaType === 'audio' ? r.mediaSrc : undefined,
    question: r.question,
    source: 'Souvenir personnel',
    caption: r.mediaCaption || '',
    hint: r.helper || '',
    choices: [
      { id: 'a', label: r.choicesAccueilli[0], isCorrect: true },
      { id: 'b', label: r.choicesAccueilli[1], isCorrect: false },
      { id: 'c', label: thirdChoices[i] || '', isCorrect: false },
    ],
  }))
}

async function buildGameBParts(items, patientName) {
  const parts = []
  await Promise.all(items.map(async (item, i) => {
    const filePath = path.join(UPLOADS_BASE, item.patientId, item.fileName)
    const base64 = await readFileAsBase64(filePath)
    if (base64) {
      parts.push({ inline_data: { mime_type: item.mimeType, data: base64 } })
    }
    parts.push({
      text: `Souvenir ${i + 1} — MOT-CLÉ : "${item.title}"\n- Type : ${item.kind === 'image' ? 'Photo' : 'Audio / Musique'}\n- Description : ${item.clinicalNote}`,
    })
  }))

  parts.push({
    text: `Tu es un thérapeute spécialisé en réminiscence pour les patients atteints d'Alzheimer.
Le patient s'appelle ${patientName}.

Génère exactement ${items.length} questions de réminiscence pour une séance en mode solo.

═══ RÈGLES STRICTES ═══

1. MOT-CLÉ INTERDIT : n'utilise JAMAIS le titre du souvenir, le nom de la personne, du lieu ou de l'événement. Décris ce qu'on VIT (image) ou ENTEND (audio) de façon sensorielle.
2. Maximum 20 mots par question. Ton chaleureux, jamais stressant.
3. Exactement 3 choix : index 0 = bonne réponse, index 1 et 2 = mauvaises réponses plausibles.
4. hint : indice doux de maximum 8 mots.
5. caption : titre court (2 à 4 mots).
6. Tout en français.

Réponds UNIQUEMENT avec un tableau JSON valide de ${items.length} objets, sans markdown :
[
  {
    "question": "...",
    "hint": "...",
    "caption": "...",
    "choices": ["Bonne réponse", "Mauvaise réponse B", "Mauvaise réponse C"]
  }
]`,
  })
  return parts
}

function parseGameBQuestions(response, items, baseUrl) {
  const cleaned = parseGeminiText(response)
  const parsed = JSON.parse(cleaned)
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Gemini n'a pas retourné un tableau valide.")
  }
  return parsed.map((q, i) => {
    const item = items[i]
    const isAudio = item && item.kind === 'audio'
    const mediaSrc = `${baseUrl}/uploads/${item.patientId}/${item.fileName}`
    const choices = Array.isArray(q.choices) ? q.choices : []
    return {
      id: `gemini-${item.id}`,
      mediaType: isAudio ? 'audio' : 'image',
      imageSrc: isAudio ? undefined : mediaSrc,
      audioSrc: isAudio ? mediaSrc : undefined,
      question: q.question,
      source: 'Souvenir personnel',
      caption: q.caption || item.title,
      hint: q.hint,
      choices: [
        { id: 'a', label: choices[0] || '', isCorrect: true },
        { id: 'b', label: choices[1] || '', isCorrect: false },
        { id: 'c', label: choices[2] || '', isCorrect: false },
      ],
    }
  })
}

async function generateGameBQuestions(patientId, patientName, baseUrl) {
  const duoCache = await readCache(DUO_CACHE, patientId)

  if (duoCache && duoCache.rounds && duoCache.rounds.length) {
    const fingerprint = `duo-${duoCache.fingerprint}`
    const cached = await readCache(GAME_B_CACHE, patientId)
    if (cached && cached.fingerprint === fingerprint) {
      return { questions: cached.questions, fromCache: true }
    }
    const rounds = duoCache.rounds.slice(0, 4)
    const questions = await transformDuoToGameB(rounds)
    await writeCache(GAME_B_CACHE, patientId, fingerprint, { questions })
    return { questions }
  }

  const items = await readMeta(patientId)
  if (!items.length) return { questions: [] }

  const fingerprint = getFingerprint(items)
  const cached = await readCache(GAME_B_CACHE, patientId)
  if (cached && cached.fingerprint === fingerprint) {
    return { questions: cached.questions, fromCache: true }
  }

  const selected = pickRandom(items, Math.min(4, items.length))
  const parts = await buildGameBParts(selected, patientName || patientId)
  const response = await callGemini(parts)
  const questions = parseGameBQuestions(response, selected, baseUrl)
  await writeCache(GAME_B_CACHE, patientId, fingerprint, { questions })
  return { questions }
}

// ── Duo ───────────────────────────────────────────────────────

const CUE_LABELS = {
  person: 'Personne / famille',
  location: 'Lieu / endroit',
  event: 'Événement',
  music: 'Musique / son',
}

async function buildDuoParts(items, patientName) {
  const parts = []
  await Promise.all(items.map(async (item, i) => {
    const filePath = path.join(UPLOADS_BASE, item.patientId, item.fileName)
    const base64 = await readFileAsBase64(filePath)
    if (base64) {
      parts.push({ inline_data: { mime_type: item.mimeType, data: base64 } })
    }
    parts.push({
      text: `Souvenir ${i + 1} — MOT-CLÉ : "${item.title}"
- Type : ${item.kind === 'image' ? 'Photo' : 'Audio / Musique'}
- Catégorie : ${CUE_LABELS[item.cueType] || item.cueType}
- Description : ${item.clinicalNote}`,
    })
  }))

  parts.push({
    text: `Tu es un thérapeute spécialisé en réminiscence pour les patients atteints d'Alzheimer.
Le patient s'appelle ${patientName}.

Génère exactement ${items.length} questions de réminiscence pour une séance en mode duo (${patientName} + un proche aidant).

═══ RÈGLES STRICTES ═══

1. MOT-CLÉ INTERDIT dans la question.
2. Maximum 20 mots. Ton chaleureux, jamais stressant.
3. Réponse A (index 0) = BONNE RÉPONSE, toujours en premier.
4. Pour l'aidant (3ème personne) : commence par "C'est..." ou "Il s'agit de..."
5. Pour le patient (1ère personne) : commence par "C'est mon/ma..." ou "Je..."
6. FEEDBACK : phrase courte et chaleureuse si les deux trouvent la bonne réponse.

Réponds UNIQUEMENT avec un tableau JSON valide de ${items.length} objets, sans markdown :
[
  {
    "question": "...",
    "helper": "Conseil court et bienveillant pour l'aidant",
    "choicesAidant": ["Bonne réponse (3ème pers.)", "Mauvaise réponse plausible"],
    "choicesAccueilli": ["Bonne réponse (1ère pers.)", "Mauvaise réponse plausible"],
    "feedbackCorrect": "Phrase chaleureuse courte"
  }
]`,
  })
  return parts
}

function parseDuoRounds(response, items, baseUrl) {
  const cleaned = parseGeminiText(response)
  const parsed = JSON.parse(cleaned)
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Gemini n'a pas retourné un tableau de questions valide.")
  }
  return parsed.map((round, i) => {
    const item = items[i]
    return {
      mediaType: item && item.kind === 'audio' ? 'audio' : 'image',
      mediaSrc: `${baseUrl}/uploads/${item.patientId}/${item.fileName}`,
      mediaAlt: item && item.title ? item.title : '',
      mediaCaption: item && item.title ? item.title : '',
      question: round.question,
      helper: round.helper,
      choicesAidant: round.choicesAidant,
      choicesAccueilli: round.choicesAccueilli,
      correctIndex: 0,
      feedbackCorrect: round.feedbackCorrect || 'Bravo, vous avez trouvé !',
    }
  })
}

async function generateDuoRounds(patientId, patientName, baseUrl) {
  const items = await readMeta(patientId)
  if (items.length < 9) {
    const err = new Error(`Il faut 9 médias pour générer les questions. Ce patient en a ${items.length}.`)
    err.statusCode = 400
    err.errorCode = 'not_enough_media'
    err.count = items.length
    throw err
  }

  const nineItems = items.slice(0, 9)
  const fingerprint = getFingerprint(nineItems)
  const cached = await readCache(DUO_CACHE, patientId)
  if (cached && cached.fingerprint === fingerprint) {
    return { rounds: cached.rounds, fromCache: true }
  }

  const parts = await buildDuoParts(nineItems, patientName || patientId)
  const response = await callGemini(parts)
  const rounds = parseDuoRounds(response, nineItems, baseUrl)
  await writeCache(DUO_CACHE, patientId, fingerprint, { rounds })
  return { rounds }
}

module.exports = { generateGameBQuestions, generateDuoRounds }
