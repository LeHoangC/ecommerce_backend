const { model, Schema } = require('mongoose')

const DOCUMENT_NAME = 'Notification'
const COLLECTION_NAME = 'notifications'

/**
 * ORDER-001: order success
 * ORDER-001: order-faield
 * PROMOTION-001: new Promotion
 * SHOP-001: new product by User following
 */

const notificationSchema = new Schema(
    {
        noti_type: {
            type: String,
            enum: ['ORDER-001', 'ORDER-001', 'PROMOTION-001', 'SHOP-001'],
            required: true,
        },
        noti_senderId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Shop',
        },
        noti_receivedId: {
            type: Number,
            required: true,
        },
        noti_content: {
            type: String,
            required: true,
        },
        noti_options: {
            type: Object,
            default: {},
        },
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    }
)

module.exports = {
    NOTI: model(DOCUMENT_NAME, notificationSchema),
}
