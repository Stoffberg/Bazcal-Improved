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