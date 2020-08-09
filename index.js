
const path = require('path');
const schedule = require('node-schedule');

const { CommandoClient } = require('discord.js-commando');
const { BazcalSettingsProvider } = require('./utils/SettingsProvider.js');

const { discord_token, owner_id, server_invite} = require('./config.json');

const { channel_purge } = require('./auto/purge');
const { bazaar_cache } = require('./auto/cache');

const client = new CommandoClient({
	commandPrefix: '!bd ',
	owner: owner_id,
	invite: server_invite,
});

client.setProvider(new BazcalSettingsProvider);

schedule.scheduleJob('Purge', '*/1 * * * *', () => channel_purge(client));
schedule.scheduleJob('Cache', '*/30 * * * * *', () => bazaar_cache(client));

client.registry
	.registerDefaultTypes()
	.registerGroups([
		['basic', 'General commands'],
		['bazaar', 'Bazaar commands'],
        ['auction', 'Auction House commands'],
		['setup', 'Settings configured by server admins & owners']
	])
	.registerDefaultGroups()
	.registerDefaultCommands()
	.registerCommandsIn(path.join(__dirname, 'commands'));

client.once('ready', () => {
	console.log(`Logged in as ${client.user.tag}! (${client.user.id})`);
	client.user.setActivity('Hypixel Skyblock');
});

client.on('error', console.error);

client.login(discord_token);