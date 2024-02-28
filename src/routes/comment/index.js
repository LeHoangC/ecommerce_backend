const express = require('express')
const { authenticationV2 } = require('../../auth/authUtils')
const asyncHandler = require('../../helpers/asyncHandle')
const CommentController = require('../../controllers/comment.controller')

const router = express.Router()

// authentication

router.use(authenticationV2)

router.post('/', asyncHandler(CommentController.createComment))
router.get('/', asyncHandler(CommentController.getCommentParentById))
router.delete('/', asyncHandler(CommentController.deleteComment))

module.exports = router
