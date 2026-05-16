const { Router } = require('express')
const { getPatientStatistics, recordMetrics } = require('../controllers/statistics.controller')

const router = new Router()

router.get('/:patientId', getPatientStatistics)
router.post('/sessions', recordMetrics)

module.exports = router
