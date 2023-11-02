const { SlashCommandBuilder, EmbedBuilder } = require(`discord.js`)
const schema = require('../../Schemas/profile');
const pschema = require('../../Schemas/posts')
module.exports = {
    data: new SlashCommandBuilder()
    .setName('delete')
    .setDescription("Delete your account (warning: all data will be lost forever, this cannot be undone)")
    .addStringOption(o => o.setName('media_id').setDescription("To delete your account, input your account id first.")),

    async execute (interaction, client) {
        await interaction.deferReply({ ephemeral: true })
        const data = await schema.findOne({ userId: interaction.user.id });
        if (!data) return await interaction.editReply({ content: "It seems you don't have an account." });

        const { options } = interaction;

        const id = options.getString('media_id');

        if (data.mediaId == id && data.userId == interaction.user.id) {
            await schema.deleteOne({ userId: interaction.user.id, mediaId: id });
            await pschema.deleteMany({ ownerId: interaction.user.id });

            const embed = new EmbedBuilder()
            .setTitle("Account Deleted")
            .setDescription("Farewell, Mediacord. It was a fun journey.")
            .setColor('Blurple')
            .setThumbnail(client.user.displayAvatarURL({dynamic:true}))
            .setTimestamp()
            return await interaction.editReply({ embeds: [embed] })
        } else if (data.userId == interaction.user.id && data.mediaId !== id) {
            return await interaction.editReply({ content: "You input your media Id wrong... Remember, you can find it at the bottom of your profile."})
        } else {
            await interaction.editReply({ content: "I encountered a problem running this command.. Try again later."})
        }
    }
}