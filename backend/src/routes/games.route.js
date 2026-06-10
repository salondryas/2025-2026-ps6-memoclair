const { Router } = require('express')
const {
  generateGameB,
  generateDuo,
  getCachedGameB,
  updateGameBQuestion,
  deleteGameBQuestion,
  getCachedDuo,
  updateDuoRound,
  deleteDuoRound,
} = require('../controllers/games.controller')

const router = new Router()

router.post('/game-b/generate/:patientId', generateGameB)
router.post('/duo/generate/:patientId', generateDuo)
router.get('/game-b/cache/:patientId', getCachedGameB)
router.patch('/game-b/question/:patientId/:questionId', updateGameBQuestion)
router.delete('/game-b/question/:patientId/:questionId', deleteGameBQuestion)
router.get('/duo/cache/:patientId', getCachedDuo)
router.patch('/duo/round/:patientId/:roundIndex', updateDuoRound)
router.delete('/duo/round/:patientId/:roundIndex', deleteDuoRound)

module.exports = router
