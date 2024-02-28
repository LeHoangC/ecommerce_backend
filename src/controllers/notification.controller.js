const { SuccessResponse } = require('../core/success.response')
const { listNotiByUser } = require('../services/notification.service')

class NotificationController {
    listNotiByUser = async (req, res, next) => {
        new SuccessResponse({
            message: 'Created new listNotiByUser',
            metadata: await listNotiByUser(req.body),
        }).send(res)
    }
}

module.exports = new NotificationController()
