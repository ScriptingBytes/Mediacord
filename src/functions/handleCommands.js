const fs = require('fs')

module.exports = (client) => {
    client.handleCommands = function(commandFolders, path) {

        for (const folder of commandFolders) {
            const files = fs.readdirSync(`${path}/${folder}`).filter(f => f.endsWith('.js'))
            const devFiles = fs.readdirSync(`./devOnly/commands`).filter(f => f.endsWith('.js'))

            for (const file of files) {
                let pull = require(`../commands/${folder}/${file}`);
                client.commands.set(pull.data.name, pull)
            }
            for (const file of devFiles) {
                let pull = require(`../../devOnly/commands/${file}`);
                client.commands.set(pull.data.name, pull)
            }
        }
        console.log(`\x1b[32mLoaded ${client.commands.size} commands.\x1b[0m`)
    }

    client.handleContextCommands = function(ctxCommandFolders, path) {
        for (const folder of ctxCommandFolders) {
            const files = fs.readdirSync(`${path}/${folder}`).filter(f => f.endsWith('.js'))
            for (const file of files) {
                let pull = require(`../context/${folder}/${file}`);
                client.commands.set(pull.data.name, pull)
            }
        }
    }
}

/*

const commands = fs.readdirSync(`./commands/${dirs}/`).filter(d => d.endsWith('.js'))
        for (let file of commands) {
            let pull = require(`../commands/${dirs}/${file}`)
            client.commands.set(pull.data.name, pull)}

    }
    ["Community", "Moderation", "Other"].forEach(x => load(x))
    console.log(`Loaded ${Client.commands.size} commands!`)

*/