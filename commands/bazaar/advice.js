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

module.exports = class custom_adviceCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'advice',
            group: 'bazaar',
            memberName: 'advice',
            description: 'Gives fully customizable advice on what to trade in the Bazaar',
            aliases: ['advise', 'a'],
            details: 'It works like the normal `!bz advice` command, but:\n\n`volume_cap` is the minimum amount of items you would like to be recommended\n`count` is the amount of reccomendations you want to receive\n`stability` refers to having EMA filters enabled (yes) else (no)\n`safe` refers to you wanting to use the weekly_average (yes) or the hourly average (no)',
            args: [{
                    key: 'balance',
                    prompt: 'What is you in-game **balance**? (_amount of skyblock coins_)',
                    type: 'string'
                },
                {
                    key: 'volume_cap',
                    prompt: 'What is the minimum **amount of items** you want to get recommended?',
                    type: 'integer',
                    default: 50
                },
                {
                    key: 'count',
                    prompt: 'How many options do you want to receive? _max 10_',
                    type: 'integer',
                    default: 6,
                    max: 10,
                    min: 1
                },
                {
                    key: 'stability',
                    prompt: 'Do you want stability included? _Y/N_',
                    type: 'string',
                    parse: (res) => ['Y', 'YES', 'TRUE'].includes(res.toUpperCase()),
                    default: true
                },
                {
                    key: 'safe',
                    prompt: 'Do you want to use the weekly average (Y) or hourly average (N)? _Y/N_',
                    type: 'string',
                    parse: (res) => ['Y', 'YES', 'TRUE'].includes(res.toUpperCase()),
                    default: true
                }
            ]
        });
    }

    async run(message, {
        balance,
        volume_cap,
        count,
        stability,
        safe
    }) {
        const member = await message.client.provider.get_member(message);
        const channel = await message.client.provider.get_channel(message, member);

        member.last_message = new Date();
        member.channel_id = channel.id;

        await member.save();

        const parsed_balance = /\d[A-z]/.test(balance) ? message.client.provider.convert_number(balance) : parseFloat(balance);

        const advice = message.client.provider.advice(parsed_balance, volume_cap, count, stability, safe);

        let response = message.client.provider.format_advice(advice);
        response += '\n\n_This data is updated every 30 seconds_';

        message.say('Advice sent in your personal channel :-)');
        channel.send(`<@${message.author.id}>\n` + response);
    }
}