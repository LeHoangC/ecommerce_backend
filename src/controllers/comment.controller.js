const { SuccessResponse } = require('../core/success.response')
const { createComment, getCommentParentById, deleteComment } = require('../services/comment.service')

class CommentController {
    createComment = async (req, res, next) => {
        new SuccessResponse({
            message: 'Created new comment',
            metadata: await createComment(req.body),
        }).send(res)
    }

    getCommentParentById = async (req, res, next) => {
        new SuccessResponse({
            message: 'get success',
            metadata: await getCommentParentById(req.query),
        }).send(res)
    }

    deleteComment = async (req, res, next) => {
        new SuccessResponse({
            message: 'deleted comment',
            metadata: await deleteComment(req.body),
        }).send(res)
    }
}

module.exports = new CommentController()
