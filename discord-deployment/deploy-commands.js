const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
// node .\discord-deployment\deploy-commands.js for updating commands
const commands = [];
// Grab all the command files from the commands directory you created earlier
const commandFiles = fs.readdirSync('./discord-deployment/commands/').filter(file => file.endsWith('.js'));

const dotenv = require("dotenv").config();
const token = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(token);

// and deploy your commands!
(async () => {
	try {

		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			// Routes.applicationCommands("1059564882569203793"),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
	
})();