const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { clearCache } = require('./duo');
const { clearGameBCache } = require('./game-b');

const router = new Router();

const UPLOADS_BASE = path.join(__dirname, '../../uploads');
const DB_BASE = path.join(__dirname, '../../database/media');

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac',
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getMetaPath(patientId) {
  ensureDir(DB_BASE);
  return path.join(DB_BASE, `${patientId}.json`);
}

function readMeta(patientId) {
  const p = getMetaPath(patientId);
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return [];
  }
}

function writeMeta(patientId, items) {
  fs.writeFileSync(getMetaPath(patientId), JSON.stringify(items, null, 2));
}

// memoryStorage : le fichier est en RAM → on l'écrit nous-mêmes dans le bon dossier
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    cb(null, ALLOWED_MIME_TYPES.includes(file.mimetype));
  },
});

// GET /api/media/:patientId
router.get('/:patientId', (req, res) => {
  const items = readMeta(req.params.patientId);
  res.json(items);
});

// POST /api/media/upload
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Fichier manquant ou type non autorisé.' });
  }

  const { patientId, title, kind, cueType, clinicalNote } = req.body;

  if (!patientId || !title || !kind) {
    return res.status(400).json({ error: 'Champs obligatoires manquants : patientId, title, kind.' });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const uid = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const fileName = `${uid}${ext}`;

  const dir = path.join(UPLOADS_BASE, patientId);
  ensureDir(dir);
  fs.writeFileSync(path.join(dir, fileName), req.file.buffer);

  const item = {
    id: `${patientId}-${kind}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    patientId,
    title: title.trim(),
    kind,
    fileName,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    cueType: cueType || 'object',
    clinicalNote: (clinicalNote || '').trim(),
    createdAt: new Date().toISOString(),
    source: 'upload',
  };

  const items = [item, ...readMeta(patientId)];
  writeMeta(patientId, items);

  clearCache(patientId);
  clearGameBCache(patientId);
  console.log(`[Media] Fichier sauvegardé : uploads/${patientId}/${fileName} (${Math.round(req.file.size / 1024)} KB) — caches invalidés.`);
  res.status(201).json(item);
});

// DELETE /api/media/:patientId/:itemId
router.delete('/:patientId/:itemId', (req, res) => {
  const { patientId, itemId } = req.params;
  const items = readMeta(patientId);
  const item = items.find((i) => i.id === itemId);

  if (!item) return res.status(404).json({ error: 'Média non trouvé.' });

  const filePath = path.join(UPLOADS_BASE, patientId, item.fileName);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  writeMeta(patientId, items.filter((i) => i.id !== itemId));
  clearCache(patientId);
  clearGameBCache(patientId);
  console.log(`[Media] Média ${itemId} supprimé — caches invalidés.`);
  res.json({ success: true });
});

module.exports = router;
