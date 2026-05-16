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

module.exports = { generateGameB, generateDuo }
