const { Router } = require('express')
const {
  indexPatient,
  queryPatient,
  rememberInteraction,
  getFineTuningReadiness,
} = require('../controllers/rag.controller')

const router = new Router()

router.get('/fine-tuning/readiness', getFineTuningReadiness)
router.post('/:patientId/index', indexPatient)
router.post('/:patientId/query', queryPatient)
router.post('/:patientId/memory', rememberInteraction)

module.exports = router
