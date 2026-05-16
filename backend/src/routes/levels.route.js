const { Router } = require('express')
const { getLevel, adaptLevel } = require('../controllers/levels.controller')

const router = new Router()

router.get('/:patientId', getLevel)
router.post('/:patientId/adapt', adaptLevel)

module.exports = router
