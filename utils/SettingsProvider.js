const Commando = require('discord.js-commando');
const mongoose = require('mongoose');
const ms = require('ms');

const {
    memberSchema
} = require('../models/memberSchema');
const {
    configSchema
} = require('../models/configSchema');

const items = require('./items.json');

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
    }

    async get_category(message) {
        const guild = message.guild;

        let config = await configSchema.findOne({
            server_id: message.guild.id
        });

        let category = await guild.channels.cache.get(config ? config.category_id : 0);

        if (category) return message.say(`Category was found in your server with ID: ${category.id}`);

        if (config) config.remove();

        try {
            category = await guild.channels.create('——————Bazcal——————', {
                type: 'category',
                topic: 'Contains all the Bazcal channels',
            });
        } catch (error) {
            return message.say('\`Permission error\` Could not create category');
        }

        config = new configSchema({
            server_id: message.guild.id,
            category_id: category.id
        })

        await config.save()

        return category;
    }

    async get_member(message) {
        let member = await memberSchema.findOne({
            user_id: message.author.id,
            server_id: message.guild.id
        })

        const channel = await this.get_channel(message, member);

        if (!member) {
            member = new memberSchema({
                user_id: message.author.id,
                server_id: message.guild.id,
                channel_id: channel.id,
                last_message: new Date(),
                orders: []
            })
        }

        return member;
    }

    async get_channel(message, member) {
        if (member && member.channel_id) {
            try {
                const channel = await message.guild.channels.cache.get(member.channel_id)
                if (channel) return channel;
            } catch (error) {
                member.channel_id = '';
            }
        }

        const server = message.guild;
        const name = message.author.tag.replace(/#/g, '_');
        const parent = await configSchema.findOne({
            server_id: message.guild.id
        });

        let category = await message.guild.channels.cache.get(parent.category_id);
        if (!category) category = await this.get_category(message);

        const channel = await server.channels.create(`bz_${name}`, {
            type: 'text',
            topic: 'This channel will be deleted after 3 minutes if you have no pending orders',
            permissionOverwrites: [{
                    id: message.guild.id,
                    deny: ['VIEW_CHANNEL'],
                },
                {
                    id: message.author.id,
                    allow: ['VIEW_CHANNEL'],
                }
            ],
            parent: category.id
        });

        return channel;
    }

    reload_cache() {
        this.item_cache = require('../data/cache.json');
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

                tvolume = Math.min(product.volume / 2016 - average, product.svolume  / 2016 - saverage);
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