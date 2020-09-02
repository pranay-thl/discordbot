require('dotenv').config();
const Discord = require('discord.js');

var settings = require("./settings");
var runtime = require("./runtime");
var api = require("./apis");

var {Obstacles} = require("./obstacles");
var clientMap = {};
const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async message => {
    try{
        let obstaclesBot;
        if(!(message.guild)) {
            let authorId = message.author.id;
            if(clientMap.hasOwnProperty(authorId)) {
                obstaclesBot = clientMap[authorId];
            }
            else{
                obstaclesBot = new Obstacles(client,authorId,runtime, api);
                clientMap[authorId] = obstaclesBot;
            }
        }
        else{
            let serverName = message.guild.name;
            if(clientMap.hasOwnProperty(serverName)) {
                obstaclesBot = clientMap[serverName];
            }
            else{
                obstaclesBot = new Obstacles(client,serverName,runtime, api);
                clientMap[serverName] = obstaclesBot;
            }
        }
        obstaclesBot.messageHandler(message);
    }
    catch(err) {
        console.log(err);
        message.channel.send("Unexpected error :: "+JSON.stringify(err));
    }
});

client.on('guildMemberAdd', member => {
    let channel = member.guild.channels.cache.find(ch => ch.name === 'general');
    if (!channel) {
        //for custom channels
        channel = member.guild.channels.cache.find(ch => ch.name === 'faction');
    };
    if(channel) {
        channel.send(`Welcome to the server, ${member}!`);
    }
});

runtime.storage.init(settings);
runtime.storage.connect().then(()=>{
    api.init(runtime);
    client.login(process.env.DISCORD_TOKEN);
}).otherwise((err)=>{
    console.log(err);
})

process.on("uncaughtException", (err)=>{
    console.log(err);
})
