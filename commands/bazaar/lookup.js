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