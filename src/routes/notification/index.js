const express = require('express')
const { authenticationV2 } = require('../../auth/authUtils')
const asyncHandler = require('../../helpers/asyncHandle')
const NotificationController = require('../../controllers/notification.controller')

const router = express.Router()

// authentication

router.use(authenticationV2)

router.get('/', asyncHandler(NotificationController.listNotiByUser))

module.exports = router
