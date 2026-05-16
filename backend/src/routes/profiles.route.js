const { Router } = require('express')
const {
  listProfiles,
  createProfile,
  deleteProfile,
} = require('../controllers/profiles.controller')

const router = new Router()

router.get('/', listProfiles)
router.post('/', createProfile)
router.delete('/:profileId', deleteProfile)

module.exports = router
