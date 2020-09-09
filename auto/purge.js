/**
 *  This file is part of Bazcal.
 *
 *  Bazcal is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  Bazcal is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with Bazcal.  If not, see <https://www.gnu.org/licenses/>.
 */

const { memberSchema } = require('../models/memberSchema');

async function channel_purge (client) {
    try {
        const cutoff = new Date(Date.now() - 180000); 
        const old_user_records = await memberSchema.find({ last_message: { $lt: cutoff }, channel_id: { $ne: undefined }});
        for (const doc of old_user_records) {
            try {
                const channel = client.guilds.cache.get(doc.server_id).channels.cache.get(doc.channel_id);
                await channel.delete();
                doc.channel_id = undefined;
                await doc.save()
            } catch (error) {
                console.log(error);
            }  
        }
    } catch (error) {
        console.log('Purge error', error);
    }
}

module.exports.channel_purge = channel_purge;