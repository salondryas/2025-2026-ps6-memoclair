const { Router } = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');

const router = new Router();

const UPLOADS_BASE = path.join(__dirname, '../../uploads');
const DB_BASE = path.join(__dirname, '../../database/media');
const CACHE_BASE = path.join(__dirname, '../../database/game-b-cache');
const DUO_CACHE_BASE = path.join(__dirname, '../../database/duo-cache');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDIhUppgwKfhRaFLCuZYp0PegoWNNqkl-I';
const GEMINI_HOST = 'generativelanguage.googleapis.com';
const GEMINI_PATH = `/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const MAX_FILE_BYTES = 3 * 1024 * 1024;

// ── Lecture des métadonnées médias ────────────────────────────
function readMeta(patientId) {
  const p = path.join(DB_BASE, `${patientId}.json`);
  if (!fs.existsSync(p)) return [];
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return []; }
}

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

// ── Cache game-b ──────────────────────────────────────────────
function readCache(patientId) {
  ensureDir(CACHE_BASE);
  const p = path.join(CACHE_BASE, `${patientId}.json`);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function writeCache(patientId, questions, fingerprint) {
  ensureDir(CACHE_BASE);
  fs.writeFileSync(
    path.join(CACHE_BASE, `${patientId}.json`),
    JSON.stringify({ fingerprint, questions, generatedAt: new Date().toISOString() }, null, 2),
  );
}

function clearCache(patientId) {
  const p = path.join(CACHE_BASE, `${patientId}.json`);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

module.exports.clearGameBCache = clearCache;

// ── Cache duo (lecture seule) ─────────────────────────────────
function readDuoCache(patientId) {
  const p = path.join(DUO_CACHE_BASE, `${patientId}.json`);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

// ── Utilitaires ───────────────────────────────────────────────
function getFingerprint(items) {
  return items.map((i) => i.id).sort().join('|');
}

function pickRandom(arr, n) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractRetryDelay(errorBody) {
  try {
    const msg = errorBody?.error?.message || '';
    const match = msg.match(/retry in ([\d.]+)s/i);
    if (match) return Math.ceil(parseFloat(match[1])) * 1000;
  } catch { /* ignore */ }
  return 35000;
}

// ── Appel Gemini générique ────────────────────────────────────
function callGemini(parts, attempt = 1) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 16384 },
    });

    const bodySizeMB = (Buffer.byteLength(body) / 1024 / 1024).toFixed(1);
    console.log(`[GameB] Tentative ${attempt} — taille requête : ${bodySizeMB} MB`);

    const options = {
      hostname: GEMINI_HOST,
      path: GEMINI_PATH,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', async () => {
        console.log(`[GameB] Réponse Gemini HTTP ${res.statusCode}, longueur : ${data.length} chars`);
        if (data.length < 500) console.log('[GameB] Réponse brute :', data);

        let parsed;
        try { parsed = JSON.parse(data); } catch {
          reject(new Error(`Réponse Gemini non parseable (HTTP ${res.statusCode}). Début : ${data.slice(0, 200)}`));
          return;
        }

        if (res.statusCode === 429 && attempt === 1) {
          const delay = extractRetryDelay(parsed);
          console.log(`[GameB] Rate limit — retry dans ${delay / 1000}s…`);
          await sleep(delay);
          try { resolve(await callGemini(parts, 2)); } catch (err) { reject(err); }
          return;
        }

        resolve(parsed);
      });
    });

    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('Timeout Gemini (120s).')); });
    req.write(body);
    req.end();
  });
}

function parseGeminiText(response) {
  if (response.error) throw new Error(`Gemini API : ${response.error.message}`);
  if (!response.candidates?.length) throw new Error("Gemini n'a retourné aucun candidat.");
  const candidate = response.candidates[0];
  const text = candidate?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error(`Gemini n'a pas généré de texte (finishReason: ${candidate?.finishReason || 'inconnue'}).`);
  return text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
}

// ── CHEMIN 1 : Depuis les questions duo ───────────────────────
// Génère un 3ème choix faux pour chaque round duo via un appel texte léger
async function generateThirdChoices(rounds) {
  const questionsInfo = rounds.map((r, i) =>
    `${i + 1}. Question : "${r.question}"\n   Bonne réponse : "${r.choicesAccueilli[0]}"\n   Mauvaise réponse existante : "${r.choicesAccueilli[1]}"`
  ).join('\n\n');

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
  }];

  console.log(`[GameB] Génération des 3èmes choix pour ${rounds.length} questions duo…`);
  const response = await callGemini(parts);
  const cleaned = parseGeminiText(response);
  const result = JSON.parse(cleaned);
  if (!Array.isArray(result)) throw new Error('Réponse Gemini invalide pour les 3èmes choix.');
  return result;
}

