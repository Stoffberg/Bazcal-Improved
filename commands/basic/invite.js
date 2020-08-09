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

const {
    Command
} = require('discord.js-commando');

module.exports = class inviteCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'invite',
            group: 'basic',
            memberName: 'invite',
            description: 'Provides the user with Bazcal\'s invite link',
            aliases: ['i', 'inv']
        });
    }

    async run(message) {
        return message.reply('The invite link to add Bazcal to your own server:\nhttps://discord.com/api/oauth2/authorize?client_id=715462011256832090&permissions=76880&scope=bot');
    }
}