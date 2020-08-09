const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const { memberSchema } = require('../models/memberSchema');

const { api_key } = require('../config.json');

const range = 12;
const k = 2 / (range + 1);

const cache_fp = path.resolve(__dirname, '../data/cache.json');

let item_cache = {};

try {
    item_cache = JSON.parse(fs.readFileSync(cache_fp, 'utf-8'))
} catch (error) {
    // ignore error
}

const backupCache = () => fs.promises.writeFile(cache_fp, JSON.stringify(item_cache));

async function bazaar_cache (client) {
    try {
        const api_res = await fetch(`https://api.hypixel.net/skyblock/bazaar?key=${api_key}`);
        const json = await api_res.json();

        const items = Object.keys(json['products']).map(function (key) {
            try {
                return {
                    'name': json['products'][key]['product_id'],
                    'buy': json['products'][key]['sell_summary'][0]['pricePerUnit'] + 0.1,
                    'sell': json['products'][key]['buy_summary'][0]['pricePerUnit'] - 0.1,
                    'volume': json['products'][key]['quick_status']['buyMovingWeek'],
                    'svolume': json['products'][key]['quick_status']['sellMovingWeek']
                }
            } catch {
                return {
                    'name': json['products'][key]['product_id'],
                    'buy': -1,
                    'sell': -1,
                    'volume': json['products'][key]['quick_status']['buyMovingWeek'],
                    'svolume': json['products'][key]['quick_status']['sellMovingWeek']
                }
            }
        });

        const buy_point = [];
        const sell_point = [];

        for (const item of items) {
            if (!item_cache[item.name]) {
                item_cache[item.name] = {
                    buy: item.buy,
                    sell: item.sell,
                    volume: item.volume,
                    svolume: item.svolume,
                    buy_ema: item.buy,
                    sell_ema: item.sell,
                    demand: {
                        volume: [item.volume],
                        svolume: [item.svolume]
                    }
                }
            } else {
                const pre_b_ema = item_cache[item.name].buy_ema;
                const pre_s_ema = item_cache[item.name].sell_ema;
                const pre_b = item_cache[item.name].buy;
                const pre_s = item_cache[item.name].sell;

                item_cache[item.name].buy = item.buy;
                item_cache[item.name].sell = item.sell;
                item_cache[item.name].volume = item.volume;
                item_cache[item.name].svolume = item.svolume;

                item_cache[item.name].buy_ema = item.buy * k + pre_b_ema * (1 - k);
                item_cache[item.name].sell_ema = item.sell * k + pre_s_ema * (1 - k);

                item_cache[item.name].demand.volume.push(item.volume);
                item_cache[item.name].demand.svolume.push(item.svolume);

                if (item_cache[item.name].demand.volume.length > 120) {
                    item_cache[item.name].demand.volume.shift()
                    item_cache[item.name].demand.svolume.shift()
                }

                if ((pre_b <= pre_b_ema) && (item.buy > item_cache[item.name].buy_ema)) buy_point.push(item.name);
                if ((pre_s >= pre_s_ema) && (item.sell < item_cache[item.name].sell_ema)) sell_point.push(item.name);
            }
        }

        for (const item_id of sell_point) {
            const members = await memberSchema.find({ orders: item_id });

            for (const member of members) {
                try {
                    const channel = client.guilds.cache.get(member.server_id).channels.cache.get(member.channel_id);

                    if (channel) channel.send(`<@${member.user_id}> You need to sell all your **${item_name(item_id)}** right now!`);

                    member.orders = member.orders.filter(ord => ord !== item_id);
                    if (!member.orders.length) channel.setTopic('No orders in queue. This channel will be deleted in 3 minutes after the last message has been sent.');

                    member.last_message = new Date();

                    await member.save();  
                } catch (error) {
                    await member.remove()
                }
            }
        }
        await backupCache();
        client.provider.reload_cache()
    } catch (error) {
        console.log('Cache error', error);
    }
}

module.exports.item_cache = item_cache;
module.exports.bazaar_cache = bazaar_cache;