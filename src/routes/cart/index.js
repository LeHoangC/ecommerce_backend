const express = require('express')
const { authenticationV2 } = require('../../auth/authUtils')
const asyncHandler = require('../../helpers/asyncHandle')
const CartController = require('../../controllers/cart.controller')

const router = express.Router()

router.post('/', asyncHandler(CartController.addToCart))
router.post('/update', asyncHandler(CartController.update))
router.delete('/', asyncHandler(CartController.delete))
router.get('/', asyncHandler(CartController.listToCart))

// authentication

router.use(authenticationV2)

module.exports = router
