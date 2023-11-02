const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require(`discord.js`);
const schema = require('../../Schemas/profile');

module.exports = {
    data: new SlashCommandBuilder()
    .setName(`profile`)
    .setDescription(`Pull up another users profile.`)
    .addUserOption(opt => opt.setName(`user`).setDescription(`The user you want to see their profile.`).setRequired(false))
    .addStringOption(opt => opt.setName(`identifier`).setDescription(`The media id of the user's profile`).setRequired(false)),
    async execute (interaction, client) {
        await interaction.deferReply({ ephemeral: true })

        const follow = new ButtonBuilder()
        .setCustomId('follow')
        .setEmoji('🔼')
        .setStyle(ButtonStyle.Primary)

        const row = new ActionRowBuilder().setComponents(follow)

        //data
        let user = interaction.options.getUser(`user`);
        const id = interaction.options.getString(`identifier`);
        let data;

        const userdata = await schema.findOne({ userId: interaction.user.id });

        //checks data
        if (id && !user) {
            data = await schema.findOne({ mediaId: id })
            if (!data) return await interaction.editReply({ content: "I could not find an account associated with this media Id.", ephemeral: true })

            user = client.users.cache.get(data.userId);
            if (!user) return await interaction.editReply({ content: "I could not find an account associated with this media Id.", ephemeral: true })

        } 

        else if (user && !id) {
            data = await schema.findOne({ userId: user.id })
        }

        else if (!id && !user) {
            user = interaction.user;
            data = await schema.findOne({ userId: interaction.user.id })
        } 

        else if (id && user) {
            user = interaction.options.getUser('user')
            data = await schema.findOne({ userId: user.id })
        }

        //user info

        if (!data) return await interaction.editReply({ content: "It seems this user doesn't have an account..."})

        const icon = user.displayAvatarURL()
        const capitalized = `${user.username.charAt(0).toUpperCase()}${user.username.slice(1, user.username.length)}`

        const profileEmbed = new EmbedBuilder()
        .setTitle(`${capitalized}'s Profile`)
        .setColor('#5865F2')
        .setThumbnail(icon)
        .setDescription(`
            **Followers:** ${data.followers.length}
            **Likes:** ${data.totalLikes}

            **Following:** ${data.following.length}
            **Favorite Posts:** ${data.favorites.length}
        `)
        .setFooter({ text: `ID: ${data.mediaId}`})
        .setTimestamp();

        if (data.accountInfo.staff.role != "None") {
            if (data.accountInfo.staff.role == "Helper") {
                profileEmbed.setFooter({ text: `ID: ${data.mediaId}, Mediacord Helper`})
            } else if (data.accountInfo.staff.role == "Moderator") {
                profileEmbed.setFooter({ text: `ID: ${data.mediaId}, Mediacord Moderator`})
            } else if (data.accountInfo.staff.role == "Manager") {
                profileEmbed.setFooter({ text: `ID: ${data.mediaId}, Mediacord Manager`})
            } else if (data.accountInfo.staff.role == "Developer") {    
                profileEmbed.setFooter({ text: `ID: ${data.mediaId}, Mediacord Developer`})
            }
        }

        if (data.accountInfo.privateAcc && userdata?.accountInfo?.staff?.role == "None" && interaction.user.id !== data.userId) {
            const privEmbed = new EmbedBuilder()
            .setTitle(`Anonymous Profile`)
            .setColor('#5865F2')
            .setThumbnail('https://cdn.discordapp.com/attachments/1146665418140962856/1168726611017879632/MediacordAnonymous.png?ex=6552d079&is=65405b79&hm=e42c80ed70148bb989f494f9608a0d6a042d7f0d905ad442d0e3e7a19a9c337c&')
            .setDescription(`
                **Followers:** ???
                **Likes:** ???
    
                **Following:** ???
                **Favorite Posts:** ???
            `)
            .setFooter({ text: `ID: ${data.mediaId}, Anonymous`})
            .setTimestamp();
            
            await interaction.editReply({ embeds: [privEmbed], components: [row] })
        } else {
        await interaction.editReply({ embeds: [profileEmbed], components: [row] })
        }
        client.on('interactionCreate', async i => {
        try {
            if (i.isButton() && i.customId == 'follow') {
                const iuser = await schema.findOne({ userId: interaction.user.id });
                const ouser = await schema.findOne({ userId: user.id });
                if (user.id == i.user.id) return await i.reply({ content: "You can't follow yourself", ephemeral: true });

                if (!ouser) return await i.reply({ content: "This user doesn't have an account...", ephemeral: true });

                if (ouser.followers.includes(i.user.id) || iuser.following.includes(user.id)) {
                    await schema.updateOne({ userId: user.id }, {
                        $pull: {
                            followers: i.user.id
                        }
                    })
                    await schema.updateOne({ userId: i.user.id }, {
                        $pull: {
                            following: user.id
                        }
                    })

                    await i.reply({ content: `You are unfollowing ${user}`, ephemeral: true })
                } else {
                    await schema.updateOne({ userId: user.id }, {
                        $push: {
                            followers: i.user.id
                        }
                    })
                    await schema.updateOne({ userId: i.user.id }, {
                        $push: {
                            following: user.id
                        }
                    })
                    await i.reply({ content: `You are following ${user}`, ephemeral: true })
                }
            } 
        } catch (err) {

        }
        })
    }
}