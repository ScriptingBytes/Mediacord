const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ActionRowBuilder } = require('discord.js')
const schema = require('../../Schemas/profile');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Review/edit your account settings'),

    async execute (interaction, client) {
        await interaction.deferReply({ ephemeral: true })
        const { user } = interaction;
        const data = await schema.findOne({ userId: interaction.user.id });
        if (!data) return await interaction.editReply({ content: "It seems you don't have an account." });

        const privAcc = data.accountInfo.privateAcc
        const privPosts = data.accountInfo.privatePosts
        
        const enums = {
            "true": {
                color: ButtonStyle.Success,
                label: "Enabled"
            },
            "false": {
                color: ButtonStyle.Danger,
                label: "Disabled"
            }
        }

        const privAccBtn = new ButtonBuilder()
        .setCustomId('priv_acc_btn')
        .setLabel(`Private Account (${enums[`${privAcc}`].label})`)
        .setStyle(enums[`${privAcc}`].color)

        const privPostsBtn = new ButtonBuilder()
        .setCustomId('priv_post_btn')
        .setLabel(`Private Posts (${enums[`${privPosts}`].label})`)
        .setStyle(enums[`${privPosts}`].color)

        const postTrashBtn = new ButtonBuilder()
        .setCustomId('post_trash_btn')
        .setEmoji('🗑️')
        .setStyle(ButtonStyle.Secondary)

        const embed = new EmbedBuilder()
        .setColor('Blurple')
        .setTitle(`Mediacord - Settings`)
        .setDescription(`Enable or disable these settings using the control panel below.`)

        const btns = new ActionRowBuilder().setComponents(privAccBtn, privPostsBtn, postTrashBtn)

        await interaction.editReply({ embeds: [embed], components: [btns] })
    }
}