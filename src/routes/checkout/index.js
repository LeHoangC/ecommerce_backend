const express = require('express')
const { authenticationV2 } = require('../../auth/authUtils')
const asyncHandler = require('../../helpers/asyncHandle')
const checkoutController = require('../../controllers/checkout.controller')

const router = express.Router()

router.post('/review', asyncHandler(checkoutController.checkoutReview))

// authentication

router.use(authenticationV2)

module.exports = router
