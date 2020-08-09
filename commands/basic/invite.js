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