const { Router } = require('express')
const gamesRouter = require('./games.route')
const mediaRouter = require('./media.route')
const profilesRouter = require('./profiles.route')
const sessionsRouter = require('./sessions.route')
const associationsRouter = require('./associations.route')
const statisticsRouter = require('./statistics.route')
const settingsRouter = require('./settings.route')
const levelsRouter = require('./levels.route')
const ragRouter = require('./rag.route')

const router = new Router()

// Status endpoint
router.get('/status', (req, res) => res.status(200).json('ok'))

// Module routes
router.use('/', gamesRouter)
router.use('/media', mediaRouter)
router.use('/profiles', profilesRouter)
router.use('/sessions', sessionsRouter)
router.use('/associations', associationsRouter)
router.use('/statistics', statisticsRouter)
router.use('/settings', settingsRouter)
router.use('/levels', levelsRouter)
router.use('/rag', ragRouter)

module.exports = router
