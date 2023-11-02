const { EmbedBuilder } = require('discord.js')
const postSchema = require('../../Schemas/posts');
const userSchema = require('../../Schemas/profile');
const { randomCode } = require("../../util/randomCode")


module.exports = {
    customId: "modal_submitpost",

    async execute (interaction, client) {
        await interaction.deferReply({ ephemeral: true })
        const text = interaction.fields.getTextInputValue('txt_submitpost')
        const { user } = interaction;

        const x = randomCode(20, "###.####-####_.##")
        const code = await checkCode(x);

        await postSchema.create({
            postIdentifier: code,
            ownerId: user.id,
            text: text,
            postedAt: Date.now(),
            likes: 0,
            favorites: 0
        })
        const data = await userSchema.findOne({ userId: user.id })
        if (!data) return await interaction.editReply({ content: "It seems you don't have an account." });

        const embed = new EmbedBuilder()
            .setColor('Blurple')
            .setTimestamp()
            .setAuthor({ name: `${user.username} (${data.mediaId})`, iconURL: user.displayAvatarURL({ dynamic: true }) })
            .setDescription(`**Likes:** **\`0\`** | **Favorites:** **\`0\`**\n\n${text}\n\n- <t:${~~(Date.now()/1000)}:R>`)
            .setFooter({ text: code })
        
        await interaction.editReply({ content: 'Your post was uploaded! Preview:', embeds: [embed] })
    }
}

async function checkCode(code) {
    const data = await postSchema.findOne({ postIdentifier: code });
    if (data) {
        const newCode = randomCode(13, "###.####-####_.##")
        checkCode(newCode)
    } else {
        return code;
    }
}