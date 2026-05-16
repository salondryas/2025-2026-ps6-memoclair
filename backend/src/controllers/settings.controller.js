const settingsService = require('../services/settings.service')

async function getSettings(req, res, next) {
  try {
    res.json(await settingsService.getSettings(req.params.patientId))
  } catch (err) {
    next(err)
  }
}

async function updateSettings(req, res, next) {
  try {
    res.json(await settingsService.updateSettings(req.params.patientId, req.body || {}))
  } catch (err) {
    next(err)
  }
}

module.exports = { getSettings, updateSettings }
