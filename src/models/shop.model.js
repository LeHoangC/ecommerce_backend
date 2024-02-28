const mongoose = require('mongoose') // Erase if already required

// Declare the Schema of the Mongo model

const DOCUMENT_NAME = 'Shop'
const COLLECTION_NAME = 'shops'

var shopSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            maxLength: 150,
        },
        email: {
            type: String,
            unique: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'inactive',
        },
        verify: {
            type: mongoose.Schema.Types.Boolean,
            default: false,
        },
        roles: {
            type: Array,
            default: [],
        },
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    }
)

//Export the model
module.exports = mongoose.model(DOCUMENT_NAME, shopSchema)
