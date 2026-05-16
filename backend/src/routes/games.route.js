const { Router } = require('express')
const { generateGameB, generateDuo } = require('../controllers/games.controller')

const router = new Router()

router.post('/game-b/generate/:patientId', generateGameB)
router.post('/duo/generate/:patientId', generateDuo)

module.exports = router
