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

const Commando = require('discord.js-commando');
const mongoose = require('mongoose');

const fs = require('fs');
const path = require('path');

const {
    memberSchema
} = require('../models/memberSchema');
const {
    configSchema
} = require('../models/configSchema');

const items = require('./items.json');

const auction_calculator = require('bazcal-lib/lib/auction/index').default;
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

class BazcalSettingsProvider extends Commando.SettingProvider {
    constructor() {
        super();
        this.item_cache = require('../data/cache.json');
    }

    async init() {
        mongoose.Promise = global.Promise;
        try {
            this.dbClient = await mongoose.connect('mongodb://localhost:27017', {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log('Connected with mongoose');
        } catch (err) {
            console.log(err);
            process.exit(-1);
        }

        const db = await open({
            filename: path.resolve(__dirname, './auctions.db'),
            driver: sqlite3.Database
        });

        const auction = new auction_calculator(db);

        auction.init();

        this.auction = auction;
    }

    async create_category(message, header, topic) {
        return await message.guild.channels.create(header, {
            type: 'category',
            topic: topic,
        });
    }

    async create_channel(message, header, topic, parent) {
        return await message.guild.channels.create(header, {
            type: 'text',
            topic: topic,
            permissionOverwrites: [{
                    id: message.guild.id,
                    deny: ['VIEW_CHANNEL'],
                },
                {
                    id: message.author.id,
                    allow: ['VIEW_CHANNEL'],
                }
            ],
            parent: parent
        });
    }

    async get_channel(message) {
        let member;
        let channel;

        member = await memberSchema.findOne({
            user_id: message.author.id,
            server_id: message.guild.id
        });

        if (!member) member = new memberSchema({
            user_id: message.author.id,
            server_id: message.guild.id,
            channel_id: '',
            last_message: new Date(),
            level: 1
        });

        if (member.channel_id) channel = message.guild.channels.cache.get(member.channel_id);
        if (channel) return {
            user: member,
            channel: channel
        };

        let category;
        let config = await configSchema.findOne({
            server_id: message.guild.id
        });

        if (!config) config = new configSchema({
            server_id: message.guild.id,
            category_id: ''
        });

        if (config.category_id) category = message.guild.channels.cache.get(config.category_id);
        if (!category) category = await this.create_category(message, '—————Dungeon—————', 'Contains all active games');

        channel = await this.create_channel(message, message.author.tag, 'Your personal channel', category);

        config.category_id = category.id;
        config.save();

        member.last_message = new Date();
        member.channel_id = channel.id;
        member.save();

        return {
            user: member,
            channel: channel
        };
    }

    reload_cache() {
        this.item_cache = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/cache.json')));
    }

    format_advice(array) {
        return array.map((item, i) => {
            let msg = `${i + 1}: **${items[item.name] ? items[item.name].name : item.name.replace('_', ' ')}**\n`
            msg += `Quantity: **${item.evolume}**\n`
            msg += `Invested: **${this.format_number(item.invested)}** _(${item.pinvested}%)_\n`
            msg += `Estimated Profit: **${this.format_number(item.eprofit)}** _(${item.pprofit}%)_\n`
            msg += `Sell price trend: **${item.gradient < 0 ? 'Product sell value decreasing' : 'Product sell value increasing'}**`
            return msg;
        }).join('\n\n');
    }

    format_lookup(item) {
        let msg = `**${item.name}**\n\n`
        msg += `Buy: **${this.format_number(item.buy)}**\n`
        msg += `Sell: **${this.format_number(item.sell)}**\n`
        msg += `Buy Volume: **${this.format_number(item.volume)}**\n`
        msg += `Sell Volume: **${this.format_number(item.svolume)}**\n`
        msg += `Buy trend: **${item.buy > item.buy_ema ? 'Value increasing' : 'Value decreasing'}**\n`
        msg += `Sell trend: **${item.sell > item.sell_ema ? 'Value increasing' : 'Value decreasing'}**`
        return msg;
    }

    format_number(number) {
        const formatter = new Intl.NumberFormat();

        function round(value, decimals) {
            return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
        }

        if (number >= 1000000) {
            return formatter.format(round(number / 1000000, 2)) + 'M'
        } else if (number >= 1000) {
            return formatter.format(round(number / 1000, 2)) + 'K'
        } else {
            return round(number, 2)
        }
    }

    convert_number(input) {
        let exp = /[A-z]+/.exec(input)
        let num = /[+-]?([0-9]*[.])?[0-9]+/.exec(input)

        if (exp[0].toUpperCase() == 'M' || exp[0].toUpperCase() == 'MIL') {
            return num[0] * 1000000
        } else if (exp[0].toUpperCase() == 'K') {
            return num[0] * 1000
        }

        return false;
    }

    advice(balance, volume_cap = 50, count = 6, stability = true, safe = true) {
        const unsorted = []
        for (const product_name in this.item_cache) {
            const product = this.item_cache[product_name]
            const demand = this.item_cache[product_name].demand

            const profit = (product.sell * 0.99) - product.buy

            let tvolume;
            if (!safe) {
                let average = 0;
                let saverage = 0;
                for (let val = demand.volume.length - 1; val > 5; val -= 5) {
                    average += demand.volume[val] - demand.volume[val - 5];
                    saverage += demand.svolume[val] - demand.svolume[val - 5];
                }

                const intervals = Math.floor(demand.volume.length / 5);
                average = average / intervals;
                saverage = saverage / intervals;

                tvolume = Math.min(product.volume / 2016 - average, product.svolume / 2016 - saverage);
            } else {
                tvolume = Math.min(product.volume, product.svolume) / 2016;
            }

            function limit(val, min, max) {
                return val < min ? min : (val > max ? max : val)
            }

            const evolume = Math.floor(limit(tvolume, 0, balance / product.buy));

            const eprofit = (evolume * profit)

            unsorted.push({
                'name': product_name,
                'evolume': evolume,
                'invested': (product.buy * evolume),
                'eprofit': eprofit,
                'pinvested': (((product.buy * evolume) * 100) / balance).toFixed(1),
                'pprofit': ((profit / product.buy) * 100).toFixed(1),
                'gradient': product.sell - product.sell_ema
            })
        }

        const sorted = unsorted.sort((a, b) => {
            return b.eprofit - a.eprofit
        })

        const low_volume_filter = (item) => item.evolume > volume_cap;
        sorted.filter(item => low_volume_filter(item));

        if (stability) {
            const buy_trend = (item) => this.item_cache[item.name].buy > this.item_cache[item.name].buy_ema;
            const sell_trend = (item) => this.item_cache[item.name].sell > this.item_cache[item.name].sell_ema;

            return sorted.filter(item => buy_trend(item) && sell_trend(item)).slice(0, count);
        }

        return sorted.slice(0, count);
    }

    async react_options(message, user_id, length) {
        const reactions = [
            "1️⃣",
            "2️⃣",
            "3️⃣",
            "4️⃣",
            "5️⃣",
            "6️⃣",
            "7️⃣",
            "8️⃣",
            "9️⃣",
            "🔟",
            "👍"
        ]

        for (let i = 0; i < length; i++) {
            await message.react(reactions[i])
        }

        await message.react('👍');

        const reaction_array = []

        async function awaitReaction(message) {
            const collected = await message.awaitReactions((reaction, user) => reactions.includes(reaction.emoji.name) && user.id === user_id, {
                max: 1,
                time: 60000,
                errors: ['time']
            })
            const reaction = collected.first()

            if (reaction.emoji.name != '👍') {
                reaction_array.push(reactions.indexOf(reaction.emoji.name))
                return await awaitReaction(message)
            }
        }

        try {
            await awaitReaction(message)
        } catch (error) {
            // ignore error
            message.delete();
            return false;
        }

        return reaction_array;
    }

    async react_binary(message, user_id) {
        await message.react('👍')
        await message.react('👎')

        try {
            const reaction = await message.awaitReactions((reaction, user) => ['👍', '👎'].includes(reaction.emoji.name) && user.id === user_id, {
                max: 1,
                time: 30000,
                errors: ['time']
            });

            return reaction.first().emoji.name === '👍'
        } catch {
            message.delete();
            return undefined;
        }
    }
}

module.exports.BazcalSettingsProvider = BazcalSettingsProvider;