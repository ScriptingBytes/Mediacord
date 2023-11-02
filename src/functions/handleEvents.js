const fs = require('fs')

module.exports = (client) => {
    client.handleEvents = async (eventFiles, path) => {
        for (const folders of eventFiles) {
            if(!fs.lstatSync(`${path}/${folders}`).isDirectory()) continue;
            const events = fs.readdirSync(`${path}/${folders}`).filter(file => file.endsWith('.js'));

            for (let event of events) {
                event = require(`../events/${folders}/${event}`);
                if (event.once) {
                    client.once(event.name, (...args) => event.execute(...args, client));
                } else {
                    client.on(event.name, (...args) => event.execute(...args, client));
                }
            }
        }
    };
}