const { memberSchema } = require('../models/memberSchema');

async function channel_purge (client) {
    try {
        const cutoff = new Date(Date.now() - 180000); 
        const old_user_records = await memberSchema.find({ last_message: { $lt: cutoff }, channel_id: { $exists: true }});
        for (const doc of old_user_records) {
            try {
                const channel = client.guilds.cache.get(doc.server_id).channels.cache.get(doc.channel_id);
                await channel.delete();
            } catch (error) {
                console.log(error);
            }
            doc.remove();
        }
    } catch (error) {
        console.log('Purge error', error);
    }
}

module.exports.channel_purge = channel_purge;