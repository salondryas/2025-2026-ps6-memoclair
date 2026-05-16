const levelsService = require('../services/levels.service')

async function getLevel(req, res, next) {
  try {
    res.json(await levelsService.getLevel(req.params.patientId))
  } catch (err) {
    next(err)
  }
}

async function adaptLevel(req, res, next) {
  try {
    res.json(await levelsService.adaptLevel(req.params.patientId, req.body || {}))
  } catch (err) {
    next(err)
  }
}

module.exports = { getLevel, adaptLevel }
