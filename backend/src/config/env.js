const fs = require('fs')
const path = require('path')

try {
  const lines = fs.readFileSync(path.join(__dirname, '../../.env'), 'utf8').split(/\r?\n/)
  lines.forEach((line) => {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/)
    if (m && !process.env[m[1].trim()]) {
      process.env[m[1].trim()] = m[2].trim()
    }
  })
} catch (err) { /* .env is optional */ }

module.exports = {
  PORT: process.env.PORT || 9428,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
}
