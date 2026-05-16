const { Router } = require('express')
const { getSettings, updateSettings } = require('../controllers/settings.controller')

const router = new Router()

router.get('/:patientId', getSettings)
router.put('/:patientId', updateSettings)

module.exports = router
