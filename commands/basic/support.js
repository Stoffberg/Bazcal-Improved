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

module.exports = class supportCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'support',
            group: 'basic',
            memberName: 'support',
            description: 'Provides the user with Bazcal\'s Official Support Server',
            aliases: ['server', 'sup']
        });
    }

    async run(message) {
        return message.reply('The link to our Official **Bazcalâ„¢** Discord Server:\nhttps://discord.gg/eHg6KC3');
    }
}