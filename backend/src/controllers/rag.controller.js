const ragService = require('../services/rag.service')

async function indexPatient(req, res, next) {
  try {
    res.json(await ragService.indexPatient(req.params.patientId))
  } catch (err) {
    next(err)
  }
}

async function queryPatient(req, res, next) {
  try {
    res.json(await ragService.queryPatient(req.params.patientId, req.body.query, req.body || {}))
  } catch (err) {
    next(err)
  }
}

async function rememberInteraction(req, res, next) {
  try {
    res.status(201).json(await ragService.rememberInteraction(req.params.patientId, req.body || {}))
  } catch (err) {
    next(err)
  }
}

async function getFineTuningReadiness(req, res, next) {
  try {
    res.json(await ragService.getFineTuningReadiness())
  } catch (err) {
    next(err)
  }
}

module.exports = {
  indexPatient,
  queryPatient,
  rememberInteraction,
  getFineTuningReadiness,
}
