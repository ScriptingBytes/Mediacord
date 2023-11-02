const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js')

module.exports = {
    customId: "post_trash_btn",

    async execute (interaction, client) {
        const modal = new ModalBuilder()
        .setCustomId('trash_modal')
        .setTitle('Delete A Post')
        
        const txt = new TextInputBuilder()
        .setCustomId('trash_txt')
        .setLabel('Media Id')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)

        modal.setComponents(new ActionRowBuilder().setComponents(txt))

        await interaction.showModal(modal)
    }
}