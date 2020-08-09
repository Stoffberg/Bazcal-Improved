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