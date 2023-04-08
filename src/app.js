require('dotenv').config()
const compression = require('compression')
const express = require('express')
const { default: helmet } = require('helmet')
const morgan = require('morgan')
const { checkOverload } = require('./helpers/check.connect')
const app = express()

// init middlewares

app.use(express.json())
app.use(
    express.urlencoded({
        extended: true,
    })
)

app.use(morgan('dev'))
app.use(helmet())
app.use(compression())

// init db

require('./dbs/init.mongodb')
// checkOverload()

// init routes

app.use('/', require('./routes'))

app.use((req, res, next) => {
    const error = new Error('Not Found')
    error.status = 404
    next(error)
})

app.use((error, req, res, next) => {
    const statusCode = error.status || 500
    return res.status(statusCode).json({
        status: 'error',
        code: statusCode,
        stack: error.stack,
        message: error.message || 'Internal Server Error',
    })
})

module.exports = app
