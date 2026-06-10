const gamesService = require('../services/games.service')

async function generateGameB(req, res, next) {
  try {
    const { patientId } = req.params
    const { patientName } = req.body
    const baseUrl = `${req.protocol}://${req.get('host')}`
    const result = await gamesService.generateGameBQuestions(patientId, patientName, baseUrl)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

async function generateDuo(req, res, next) {
  try {
    const { patientId } = req.params
    const { patientName } = req.body
    const baseUrl = `${req.protocol}://${req.get('host')}`
    const result = await gamesService.generateDuoRounds(patientId, patientName, baseUrl)
    return res.json(result)
  } catch (err) {
    if (err.errorCode === 'not_enough_media') {
      return res.status(400).json({
        error: err.errorCode,
        message: err.message,
        count: err.count,
      })
    }
    return next(err)
  }
}

async function getCachedGameB(req, res, next) {
  try {
    const { patientId } = req.params
    const result = await gamesService.getCachedGameBQuestions(patientId)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

async function updateGameBQuestion(req, res, next) {
  try {
    const { patientId, questionId } = req.params
    const updated = await gamesService.updateGameBQuestion(patientId, questionId, req.body)
    if (!updated) return res.status(404).json({ error: 'cache_not_found' })
    return res.json(updated)
  } catch (err) {
    return next(err)
  }
}

async function deleteGameBQuestion(req, res, next) {
  try {
    const { patientId, questionId } = req.params
    await gamesService.deleteGameBQuestion(patientId, questionId)
    return res.status(204).end()
  } catch (err) {
    return next(err)
  }
}

async function getCachedDuo(req, res, next) {
  try {
    const { patientId } = req.params
    const result = await gamesService.getCachedDuoRounds(patientId)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

async function updateDuoRound(req, res, next) {
  try {
    const { patientId } = req.params
    const roundIndex = parseInt(req.params.roundIndex, 10)
    if (Number.isNaN(roundIndex)) return res.status(400).json({ error: 'invalid_index' })
    const updated = await gamesService.updateDuoRound(patientId, roundIndex, req.body)
    if (!updated) return res.status(404).json({ error: 'cache_not_found' })
    return res.json(updated)
  } catch (err) {
    return next(err)
  }
}

async function deleteDuoRound(req, res, next) {
  try {
    const { patientId } = req.params
    const roundIndex = parseInt(req.params.roundIndex, 10)
    if (Number.isNaN(roundIndex)) return res.status(400).json({ error: 'invalid_index' })
    await gamesService.deleteDuoRound(patientId, roundIndex)
    return res.status(204).end()
  } catch (err) {
    return next(err)
  }
}

module.exports = {
  generateGameB,
  generateDuo,
  getCachedGameB,
  updateGameBQuestion,
  deleteGameBQuestion,
  getCachedDuo,
  updateDuoRound,
  deleteDuoRound,
}
