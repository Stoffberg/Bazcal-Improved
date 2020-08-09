const {
    Command
} = require('discord.js-commando');

module.exports = class licenseCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'license',
            group: 'basic',
            memberName: 'license',
            description: 'Provides the user with Bazcal\'s license',
            aliases: ['about']
        });
    }

    async run(message) {
        return message.say('Bazcal - A highly customizable discord bot for Hypixel bazaar trading.\n\nCopyright Daniel Wykerd, Dirk Beukes 2020\n\n\`\`\`\nBazcal is free software: you can redistribute it and/or modify\nit under the terms of the GNU Affero General Public License as published by\nthe Free Software Foundation, either version 3 of the License, or\n(at your option) any later version.\n\nBazcal is distributed in the hope that it will be useful,\nbut WITHOUT ANY WARRANTY; without even the implied warranty of\nMERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\nGNU Affero General Public License for more details.\n\nYou should have received a copy of the GNU Affero General Public License\nalong with Bazcal.  If not, see <https://www.gnu.org/licenses/>.\n\`\`\`\n**NOTE:** This software depends on other packages that may be licensed under different open source licenses.\n\nThe source is freely available on Github here: https://github.com/Wykerd/bazcal');
    }
}