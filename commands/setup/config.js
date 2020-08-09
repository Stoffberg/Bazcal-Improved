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

module.exports = class configCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'config',
            group: 'setup',
            memberName: 'config',
            description: 'Configures the server details to use commands',
            aliases: ['configure', 'setup']
        });
    }

    async run(message) {
        if (await message.client.provider.get_category(message)) return message.say('Finished setup! Feel free to use Bazcal\'s commands');
        return 'Something went wrong in regards to creating the category';
    }
}