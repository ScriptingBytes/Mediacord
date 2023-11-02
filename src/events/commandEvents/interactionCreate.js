const { Interaction, EmbedBuilder, Collection } = require("discord.js");
const schema = require('../../Schemas/profile');
const { randomCode } = require('../../util/randomCode')

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        
        const data = await schema.findOne({ userId: interaction.user.id });
       
        const x = randomCode(12, '####-####-####')
        const code = await checkCode(x)

        if (!data) {
            await schema.create({
                userId: interaction.user.id,
                mediaId: code,
            })

            const embed = new EmbedBuilder()
            .setColor('#5865f2')
            .setTitle('Hey! You\'re new!')
            .setDescription(`Since you're new, we created your own profile.\n\nHere's your media Id, it's your unique account identification and how people can find you without knowing you:\n\n**${code}**`)
            .setTimestamp()

            return await interaction.reply({ embeds: [embed], ephemeral: true })
        }
        

        if (interaction.isCommand() || interaction.isContextMenuCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) return;
                
        try{
            await command.execute(interaction, client);
        } catch (error) {
            console.log(`There was an error using command "/${interaction.commandName}":\n${error.stack}`);

            await interaction.reply({
                content: 'There was an error while executing this command! Try again later.', 
                ephemeral: true
            }).catch(err => { return });
        }  
    }
     
    // buttons
        if (interaction.isButton()) {
            const button = client.buttons.get(interaction.customId);

            if (!button) return;

            try {
                button.execute(interaction, client)
            } catch (error) {
                console.log(error)
                await interaction.reply({
                    content: 'There was an error while executing this button! Try again later.', 
                    ephemeral: true
                }).catch(err => {return});
            }
        }

    // select menus
        if (interaction.isAnySelectMenu()) {
            const menu = client.Menus.get(interaction.customId);

            if (!menu) return;

            try {
                menu.execute(interaction, client)
            } catch (error) {
                console.log(error)
                await interaction.reply({
                    content: 'There was an error while executing this menu! Try again later.', 
                    ephemeral: true
                }).catch(err => { return; });
            }
        }

    // modal
        if (interaction.isModalSubmit()) {
            const modal = client.Modals.get(interaction.customId);

            if (!modal) return;

            try {
                modal.execute(interaction, client)
            } catch (error) {
                console.log(error)
                await interaction.reply({
                    content: 'There was an error while executing this modal! Try again later.', 
                    ephemeral: true
                }).catch(err => { return; });
            }
        }
    },
};

async function checkCode(code) {
    const data = await schema.findOne({ mediaId: code });
    if (data) {
        const newCode = randomCode(12, '####-####-####')
        checkCode(newCode)
    } else {
        return code;
    }
}