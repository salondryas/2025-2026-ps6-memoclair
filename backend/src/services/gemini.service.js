const https = require('https')
const { GEMINI_API_KEY, GEMINI_MODEL } = require('../config/env')
const logger = require('../utils/logger')

const GEMINI_HOST = 'generativelanguage.googleapis.com'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function extractRetryDelay(errorBody) {
  const msg = errorBody && errorBody.error && errorBody.error.message ? errorBody.error.message : ''
  const match = msg.match(/retry in ([\d.]+)s/i)
  return match ? Math.ceil(parseFloat(match[1])) * 1000 : 35000
}

function callGemini(parts, options = {}, attempt = 1) {
  return new Promise((resolve, reject) => {
    if (!GEMINI_API_KEY) {
      reject(new Error('GEMINI_API_KEY manquante côté backend.'))
      return
    }

    const body = JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: options.temperature === undefined ? 0.7 : options.temperature,
        maxOutputTokens: options.maxOutputTokens === undefined ? 4096 : options.maxOutputTokens,
        thinkingConfig: { thinkingBudget: 0 },
      },
    })

    const payloadKb = (Buffer.byteLength(body) / 1024).toFixed(1)
    const partsInfo = parts.map((p) => (p.inline_data ? `[image ${p.inline_data.mime_type}]` : `[text ${p.text ? p.text.slice(0, 60).replace(/\n/g, ' ') : ''}…]`)).join(', ')
    logger.log(`[Gemini] tentative ${attempt} — modèle: ${GEMINI_MODEL} | payload: ${payloadKb} KB | parties: ${partsInfo}`)

    const startTime = Date.now()

    const requestOptions = {
      hostname: GEMINI_HOST,
      path: `/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }

    const req = https.request(requestOptions, (res) => {
      logger.log(`[Gemini] réponse HTTP ${res.statusCode} reçue après ${Date.now() - startTime} ms`)
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', async () => {
        logger.log(`[Gemini] corps complet reçu (${(data.length / 1024).toFixed(1)} KB) — total: ${Date.now() - startTime} ms`)
        let parsed
        try {
          parsed = JSON.parse(data)
        } catch (parseErr) {
          logger.log(`[Gemini] ERREUR parse JSON: ${data.slice(0, 200)}`)
          reject(new Error(`Réponse Gemini non parseable (HTTP ${res.statusCode}).`))
          return
        }

        if (parsed.error) {
          logger.log(`[Gemini] ERREUR API: ${JSON.stringify(parsed.error)}`)
        }

        if ((res.statusCode === 429 || res.statusCode === 503) && attempt <= 3) {
          const delay = res.statusCode === 429 ? extractRetryDelay(parsed) : 8000 * attempt
          logger.log(`[Gemini] ${res.statusCode} — attente ${delay} ms avant retry (tentative ${attempt + 1})`)
          await sleep(delay)
          try {
            resolve(await callGemini(parts, options, attempt + 1))
          } catch (err) {
            reject(err)
          }
          return
        }

        if (parsed.candidates && parsed.candidates[0]) {
          const finishReason = parsed.candidates[0].finishReason
          const tokenCount = parsed.usageMetadata ? JSON.stringify(parsed.usageMetadata) : 'inconnu'
          logger.log(`[Gemini] OK — finishReason: ${finishReason} | tokens: ${tokenCount}`)
        }

        resolve(parsed)
      })
    })

    req.on('error', (err) => {
      logger.log(`[Gemini] ERREUR réseau: ${err.message}`)
      reject(err)
    })
    req.setTimeout(options.timeoutMs === undefined ? 120000 : options.timeoutMs, () => {
      logger.log(`[Gemini] TIMEOUT après ${Date.now() - startTime} ms`)
      req.destroy()
      reject(new Error('Timeout Gemini.'))
    })
    req.write(body)
    req.end()
  })
}

function parseGeminiText(response) {
  if (response.error) throw new Error(`Gemini API : ${response.error.message}`)
  if (!response.candidates || response.candidates.length === 0) {
    const reason = response.promptFeedback ? response.promptFeedback.blockReason : null
    throw new Error(reason ? `Contenu bloqué par Gemini (${reason}).` : "Gemini n'a retourné aucun candidat.")
  }

  const candidate = response.candidates[0]
  const text = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0]
    ? candidate.content.parts[0].text
    : ''
  if (!text) {
    throw new Error(`Gemini n'a pas généré de texte (finishReason: ${candidate && candidate.finishReason ? candidate.finishReason : 'inconnue'}).`)
  }
  return text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
}

module.exports = { callGemini, parseGeminiText }
