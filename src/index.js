const { Client, GatewayIntentBits, Collection, ChannelType, ActionRowBuilder,AuditLogOptionsType, Events, Partials, ActivityType, EmbedBuilder, AuditLogEvent, messageLink, lazy } = require(`discord.js`);
const fs = require('fs');

const process = require('node:process');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.DirectMessageReactions, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildEmojisAndStickers, GatewayIntentBits.GuildIntegrations, GatewayIntentBits.GuildModeration, GatewayIntentBits.AutoModerationConfiguration, GatewayIntentBits.AutoModerationExecution, GatewayIntentBits.GuildScheduledEvents, GatewayIntentBits.GuildPresences], partials: [Partials.Channel, Partials.Message], events: [Events.VoiceStateUpdate, Events.GuildMemberAdd, Events.GuildMemberRemove, Events.MessageCreate] }); 

module.exports = client

client.commands = new Collection();
client.buttons = new Map();
client.Menus = new Map();
client.Modals = new Map()
// client.invites = new Collection();

client.cache = new Map();

require('dotenv').config();

process.on('unhandledRejection', async (reason, promise) => {
    console.log('Unhandled Rejection at:', reason, 'reason:', reason);
})
process.on('uncaughtException', (err) => {
    console.log('Unhandled Exception:', err);
})
process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.log('Unhandled Exception Monitor: ', err, origin);
})

const functions = fs.readdirSync("./src/functions").filter(file => file.endsWith(".js"));
const eventFiles = fs.readdirSync("./src/events");
const commandFiles = fs.readdirSync('./src/commands');
const contextCommands = fs.readdirSync('./src/context');

(async () => {
    for (file of functions) {
        require(`./functions/${file}`)(client);
    } 
    client.handleEvents(eventFiles, "./src/events");
    client.handleCommands(commandFiles, './src/commands')
    client.login(process.env.token)
    client.handleContextCommands(contextCommands, './src/context')
})();

const guildSchema = require('./Schemas/guild-profile');
const postSchema = require('./Schemas/posts');
const userSchema = require('./Schemas/profile')

setInterval( async () => {
    client.guilds.cache.forEach(async guild => {
        const data = await guildSchema.findOne({ guildId: guild.id });
        if (!data) return;
        if (data.autopost == false) return;

        const channel = client.channels.cache.get(data.channelId)
        if (!channel) return;

        const posts = await postSchema.find();

        const r = Math.floor(Math.random() * posts.length);

        const post = posts.at(r);

        const text = post.text;
        const id = post.postIdentifier
        const owner = client.users.cache.get(post.ownerId);

        const embed = new EmbedBuilder()
        .setColor('Blurple')
        .setTimestamp()
        .setAuthor({ name: `${owner?.username ?? "???"} (???)`, iconURL: owner?.displayAvatarURL({ dynamic: true }) ?? undefined })
        .setDescription(`**Likes:** **\`${post.likes}\`** | **Favorites:** **\`${post.favorites}\`**\n\n${text}\n\n- <t:${~~(post.postedAt/1000)}:R>`)
        .setFooter({ text: id })

        await channel.send({ embeds: [embed] }).catch(err => {});
    })
}, 300000)