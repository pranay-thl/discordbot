require('dotenv').config();
const fs = require('fs');
const Discord = require('discord.js');
const Quote = require('inspirational-quotes');
const movieQuote = require("popular-movie-quotes");
const profanities = require('profanities');
const dialogflow = require('dialogflow');
const axios = require('axios');

const profanitiesWhiteList = ["kill","die"];

var api = require("./apis");
var settings = require("./settings");
var runtime = require("./runtime");
const { UV_FS_O_FILEMAP } = require('constants');

var sleep = false;
const client = new Discord.Client();
var COMMAND_PREFIX = "$";

var voiceConnection;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

async function runSample(projectId, userId, msg) {
    // Create a new session
    try{
        let keyFile = JSON.parse(process.env.DIALOGFLOW_KEY);
        const sessionClient = new dialogflow.SessionsClient({credentials:keyFile});
        const sessionPath = sessionClient.sessionPath(projectId, userId);
    
        // The text query request.
        const request = {
            session: sessionPath,
            queryInput: {
                text: {
                    // The query to send to the dialogflow agent
                    text: msg,
                    // The language used by the client (en-US)
                    languageCode: 'en-US',
                },
            },
        };
    
        // Send request and log result
        const responses = await sessionClient.detectIntent(request);
        const result = responses[0].queryResult;
        //console.log(`  Response: ${result.fulfillmentText}`);
        return result.fulfillmentText;
    }
    catch(err) {
        console.log(err);
        return "Something went wrong with my DialogFlow API, ping Phosphenes."
    }
    
}

function getUserFromMention(mention) {
    if (!mention) return;

    if (mention.startsWith('<@') && mention.endsWith('>')) {
        mention = mention.slice(2, -1);

        if (mention.startsWith('!')) {
            mention = mention.slice(1);
        }

        return client.users.cache.get(mention);
    }
}

async function commandHandler(message, command, args) {
    try {
        if (command === "help" || command === "h") {
            var helpEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Obstacles')
                .setDescription('Welcome to the help section!')
                .addFields(
                    { name: COMMAND_PREFIX+'quote', value: 'Get an inspirational Quote' },
                    { name: COMMAND_PREFIX+'quote f', value: 'Get an inspirational Quote with Author name' },
                    { name: COMMAND_PREFIX+'mquote', value: 'Get a movie Quote' },
                    { name: COMMAND_PREFIX+'speak <text>', value: 'Speaks out the said text' },
                    { name: COMMAND_PREFIX+'avatar <@mention>', value: 'Gets the avatar of mentioned user' },
                    { name: COMMAND_PREFIX+'skin UserName', value: 'Gets the skin of user' },
                    { name: COMMAND_PREFIX+'nasa <YYYY-MM-DD> <camera>', value: 'Gets the camera image from Curiosity Rover of a'
                    + 'give date. Both params are optional, default date is today. Cameras are: fhaz (Front Hazard Avoidance Camera), '
                    +'rhaz(Rear Hazard Avoidance Camera), mast(Mast Camera), chemcam(chemistry and Camera Complex)'
                    +'mahli(Mars Hand Lens Image), mardi(Mars Descent Imager), navcam(Navigation Camera)'},

                )
            return await message.channel.send(helpEmbed);
        }
        if (command === "ping") {
            message.reply("pong");
            return;
        }
        if (command.startsWith("be")) {
            message.reply("Und3rline likes jazz !");
            return;
        }
        if(command === "settings") {
            if(args.length>1) {
                if(args[0] === "prefix" && args[1] !=="" && args[1]!=="undefined" && args[1].length == 1) {
                    COMMAND_PREFIX = args[1];
                    return message.reply('Command Prefix updated to '+COMMAND_PREFIX);
                }
                else {
                    return message.reply('Wrong Command!');
                }
            }
        }
        if (command === "embed") {
            const exampleEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Obstacles')
                .setURL('https://discord.js.org/')
                .setAuthor('TheHurtLocker', 'https://i.imgur.com/wSTFkRM.png', 'https://discord.js.org')
                .setDescription('It was the best of times, it was the worst of times, it was life.')
                .setThumbnail('https://i.imgur.com/wSTFkRM.png')
                .addFields(
                    { name: 'Regular field title', value: 'Some value here' },
                    { name: '\u200B', value: '\u200B' },
                    { name: 'Inline field title', value: 'Some value here', inline: true },
                    { name: 'Inline field title', value: 'Some value here', inline: true },
                )
                .addField('Inline field title', 'Some value here', true)
                .setImage('https://i.imgur.com/wSTFkRM.png')
                .setTimestamp()
                .setFooter('Copyright Obstacles 2020-21', 'https://i.imgur.com/wSTFkRM.png');
            message.reply(exampleEmbed);
            return;
        }
        if (command === 'react') {
            message.react('😄');
            return;
        }
        if (command === 'join') {
            client.emit('guildMemberAdd', message.member);
            return;
        }
        if (command === 'avatar') {
            if (args[0]) {
                const user = getUserFromMention(args[0]);
                if (!user) {
                    return message.reply('Please use a proper mention if you want to see someone else\'s avatar.');
                }

                return message.channel.send(`${user.username}'s avatar: ${user.displayAvatarURL({ dynamic: true })}`);
            }

            return message.channel.send(`${message.author.username}, your avatar: ${message.author.displayAvatarURL({ dynamic: true })}`);
        }
        if (command === "voice") {
            if (process.env.VOICE_SUPPORT === "false") {
                return await message.channel.send("Sorry, my voice support has been disabled.", { tts: true });
            }
            if (message.member.voice.channel) {
                voiceConnection = await message.member.voice.channel.join();
                const dispatcher = voiceConnection.play(__dirname + "/res/sound/welcome.mp3");

                dispatcher.on('start', () => {
                    console.log('audio.mp3 is now playing!');
                });
                dispatcher.on('finish', () => {
                    console.log('audio.mp3 has finished playing!');
                });
                dispatcher.on('error', console.error);
                return;
            }
            else {
                return message.reply("You're not in a voice channel.");
            }
        }
        if (command === "mute") {
            if (voiceConnection) {
                return await voiceConnection.disconnect();
            }
            return;
        }
        if (command === "speak") {
            return await message.channel.send(args, { tts: true });
        }
        if (command === "quote") {
            if (args.length === 0) {
                return await message.channel.send(Quote.getRandomQuote());
            }
            else {
                if (args[0] === "f") {
                    var currQuote = Quote.getQuote();
                    var quoteEmbed = new Discord.MessageEmbed()
                        .setColor('#0099ff')
                        //.setTitle("Inspirational Quotes")
                        .setAuthor(currQuote.author)
                        .setDescription(currQuote.text)
                        .setTimestamp()
                        .setFooter('Copyright Obstacles 2020-21');
                    return await message.channel.send(quoteEmbed);
                }
            }
        }
        if (command === "mquote") {
            var currQuote = movieQuote.getSomeRandom(1)[0];
            var quoteEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                //.setTitle("Inspirational Quotes")
                .setAuthor(currQuote.movie + " (" + currQuote.year + ")")
                .setDescription(currQuote.quote)
                .setTimestamp()
                .setFooter('Copyright Obstacles 2020-21');
            return await message.channel.send(quoteEmbed);
        }
        if (command === "chat") {

        }
        if(command === "sleep") {
            if(message.member.roles.cache.get("707713457713053858")) {
                sleep = true;
                return message.channel.send("ZzZzZ....");
            }
            else{
                return message.reply("You're not authorized to put me to sleep!");
            }
        }
        if(command === "wake") {
            if(message.member.roles.cache.get("707713457713053858")) {
                sleep = false;
                return message.channel.send("Rise and Shine !");
            }
            else{
                return message.reply("You're not authorized to wake me up!");
            }
        }
        if(command === "skin") {
            if (args.length === 0) {
                return message.reply("Please mention the username for fetching skin");
            }
            var url = "https://playerdb.co/api/player/minecraft/"+args[0];
            try{
                var axRes = await axios.get(url);
                //console.log(axRes.data);
                if(!(axRes && axRes.data && axRes.data.code==="player.found")) {
                    return message.reply("No such user found in Mojang");
                }
                var playerid = axRes.data.data.player.id;
                var playerSkin = "https://crafatar.com/renders/body/"+playerid;
                const exampleEmbed = new Discord.MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(args[0]+'\'s Skin')
                    .setImage(playerSkin)
                return message.channel.send(exampleEmbed);
            }
            catch(err) {
                console.log(err);
                return message.reply("Whoops something went wrong!")
            }
        }
        if(command === "nasa") {
            let nasa_res = await api.nasa.fetchImage(...args);
            if(nasa_res.error) {
                return message.reply("No image found, try again with a different camera/date")
            }
            const exampleEmbed = new Discord.MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle("Curiosity says hi :)")
                    .setImage(nasa_res.data)
            return message.channel.send(exampleEmbed);
        }
        return message.reply("Whoops I don't know that one yet!")
    }
    catch (e) {
        console.log(e);
        return message.reply("Whoops something went wrong!")
    }
}

