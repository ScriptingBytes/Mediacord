const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require(`discord.js`)
const profileSchema = require(`../../src/Schemas/profile.js`);
const postSchema = require('../../src/Schemas/posts.js')

module.exports = {
    data: new SlashCommandBuilder()
    .setName(`manage`)
    .setDescription(`Manage a Mediacord profile.`)
    .addSubcommand(c => c
        .setName('delete-user')
        .setDescription("Force delete a user's account")
        .addStringOption(o => o.setName('media_id').setDescription("The media id of the account to delete").setRequired(true))
    )
    .addSubcommand(c => c
        .setName('staff')
        .setDescription("Give/Promote/Demote Staff")
        .addStringOption(o => o.setName('media_id').setDescription("The media id of the account to give staff").setRequired(true))
        .addStringOption(o => o.setName('role').setDescription("The staff role to give the user").setRequired(true).addChoices(
            { name: 'Demote', value: 'demote' },
            { name: 'Helper', value: 'helper' },
            { name: 'Moderator', value: 'mod' },
            { name: 'Manager', value: 'manager' },
        ))
    )
    .addSubcommand(c => c
        .setName('private')
        .setDescription("Forcefully private an account")
        .addStringOption(o => o.setName('media_id').setDescription("The media id of the account to delete").setRequired(true))
        .addStringOption(o => o.setName('aspect').setDescription("Which aspect of the account to private").setRequired(true).addChoices(
            { name: 'Posts', value: 'posts' },
            { name: 'Account', value: 'acc' },
            { name: 'Both', value: 'all' },
        ))
    )
    ,
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const data = await profileSchema.findOne({ userId: interaction.user.id})

        if (['None', 'Helper'].includes(data?.accountInfo?.staff?.role) || !data) { //Only managers and devs can use this command
           return await interaction.reply({ content: `You do not have access to this command!`, ephemeral: true})
        }

        if (sub == 'delete-user') {
            const id = interaction.options.getString('media_id');

            const deleted = await profileSchema.findOneAndDelete({ mediaId: id });
            if (!deleted) return await interaction.reply({ content: "I could not find an account with that media id..", ephemeral: true });

            await postSchema.deleteMany({ ownerId: deleted.userId });
            await interaction.reply({ content: `Deleted account - (${id})`, ephemeral: true })
        } else if (sub == 'staff') {
            if (['Moderator'].includes(data?.accountInfo?.staff?.role)) { //Only managers and devs can use this command
                return await interaction.reply({ content: `You do not have access to this command!`, ephemeral: true})
            }

            const id = interaction.options.getString('media_id');
            const role = interaction.options.getString('role');

            if (data?.accountInfo?.staff?.role == 'Manager' && role == 'Manager') return await interaction.reply({ content: 'Manager\'s cannot promote user\'s to manager.', ephemeral: true })

            const x = {
                'demote': 'None',
                'helper': 'Helper',
                'mod': 'Moderator',
                'manager': 'Manager',
            }
            
            const updated = await profileSchema.findOneAndUpdate({ mediaId: id }, { 'accountInfo.staff.role': x[role] });
            if (!updated) return await interaction.reply({ content: "I could not find an account with that media id..", ephemeral: true });

            await interaction.reply({ content: `Updated account - (${id}) - (${role.charAt(0).toUpperCase()}${role.slice(1, role.length)})`, ephemeral: true })
        } else if (sub == 'private') {
            const id = interaction.options.getString('media_id');
            const aspect = interaction.options.getString('aspect');

            if (aspect == 'all') {
                const updated = await profileSchema.findOneAndUpdate({ mediaId: id }, { 'accountInfo.privateAcc': true, 'accountInfo.privatePosts': true });
                if (!updated) return await interaction.reply({ content: "I could not find an account with that media id..", ephemeral: true });
                await interaction.reply({ content: `Updated account - (${id}) - (Priv Acc: True || Priv Posts: True)`, ephemeral: true })
            } else if (aspect == 'posts') {
                const updated = await profileSchema.findOneAndUpdate({ mediaId: id }, { 'accountInfo.privatePosts': true });
                if (!updated) return await interaction.reply({ content: "I could not find an account with that media id..", ephemeral: true });
                await interaction.reply({ content: `Updated account - (${id}) - (Priv Posts: True)`, ephemeral: true })
            } else if (aspect == 'acc') {
                const updated = await profileSchema.findOneAndUpdate({ mediaId: id }, { 'accountInfo.privateAcc': true });
                if (!updated) return await interaction.reply({ content: "I could not find an account with that media id..", ephemeral: true });
                await interaction.reply({ content: `Updated account - (${id}) - (Priv Acc: True)`, ephemeral: true })
            }
        }
    }
}