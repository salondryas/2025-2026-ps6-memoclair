const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const path = require('path')

const { PORT } = require('./config/env')
const logger = require('./utils/logger')
const errorHandler = require('./middlewares/error-handler.middleware')
const apiRouter = require('./routes')

const app = express()

app.disable('x-powered-by')
app.use(cors())
app.use(bodyParser.json({ limit: '10mb' }))
app.use(morgan('[:date[iso]] :method :url :status :response-time ms - :res[content-length]'))
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.use('/api', apiRouter)

app.use(errorHandler)
app.use('*', (req, res) => res.status(404).end())

app.listen(PORT, () => logger.info(`Server is listening on port ${PORT}`))
