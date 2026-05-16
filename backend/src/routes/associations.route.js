const { Router } = require('express')
const {
  listAssociations,
  setFamilyPatients,
  setPatientFamilies,
} = require('../controllers/associations.controller')

const router = new Router()

router.get('/', listAssociations)
router.put('/family/:familyId/patients', setFamilyPatients)
router.put('/patient/:patientId/families', setPatientFamilies)

module.exports = router
