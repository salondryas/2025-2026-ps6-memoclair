const { Router } = require('express')
const { listSessions, recordSession } = require('../controllers/sessions.controller')

const router = new Router()

router.get('/', listSessions)
router.post('/', recordSession)

module.exports = router
