const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    
    async execute (interaction, client) {

        if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);
         
            if (!command) {
              return;
            }
         
            try {
              await command.autocomplete(interaction);
            } catch (err) {
              return;
            }
          }
        
    }
}