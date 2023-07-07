const mongoose = require('mongoose') // Erase if already required

// Declare the Schema of the Mongo model

const DOCUMENT_NAME = 'Order'
const COLLECTION_NAME = 'orders'

var orderSchema = new mongoose.Schema(
    {
        order_userId: {
            type: Number,
            required: true,
        },
        order_checkout: {
            type: Object,
            default: {},
        },
        order_shipping: {
            type: Object,
            default: {},
        },
        order_payment: {
            type: Object,
            default: {},
        },
        order_product: {
            type: Array,
            required: true,
            default: [],
        },
        order_trackingNumber: {
            type: String,
            default: '#000129052023',
        },
        order_status: {
            type: String,
            enum: ['pending', 'confirmed', 'shipped', 'cancelled', 'delivered'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    }
)

//Export the model
module.exports = mongoose.model(DOCUMENT_NAME, orderSchema)
