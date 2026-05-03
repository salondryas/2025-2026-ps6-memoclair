const { Router } = require('express');
const mediaRouter = require('./media');
const duoRouter = require('./duo');
const gameBRouter = require('./game-b');

const router = new Router();

router.get('/status', (req, res) => res.status(200).json('ok'));
router.use('/media', mediaRouter);
router.use('/duo', duoRouter);
router.use('/game-b', gameBRouter);

module.exports = router;