client.on('message', async message => {
    message.content = message.content.trim();
    if(sleep) {
        if(message.content.startsWith(COMMAND_PREFIX+"wake") === false){
            return;
        }
    }
    let wordSplit = message.content.split(" ");
    for(var i=0;i<wordSplit.length;i++) {
        if(profanities.includes(wordSplit[i].toLowerCase()) && profanitiesWhiteList.indexOf(wordSplit[i].toLowerCase()) === -1) {
            await runtime.storage.updateProfanityCount(message.author.id);
            let profCount = await runtime.storage.getProfanityCount(message.author.id);
            return message.reply("Don't say bad words!");
            //return message.reply("Don't say bad words! This is your Warning Number: "+profCount.data.count);
        }
    }
    if (message.mentions.has(client.user)) {
        //dialogflow
        if(message.content.startsWith("<@!"+client.user.id+">")) {
            let actualMessage = message.content.split(" ").splice(1).join(" ");
            let dialogFlowReply = await runSample(process.env.PROJECT_ID,message.author.id,actualMessage);
            return message.reply(dialogFlowReply);
        }
        else{
            return message.reply("If you wanna talk to me, mention me at start of your message :)");
        }
    }
    if (message.content.startsWith(COMMAND_PREFIX) == false) {
        //message.reply('If you wanna talk to me, begin with a !');
        return;
    }

    const withoutPrefix = message.content.slice(1);
    const split = withoutPrefix.split(/ +/);
    const command = split[0];
    const args = split.slice(1);

    commandHandler(message, command, args);
});

client.on('guildMemberAdd', member => {
    const channel = member.guild.channels.cache.find(ch => ch.name === 'general');
    if (!channel) return;

    channel.send(`Welcome to the server, ${member}!`);
});

runtime.storage.init(settings);
runtime.storage.connect().then(()=>{
    client.login(process.env.DISCORD_TOKEN);
}).otherwise((err)=>{
    console.log(err);
})

process.on("uncaughtException", (err)=>{
    console.log(err);
})
