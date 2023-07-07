const express = require('express')
const { apiKey, permission } = require('../auth/checkAuth')
const { pushToLogDiscord } = require('../middlewares')

const router = express.Router()

// check apikey

router.use(pushToLogDiscord)

router.use(apiKey)

// check permission

router.use(permission('0000'))

router.use('/v1/api/inventory', require('./inventory'))
router.use('/v1/api/checkout', require('./checkout'))
router.use('/v1/api/discount', require('./discount'))
router.use('/v1/api/cart', require('./cart'))
router.use('/v1/api/product', require('./product'))
router.use('/v1/api/shop', require('./access'))

module.exports = router
