const postSchema = require('../../Schemas/posts');
const profileSchema = require('../../Schemas/profile');

module.exports = {
    customId: "trash_modal",

    async execute (interaction, client) {
        const id = interaction.fields.getTextInputValue('trash_txt');

        const user = await profileSchema.findOne({ userId: interaction.user.id });
        if (!user) return await interaction.reply({ content: "It seems like you don't have an account...", ephemeral: true });

        const post = await postSchema.findOneAndDelete({ postIdentifier: id });
        if (!post) return await interaction.reply({ content: "I couldn't find a post with that id..", ephemeral: true });

        await interaction.reply({ content: `Post "${id}" deleted`, ephemeral: true })
    }
}