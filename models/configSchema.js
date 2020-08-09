const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
    category_id: {
        type: String,
        required: true
    },
    server_id: {
        type: String,
        required: true
    },
})

module.exports.configSchema = mongoose.model('ServerConfig', configSchema);