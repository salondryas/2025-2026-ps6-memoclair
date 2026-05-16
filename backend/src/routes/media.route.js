const { Router } = require('express')
const upload = require('../config/multer.config')
const { listMedia, uploadMedia, deleteMedia } = require('../controllers/media.controller')

const router = new Router()

router.get('/:patientId', listMedia)
router.post('/upload', upload.single('file'), uploadMedia)
router.delete('/:patientId/:itemId', deleteMedia)

module.exports = router
