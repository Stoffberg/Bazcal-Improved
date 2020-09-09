const {
    Command
} = require('discord.js-commando');

module.exports = class ahflipCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'ahflip',
            group: 'auction',
            memberName: 'ahflip',
            description: 'Gives fully customizable advice on what to trade in the Auction House',
            aliases: ['ahf', 'af', 'auction_flip', 'auc'],
            details: 'It works like the normal `!bz advice` command, but:\n\n`volume_cap` is the minimum amount of items you would like to be recommended\n`count` is the amount of reccomendations you want to receive\n`stability` refers to having EMA filters enabled (yes) else (no)\n`safe` refers to you wanting to use the weekly_average (yes) or the hourly average (no)',
            args: [{
                    key: 'max_bid',
                    prompt: 'How much **money** do you have to invest?',
                    type: 'string',
                },
                {
                    key: 'min_profit',
                    prompt: 'What is the **minimum amount of profit** you want to make?',
                    type: 'string',
                    default: '5k',
                },
                {
                    key: 'max_time_left',
                    prompt: 'What is the **max time** the auction can still be active?',
                    type: 'integer',
                    default: 600000
                },
                {
                    key: 'min_time_left',
                    prompt: 'What is the **min time** the auction can still be active?',
                    type: 'integer',
                    default: 60000
                },
                {
                    key: 'min_n',
                    prompt: 'What is the **minimum amount of samples** you would like analized in your prediction?',
                    type: 'integer',
                    default: 100
                }
            ]
        });
    }

    async run(message, {
        max_bid,
        min_profit,
        max_time_left,
        min_time_left,
        min_n
    }) {
        const {
            member,
            channel
        } = await message.client.provider.get_channel(message);

        const parser = value => /\d[A-z]/.test(value) ? message.client.provider.convert_number(value) : parseFloat(value);

        max_bid = parser(max_bid);
        min_profit = parser(min_profit);

        /** @type {import('bazcal-lib/lib/auction/index').default}  */
        const auction = message.client.provider.auction;
        
        const results = auction.getRandomFlips(max_bid, min_profit, max_time_left, min_time_left, min_n);

        channel.send(JSON.stringify(results, null, '  '));
    }
}