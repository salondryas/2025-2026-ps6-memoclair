const profilesService = require('../services/profiles.service')

async function listProfiles(req, res, next) {
  try {
    const profiles = await profilesService.listProfiles(req.query.type)
    res.json(profiles)
  } catch (err) {
    next(err)
  }
}

async function createProfile(req, res, next) {
  try {
    const profile = await profilesService.createProfile(req.body)
    res.status(201).json(profile)
  } catch (err) {
    next(err)
  }
}

async function deleteProfile(req, res, next) {
  try {
    await profilesService.deleteProfile(req.params.profileId)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

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
    const result = await profilesService.setFamilyPatients(
      req.params.familyId,
      req.body.patientIds || [],
    )
    res.json(result)
  } catch (err) {
    next(err)
  }
}

async function setPatientFamilies(req, res, next) {
  try {
    const result = await profilesService.setPatientFamilies(
      req.params.patientId,
      req.body.familyIds || [],
    )
    res.json(result)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  listProfiles,
  createProfile,
  deleteProfile,
  listAssociations,
  setFamilyPatients,
  setPatientFamilies,
}
