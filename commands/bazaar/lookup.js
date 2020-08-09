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
const items = require('../../utils/items.json');

module.exports = class lookupCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'lookup',
            group: 'bazaar',
            memberName: 'lookup',
            description: 'Gives the current Bazaar info for an item',
            aliases: ['search', 'item'],
            args: [{
                key: 'item_name',
                prompt: 'What is the item\'s **name** you are searching for?',
                type: 'string',
                parse: (name) => name.toUpperCase().replace(/ /g, '_')
            }]
        });
    }

    async run(message, { item_name }) {
        const item_cache = require('../../data/cache.json');
        let item = item_cache[item_name];

        if (!item) {
            const item_id = Object.keys(items).find(id => items[id].name.toUpperCase() === item_name.toUpperCase());

            if (!item_id) return message.say(`Item with name **${item_name}** not found`);

            item = item_cache[item_id];
        }

        if (!item) return message.say(`Item with name **${item_name}** not found`);

        item.name = item_name.replace(/_/g, ' ').replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()});

        message.say(message.client.provider.format_lookup(item));
    }
}