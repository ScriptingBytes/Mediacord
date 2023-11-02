const { SlashCommandBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const schema = require('../../Schemas/guild-profile');
const { randomCode } = require('../../util/randomCode')
module.exports = {
    data: new SlashCommandBuilder()
    .setName('guild')
    .setDescription('Guild commands')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .setDMPermission(false)
    .addSubcommand(c => c
        .setName('autopost')
        .setDescription('Enable or disable autopost')
        .addStringOption(o => o.setName('choose').setDescription("Choose whether to enable or disable autoposting").addChoices(
            { name: "Enable", value: 'e' },
            { name: "Disable", value: 'd' },
        ).setRequired(true))
        .addChannelOption(o => o.setName('channel').setDescription("The channel to send the posting to").addChannelTypes(ChannelType.GuildText))
    ),

    async execute (interaction, client) {
        await interaction.deferReply({ ephemeral: true})
        const { options, guild } = interaction;
        
        const data = await schema.findOne({ guildId: guild.id })

        
        const chosen = options.getString('choose');
        const channel = options.getChannel('channel') || interaction.channel;
        if (chosen == 'e') {
            if (data) {
                await schema.updateOne({ guildId: guild.id }, { channelId: channel.id });
                return await interaction.editReply({ content: `Updated channel to: ${channel}.` });
            } else {
                await schema.create({
                    guildId: guild.id,
                    guildMediaId: await checkCode(randomCode(10, '###-###-####')),

                    channelId: channel.id,
                    autopost: true
                })
                return await interaction.editReply({ content: `Added autoposting to: ${channel}.` });
            }
        } else if (chosen == 'd') {
            if (!data || data.autopost == false) {
                return await interaction.editReply({ content: `Autoposting is already disabled` });
            } else {
                await schema.updateOne({ guildId: guild.id }, {
                    autopost: false
                })
                return await interaction.editReply({ content: `Autoposting has been disabled.` });
            }
        }
    }
}

async function checkCode(code) {
    const data = await schema.findOne({ mediaId: code });
    if (data) {
        const newCode = randomCode(12, '####-####-####')
        checkCode(newCode)
    } else {
        return code;
    }
}