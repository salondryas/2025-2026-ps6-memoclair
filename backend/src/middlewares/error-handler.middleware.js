const logger = require('../utils/logger')

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500
  logger.error(`[${req.method} ${req.path}] ${err.message}`)
  res.status(status).json({ error: err.message })
}

module.exports = errorHandler
