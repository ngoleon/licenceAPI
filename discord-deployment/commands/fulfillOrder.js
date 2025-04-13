const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('fulfill-order')
		.setDescription('Fulfils a licence order')
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.setDMPermission(false)
		.addUserOption(option =>
			option
				.setName('target')
				.setDescription('The member to fulfil order to')
				.setRequired(true))
		.addIntegerOption(option =>
			option
				.setName("duration")
				.setDescription("The duration of license")
				.setRequired(true))
		.addStringOption(option => 
			option
				.setName('product')
				.setDescription('Product type')
				.setRequired(true)
				.addChoices(
					{name: `Demo`, value: `demo`}
				))
		.addIntegerOption(option =>
			option
				.setName("instances")
				.setDescription("none")
				.setRequired(true)
				.addChoices(
					{name: `1`, value: 1},
					{name: `2`, value: 2},
					{name: `3`, value: 3},
					{name: `4`, value: 4},
					{name: `5`, value: 5},
					{name: `6`, value: 6},
					{name: `7`, value: 7},
					{name: `8`, value: 8},
					{name: `9`, value: 9},
					{name: `10`, value: 10}
				))
}