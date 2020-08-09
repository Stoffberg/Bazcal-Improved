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