// Transforme les rounds duo en questions game-b (3 choix)
async function transformDuoToGameB(rounds) {
  const thirdChoices = await generateThirdChoices(rounds);

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
  }));
}

// ── CHEMIN 2 : Depuis les médias (fallback si pas de cache duo) ─
function buildParts(items, patientName) {
  const parts = [];

  items.forEach((item, i) => {
    const filePath = path.join(UPLOADS_BASE, item.patientId, item.fileName);
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      if (stat.size <= MAX_FILE_BYTES) {
        parts.push({ inline_data: { mime_type: item.mimeType, data: fs.readFileSync(filePath).toString('base64') } });
      } else {
        console.warn(`[GameB] Fichier trop volumineux (${Math.round(stat.size / 1024)}KB) : ${item.fileName}`);
      }
    }
    parts.push({
      text: `Souvenir ${i + 1} — MOT-CLÉ : "${item.title}"\n- Type : ${item.kind === 'image' ? 'Photo' : 'Audio / Musique'}\n- Description : ${item.clinicalNote}`,
    });
  });

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
  });

  return parts;
}

function parseQuestionsFromMedia(response, items, baseUrl) {
  const cleaned = parseGeminiText(response);

  let parsed;
  try { parsed = JSON.parse(cleaned); } catch {
    throw new Error(`JSON invalide dans la réponse Gemini : ${cleaned.slice(0, 300)}`);
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Gemini n'a pas retourné un tableau valide.");
  }

  return parsed.map((q, i) => {
    const item = items[i];
    const isAudio = item?.kind === 'audio';
    const mediaSrc = `${baseUrl}/uploads/${item.patientId}/${item.fileName}`;
    const choices = Array.isArray(q.choices) ? q.choices : [];
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
    };
  });
}

// ── Route principale ──────────────────────────────────────────
router.post('/generate/:patientId', async (req, res) => {
  const { patientId } = req.params;
  const { patientName } = req.body;

  // ── Chemin 1 : questions identiques au duo ────────────────
  const duoCache = readDuoCache(patientId);
  if (duoCache?.rounds?.length) {
    const fingerprint = `duo-${duoCache.fingerprint}`;
    const cached = readCache(patientId);

    if (cached && cached.fingerprint === fingerprint) {
      console.log(`[GameB] ✓ Cache valide (depuis duo) pour ${patientId}.`);
      return res.json({ questions: cached.questions, fromCache: true });
    }

    console.log(`[GameB] Transformation des questions duo pour ${patientId} (${duoCache.rounds.length} rounds)…`);
    try {
      // Prendre les 4 premiers rounds du duo
      const rounds = duoCache.rounds.slice(0, 4);
      const questions = await transformDuoToGameB(rounds);
      writeCache(patientId, questions, fingerprint);
      console.log(`[GameB] ${questions.length} questions (depuis duo) sauvegardées.`);
      return res.json({ questions });
    } catch (err) {
      console.error('[GameB] Erreur transformation duo, fallback sur médias :', err.message);
      // Fall through to media-based generation
    }
  }

  // ── Chemin 2 : fallback — génération depuis les médias ────
  const allItems = readMeta(patientId);
  if (!allItems.length) {
    return res.json({ questions: [] });
  }

  const fingerprint = getFingerprint(allItems);
  const cached = readCache(patientId);
  console.log(`[GameB] fingerprint médias : ${fingerprint}`);

  if (cached && cached.fingerprint === fingerprint) {
    console.log(`[GameB] ✓ Cache valide (médias) pour ${patientId}.`);
    return res.json({ questions: cached.questions, fromCache: true });
  }

  const items = pickRandom(allItems, Math.min(4, allItems.length));
  console.log(`[GameB] Génération Gemini depuis médias pour ${patientId} (${items.length} médias)…`);

  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const parts = buildParts(items, patientName || patientId);
    const geminiResponse = await callGemini(parts);
    const questions = parseQuestionsFromMedia(geminiResponse, items, baseUrl);
    writeCache(patientId, questions, fingerprint);
    console.log(`[GameB] ${questions.length} questions (médias) sauvegardées.`);
    res.json({ questions });
  } catch (err) {
    console.error('[GameB] Erreur:', err.message);
    res.status(500).json({ error: err.message, questions: [] });
  }
});

module.exports = router;
module.exports.clearGameBCache = clearCache;
