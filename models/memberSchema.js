const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    channel_id: {
        type: String
    },
    server_id: {
        type: String,
        required: true
    },
    last_message: {
        type: Date,
        required: true
    },
    orders: {
        type: [ String ],
        default: []
    }
});

module.exports.memberSchema = mongoose.model('Members', memberSchema);