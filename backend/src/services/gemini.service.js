const https = require('https')
const { GEMINI_API_KEY, GEMINI_MODEL } = require('../config/env')

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
        maxOutputTokens: options.maxOutputTokens === undefined ? 16384 : options.maxOutputTokens,
      },
    })

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
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', async () => {
        let parsed
        try {
          parsed = JSON.parse(data)
        } catch (parseErr) {
          reject(new Error(`Réponse Gemini non parseable (HTTP ${res.statusCode}).`))
          return
        }

        if (res.statusCode === 429 && attempt === 1) {
          await sleep(extractRetryDelay(parsed))
          try {
            resolve(await callGemini(parts, options, 2))
          } catch (err) {
            reject(err)
          }
          return
        }

        resolve(parsed)
      })
    })

    req.on('error', reject)
    req.setTimeout(options.timeoutMs === undefined ? 120000 : options.timeoutMs, () => {
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
