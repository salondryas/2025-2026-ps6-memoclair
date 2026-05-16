const mediaService = require('../services/media.service')

async function listMedia(req, res, next) {
  try {
    const items = await mediaService.listMedia(req.params.patientId)
    res.json(items)
  } catch (err) {
    next(err)
  }
}

async function uploadMedia(req, res, next) {
  if (!req.file) {
    const err = new Error('Fichier manquant ou type non autorisé.')
    err.statusCode = 400
    return next(err)
  }

  try {
    const item = await mediaService.uploadMedia(req.body.patientId, req.file, req.body)
    return res.status(201).json(item)
  } catch (err) {
    return next(err)
  }
}

async function deleteMedia(req, res, next) {
  try {
    await mediaService.deleteMedia(req.params.patientId, req.params.itemId)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

module.exports = { listMedia, uploadMedia, deleteMedia }
