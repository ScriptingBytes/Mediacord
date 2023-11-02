const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js')
const schema = require('../../Schemas/profile');

module.exports = {
    customId: "priv_post_btn",

    async execute (interaction, client) {
        const { user } = interaction;
        const data = await schema.findOne({ userId: interaction.user.id });
        if (!data) return await interaction.editReply({ content: "It seems you don't have an account." });

        let privAcc = data.accountInfo.privateAcc
        const privPosts = data.accountInfo.privatePosts

        const enums = {
            "true": {
                color: ButtonStyle.Success,
                label: "Enabled",
                opposite: {
                    val: false,
                    label: "Disabled",
                    color: ButtonStyle.Danger
                }
            },
            "false": {
                color: ButtonStyle.Danger,
                label: "Disabled",
                opposite: {
                    val: true,
                    label: "Enabled",
                    color: ButtonStyle.Success
                }
            }
        }

        await schema.updateOne({ userId: user.id }, { 'accountInfo.privatePosts': enums[`${privPosts}`].opposite.val })

        const privAccBtn = new ButtonBuilder()
        .setCustomId('priv_acc_btn')
        .setLabel(`Private Account (${enums[`${privAcc}`].label})`)
        .setStyle(enums[`${privAcc}`].color)

        const privPostsBtn = new ButtonBuilder()
        .setCustomId('priv_post_btn')
        .setLabel(`Private Posts (${enums[`${privPosts}`].opposite.label})`)
        .setStyle(enums[`${privPosts}`].opposite.color)

        const postTrashBtn = new ButtonBuilder()
        .setCustomId('post_trash_btn')
        .setEmoji('🗑️')
        .setStyle(ButtonStyle.Secondary)

        const btns = new ActionRowBuilder().setComponents(privAccBtn, privPostsBtn, postTrashBtn)

        await interaction.update({ components: [btns] })
    }
}