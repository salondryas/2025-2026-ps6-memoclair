const { Router } = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');

const router = new Router();

const UPLOADS_BASE = path.join(__dirname, '../../uploads');
const DB_BASE = path.join(__dirname, '../../database/media');
const CACHE_BASE = path.join(__dirname, '../../database/duo-cache');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDIhUppgwKfhRaFLCuZYp0PegoWNNqkl-I';
const GEMINI_HOST = 'generativelanguage.googleapis.com';
const GEMINI_PATH = `/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Limite par fichier : 3 MB en brut → ~4 MB en base64
const MAX_FILE_BYTES = 3 * 1024 * 1024;

const CUE_LABELS = {
  person: 'Personne / famille',
  location: 'Lieu / endroit',
  event: 'Événement',
  music: 'Musique / son',
};

function readMeta(patientId) {
  const p = path.join(DB_BASE, `${patientId}.json`);
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return [];
  }
}

// ── Cache des questions générées ──────────────────────────────
function getFingerprint(items) {
  // Empreinte basée sur les IDs triés — change si on ajoute/supprime un fichier
  return items.map((i) => i.id).sort().join('|');
}

function getCachePath(patientId) {
  if (!fs.existsSync(CACHE_BASE)) fs.mkdirSync(CACHE_BASE, { recursive: true });
  return path.join(CACHE_BASE, `${patientId}.json`);
}

function readCache(patientId) {
  const p = getCachePath(patientId);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function writeCache(patientId, rounds, fingerprint) {
  const entry = { fingerprint, rounds, generatedAt: new Date().toISOString() };
  fs.writeFileSync(getCachePath(patientId), JSON.stringify(entry, null, 2));
}

function clearCache(patientId) {
  const p = getCachePath(patientId);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}


function buildParts(items, patientName) {
  const parts = [];

  items.forEach((item, i) => {
    const filePath = path.join(UPLOADS_BASE, item.patientId, item.fileName);

    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      if (stat.size <= MAX_FILE_BYTES) {
        parts.push({
          inline_data: {
            mime_type: item.mimeType,
            data: fs.readFileSync(filePath).toString('base64'),
          },
        });
      } else {
        console.warn(`[Duo] Fichier trop volumineux (${Math.round(stat.size / 1024)}KB), description textuelle uniquement : ${item.fileName}`);
      }
    }

    parts.push({
      text: `Souvenir ${i + 1} — MOT-CLÉ : "${item.title}"
- Type : ${item.kind === 'image' ? 'Photo' : 'Audio / Musique'}
- Catégorie : ${CUE_LABELS[item.cueType] || item.cueType}
- Description : ${item.clinicalNote}`,
    });
  });

  parts.push({
    text: `Tu es un thérapeute spécialisé en réminiscence pour les patients atteints d'Alzheimer.
Le patient s'appelle ${patientName}.

Génère exactement ${items.length} questions de réminiscence pour une séance en mode duo (${patientName} + un proche aidant).

═══ RÈGLES STRICTES ═══

1. MOT-CLÉ INTERDIT dans la question : n'utilise JAMAIS le titre du souvenir, le nom de la personne, du lieu ou de l'événement. La question doit décrire ce qu'on VIT (image) ou ENTEND (audio) de façon sensorielle.

2. STRUCTURE DE LA QUESTION :
   - Pour une image : décris un détail visuel précis (bougies, uniforme, mer bleue, sourire...) puis pose une question d'identification douce.
   - Pour un audio : décris ce qu'on entend (voix, mélodie, ton...) puis pose la question.
   - Maximum 20 mots. Ton chaleureux, jamais stressant.

3. RÉPONSES — exactement 2 par joueur :
   - Réponse A (index 0) = BONNE RÉPONSE, toujours en premier.
   - Réponse B (index 1) = mauvaise réponse plausible et courte.
   - Pour l'aidant (3ème personne) : commence par "C'est..." ou "Il s'agit de..."
   - Pour le patient (1ère personne) : commence par "C'est mon/ma..." ou "Je..."

4. FEEDBACK : phrase courte et chaleureuse affichée si les deux trouvent la bonne réponse.

═══ EXEMPLES À SUIVRE EXACTEMENT ═══

MOT-CLÉ : "Anniversaire de Paul" (image)
→ question : "Toutes ces bougies allumées... Quel beau gâteau ! C'est votre fête ?"
→ choicesAidant : ["C'est son anniversaire à lui.", "C'est l'anniversaire d'un voisin."]
→ choicesAccueilli : ["Oui, c'est mon anniversaire !", "C'est une fête chez des amis."]
→ feedbackCorrect : "Quel beau souvenir ! Vous vous en souveniez bien."

MOT-CLÉ : "Nice, ville que Paul aime" (image)
→ question : "Regardez cette mer bleue et ce soleil... Est-ce une ville que vous connaissez ?"
→ choicesAidant : ["C'est Nice, sa ville préférée.", "C'est une ville inconnue."]
→ choicesAccueilli : ["C'est Nice, j'adore cette ville.", "C'est une ville où je n'ai jamais été."]
→ feedbackCorrect : "Exactement ! Ce coin de mer vous a toujours fait du bien."

