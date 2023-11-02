const mongoose = require('mongoose')
const { ActivityType, Activity } = require('discord.js')
const { colors } = require('sq_ansi')
const mongodbURL = process.env.MONGOURL

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {

        if (mongodbURL) {
            await mongoose.connect(mongodbURL || ``,{
                useNewUrlParser: true,
                useUnifiedTopology: true
            })

            if (mongoose.connect) {
                console.log(colors.green("Connected to MongoDB"))
            } else {
                console.log(colors.red("I could not connect to MongoDB"))
            }
        }
        
        client.user.setActivity(
          {
            name: 'irrelevant',
            state: `📱 Making media better.`,
            type: ActivityType.Custom
          },
        )

        
        console.log(`\x1b[34mReady!\x1b[0m`);
    },
};