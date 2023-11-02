const { REST } = require("@discordjs/rest");
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const client = require('./src/index')

const clientId = process.env.clientId;
const guildId = process.env.devGuild 

const path = './src/commands';
const path2 = './src/context';
const devPath = './devOnly/commands';

const commandFolders = fs.readdirSync(path)
const contextCommandFolders = fs.readdirSync(path2);
const devCmdFiles = fs.readdirSync(devPath).filter(f => f.endsWith('.js'));

        client.commandArray = [];
        client.devOnlyCommandArray = [];

        for (folder of commandFolders) {
            if (!fs.lstatSync(`${path}/${folder}`).isDirectory()) continue;
            const commandFiles = fs.readdirSync(`${path}/${folder}`).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                console.log(`\x1b[34mReading ${file} ...\x1b[0m`)
                const command = require(`./src/commands/${folder}/${file}`);
                client.commandArray.push(command.data.toJSON());
                console.log(`\x1b[32mSuccessfully read ${file}\x1b[0m`)
            }
        }

        for (folder of contextCommandFolders) {
            if (!fs.lstatSync(`${path2}/${folder}`).isDirectory()) continue;
            const commandFiles = fs.readdirSync(`${path2}/${folder}`).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                console.log(`\x1b[34mReading ${file} ...\x1b[0m`)
                const command = require(`./src/context/${folder}/${file}`);
                client.commandArray.push(command.data.toJSON());
                console.log(`\x1b[32mSuccessfully read ${file}\x1b[0m (Context Cmd)`)
            }
        }

        for (file of devCmdFiles) {
            console.log(`\x1b[34mReading ${file} ...\x1b[0m`);
            const command = require(`./devOnly/commands/${file}`);
            client.devOnlyCommandArray.push(command.data.toJSON());
            console.log(`\x1b[32mSuccessfully read ${file}\x1b[0m (Dev Cmd)`)
        }

        const rest = new REST({
            version: '9'
        }).setToken(process.env.token);

        (async () => {
            try {
                await rest.put(
                    Routes.applicationCommands(clientId), {
                        body: client.commandArray
                    },
                );

                await rest.put(
                    Routes.applicationGuildCommands(clientId, guildId), {
                        body: client.devOnlyCommandArray
                    }
                )

                console.log('Successfully reloaded application (/) commands.');
            } catch (error) {
                console.error(error);
            }
            
        })();