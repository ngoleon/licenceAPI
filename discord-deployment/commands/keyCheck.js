const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('keycheck')
		.setDescription('Returns licence key duration for all products')
		.setDMPermission(false)
		.addUserOption(option =>
			option
				.setName('target')
				.setDescription('The member to retrieve the key from'))
        
}