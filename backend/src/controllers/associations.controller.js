const profilesService = require('../services/profiles.service')

async function listAssociations(req, res, next) {
  try {
    const associations = await profilesService.listAssociations()
    res.json(associations)
  } catch (err) {
    next(err)
  }
}

async function setFamilyPatients(req, res, next) {
  try {
    const associations = await profilesService.setFamilyPatients(
      req.params.familyId,
      req.body.patientIds || [],
    )
    res.json(associations)
  } catch (err) {
    next(err)
  }
}

async function setPatientFamilies(req, res, next) {
  try {
    const associations = await profilesService.setPatientFamilies(
      req.params.patientId,
      req.body.familyIds || [],
    )
    res.json(associations)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  listAssociations,
  setFamilyPatients,
  setPatientFamilies,
}
