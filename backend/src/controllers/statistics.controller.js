const statisticsService = require('../services/statistics.service')

async function getPatientStatistics(req, res, next) {
  try {
    res.json(await statisticsService.getPatientStatistics(req.params.patientId))
  } catch (err) {
    next(err)
  }
}

async function recordMetrics(req, res, next) {
  try {
    res.status(201).json(await statisticsService.recordMetrics(req.body || {}))
  } catch (err) {
    next(err)
  }
}

module.exports = { getPatientStatistics, recordMetrics }
