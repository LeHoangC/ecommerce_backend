const { Client, GatewayIntentBits } = require('discord.js')

const client = new Client({
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
})

client.on('ready', () => {
    console.log(`Logged it as ${client.user.tag}`)
})

const token = 'MTEyMjc5NDAwNzE3MzU0NjAxNA.G_CIkA.TzzjBcHSjw5Y2b4SRLv3Cb_pVKXVHPZGRvVRbw'

client.login(token)

client.on('messageCreate', (msg) => {
    if (msg.author.bot) return
    if (msg.content === 'hello') {
        msg.reply('Lo con cak')
    }
})
