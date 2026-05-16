const profilesService = require('../services/profiles.service')

async function listSessions(req, res, next) {
  try {
    const sessions = await profilesService.listSessions(req.query.patientId)
    res.json(sessions)
  } catch (err) {
    next(err)
  }
}

async function recordSession(req, res, next) {
  try {
    const session = await profilesService.createSession(req.body || {})
    res.status(201).json(session)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  listSessions,
  recordSession,
}