MOT-CLÉ : "Service militaire de Paul" (image)
→ question : "Vous portez un bel uniforme sur cette photo. Qu'étiez-vous en train de faire ?"
→ choicesAidant : ["Il faisait son service militaire.", "Il était en vacances à la mer."]
→ choicesAccueilli : ["Je faisais mon service militaire.", "J'étais en vacances à la mer."]
→ feedbackCorrect : "Bravo ! Une période importante de votre vie."

MOT-CLÉ : "Audio de sa fille Arminya" (audio)
→ question : "Cette voix vous appelle 'Papa'... Qui est-ce qui vous parle ?"
→ choicesAidant : ["C'est sa fille Arminya.", "C'est une voix à la radio."]
→ choicesAccueilli : ["C'est ma fille Arminya.", "C'est une voix à la radio."]
→ feedbackCorrect : "Oui ! La voix d'Arminya est toujours reconnaissable."

═══ FORMAT DE SORTIE ═══

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
  });

  return parts;
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
  return 35000; // fallback 35s
}

async function callGemini(parts, attempt = 1) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 16384 },
    });

    const bodySizeMB = (Buffer.byteLength(body) / 1024 / 1024).toFixed(1);
    console.log(`[Duo] Tentative ${attempt} — taille requête : ${bodySizeMB} MB`);

    const options = {
      hostname: GEMINI_HOST,
      path: GEMINI_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', async () => {
        console.log(`[Duo] Réponse Gemini HTTP ${res.statusCode}, longueur : ${data.length} chars`);
        if (data.length < 500) console.log('[Duo] Réponse brute :', data);

        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          reject(new Error(`Réponse Gemini non parseable (HTTP ${res.statusCode}). Début : ${data.slice(0, 200)}`));
          return;
        }

        // Retry automatique si rate-limit (429) et première tentative
        if (res.statusCode === 429 && attempt === 1) {
          const delay = extractRetryDelay(parsed);
          console.log(`[Duo] Rate limit — retry dans ${delay / 1000}s…`);
          await sleep(delay);
          try {
            resolve(await callGemini(parts, 2));
          } catch (err) {
            reject(err);
          }
          return;
        }
        resolve(parsed);
      });
    });

    req.on('error', reject);
    req.setTimeout(120000, () => {
      req.destroy();
      reject(new Error('Timeout Gemini (120s).'));
    });
    req.write(body);
    req.end();
  });
}

function parseRounds(response, items, baseUrl) {
  // Erreur retournée par l'API Gemini
  if (response.error) {
    const msg = response.error.message || JSON.stringify(response.error);
    throw new Error(`Gemini API : ${msg}`);
  }

  // Contenu bloqué par les filtres de sécurité
  if (!response.candidates || response.candidates.length === 0) {
    const reason = response?.promptFeedback?.blockReason;
    throw new Error(reason
      ? `Contenu bloqué par Gemini (${reason}). Vérifiez les médias uploadés.`
      : 'Gemini n\'a retourné aucun candidat. Vérifiez la clé API.');
  }

  const candidate = response.candidates[0];
  const text = candidate?.content?.parts?.[0]?.text ?? '';

  if (!text) {
    throw new Error(`Gemini n'a pas généré de texte (finishReason: ${candidate?.finishReason || 'inconnue'}).`);
  }

  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`JSON invalide dans la réponse Gemini : ${cleaned.slice(0, 300)}`);
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Gemini n\'a pas retourné un tableau de questions valide.');
  }

  return parsed.map((round, i) => ({
    mediaType: items[i]?.kind === 'audio' ? 'audio' : 'image',
    mediaSrc: `${baseUrl}/uploads/${items[i].patientId}/${items[i].fileName}`,
    mediaAlt: items[i]?.title ?? '',
    mediaCaption: items[i]?.title ?? '',
    question: round.question,
    helper: round.helper,
    choicesAidant: round.choicesAidant,
    choicesAccueilli: round.choicesAccueilli,
    correctIndex: 0,
    feedbackCorrect: round.feedbackCorrect || round.feedbackAgree || 'Bravo, vous avez trouvé !',
  }));
}

// POST /api/duo/generate/:patientId
router.post('/generate/:patientId', async (req, res) => {
  const { patientId } = req.params;
  const { patientName } = req.body;

  const items = readMeta(patientId);

  if (items.length < 9) {
    return res.status(400).json({
      error: 'not_enough_media',
      message: `Il faut 9 médias pour générer les questions. Ce patient en a ${items.length}.`,
      count: items.length,
    });
  }

  const nineItems = items.slice(0, 9);
  const fingerprint = getFingerprint(nineItems);

  // Retourner le cache si la liste des médias n'a pas changé
  const cached = readCache(patientId);
  if (cached && cached.fingerprint === fingerprint) {
    console.log(`[Duo] Cache valide pour ${patientId} — pas d'appel Gemini.`);
    return res.json({ rounds: cached.rounds, fromCache: true });
  }

  console.log(`[Duo] Cache absent ou invalide pour ${patientId} — appel Gemini.`);

  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const parts = buildParts(nineItems, patientName || patientId);
    const geminiResponse = await callGemini(parts);
    const rounds = parseRounds(geminiResponse, nineItems, baseUrl);

    writeCache(patientId, rounds, fingerprint);
    console.log(`[Duo] Questions sauvegardées dans le cache pour ${patientId}.`);

    res.json({ rounds });
  } catch (err) {
    console.error('[Duo] Erreur génération:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.clearCache = clearCache;
