require('dotenv').config();
const Discord = require('discord.js');
const Quote = require('inspirational-quotes');
const movieQuote = require("popular-movie-quotes");
const profanities = require('profanities');
const dialogflow = require('dialogflow');
const axios = require('axios');

class Obstacles {
    constructor(client, serverName, runtime, api) {
        this.serverName = serverName;
        this.prefix = "$";
        this.client = client;
        this.runtime = runtime;
        this.logger = new runtime.log();
        this.api = api;
        this.profanitiesWhiteList = [];
        this.sleep = false;
    }

    getUserFromMention(mention) {
        if (!mention) return;
    
        if (mention.startsWith('<@') && mention.endsWith('>')) {
            mention = mention.slice(2, -1);
    
            if (mention.startsWith('!')) {
                mention = mention.slice(1);
            }
    
            return this.client.users.cache.get(mention);
        }
    }

    async commandHandler(message, command, args) {
        try {
            if (command === "help" || command === "h") {
                var helpEmbed = new Discord.MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle('Obstacles')
                    .setDescription('Welcome to the help section!')
                    .addFields(
                        { name: this.prefix+'wake', value: 'Wake Obstacles (only for Servers)' },
                        { name: this.prefix+'sleep', value: 'Put Obstacles to sleep (only for Servers)' },
                        { name: this.prefix+'quote', value: 'Get an inspirational Quote' },
                        { name: this.prefix+'quote f', value: 'Get an inspirational Quote with Author name' },
                        { name: this.prefix+'mquote', value: 'Get a movie Quote' },
                        { name: this.prefix+'speak <text>', value: 'Speaks out the said text' },
                        { name: this.prefix+'avatar <@mention>', value: 'Gets the avatar of mentioned user' },
                        { name: this.prefix+'skin UserName', value: 'Gets the skin of user' },
                        { name: this.prefix+'whitelist <word>', value: 'Whitelist the word. (Make sure not to whitelist abusive words'
                        + ' as I will be capturing usernames too)' },
                        { name: this.prefix+'nasa <YYYY-MM-DD> <camera>', value: 'Gets the camera image from Curiosity Rover of a'
                        + ' given date. Both params are optional, default date is today. Cameras are: fhaz (Front Hazard Avoidance Camera), '
                        +'rhaz(Rear Hazard Avoidance Camera), mast(Mast Camera), chemcam(chemistry and Camera Complex)'
                        +'mahli(Mars Hand Lens Image), mardi(Mars Descent Imager), navcam(Navigation Camera)'},
    
                    )
                return await message.channel.send(helpEmbed);
            }
            if (command === "ping") {
                message.reply("pong");
                return;
            }
            if(command === "settings") {
                if(args.length>1) {
                    if(args[0] === "prefix" && args[1] !=="" && args[1]!=="undefined" && args[1].length == 1) {
                        this.prefix = args[1];
                        return message.reply('Command Prefix updated to '+this.prefix);
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
                this.client.emit('guildMemberAdd', message.member);
                return;
            }
            if (command === 'avatar') {
                if (args[0]) {
                    const user = this.getUserFromMention(args[0]);
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
            if(command === "sleep") {
                //TODO : add a generic config for sleep command
                if(message.guild){
                    if(message.member.roles.cache.get("707713457713053858") || message.author.id === "366182222228619265") {
                        this.sleep = true;
                        return message.channel.send("ZzZzZ....");
                    }
                    else{
                        return message.reply("You're not authorized to put me to sleep!");
                    }
                }
                else{
                    this.sleep = true;
                    return message.channel.send("ZzZzZ....");
                }
            }
            if(command === "wake") {
                if(message.guild) {
                    if(message.member.roles.cache.get("707713457713053858")) {
                        this.sleep = false;
                        return message.channel.send("Rise and Shine !");
                    }
                    else{
                        return message.reply("You're not authorized to wake me up!");
                    }
                }
                else{
                    this.sleep = false;
                    return message.channel.send("Rise and Shine !");
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
                let nasa_res = await this.api.nasa.fetchImage(...args);
                if(nasa_res.error) {
                    return message.reply("No image found, try again with a different camera/date")
                }
                const exampleEmbed = new Discord.MessageEmbed()
                        .setColor('#0099ff')
                        .setTitle("Curiosity says hi :)")
                        .setImage(nasa_res.data)
                return message.channel.send(exampleEmbed);
            }
            if(command === "debug") {
                this.logger.setDebug();
                return message.reply("Debugging Toggled!");
            }
            if(command === "whitelist") {
                if(args.length === 0 || args.length >1) {
                    return message.reply("Invalid argument. Please check "+this.prefix+"help for command usages");
                }
                if(message.guild){
                    if(message.member.roles.cache.get("707713457713053858") || message.author.id === "366182222228619265") {
                        if(profanities.indexOf(args[0])!==-1) {
                            await this.runtime.storage.whitelistWord(args[0],message.author.id,message.author.username);
                            return message.channel.send("Word whitelisted");
                        }
                        else{
                            return message.channel.send("Word is already whitelisted");
                        }
                    }
                    else{
                        return message.reply("You're not authorized to whitelist words!");
                    }
                }
                else if(message.author.id === "366182222228619265"){
                    if(profanities.indexOf(args[0])!==-1) {
                        await this.runtime.storage.whitelistWord(args[0],message.author.id,message.author.username);
                        return message.channel.send("Word whitelisted");
                    }
                    else{
                        return message.channel.send("Word is already whitelisted");
                    }
                }
                else{
                    return message.reply("You're not authorized to whitelist words!");
                }
            }
            return message.reply("Whoops I don't know that one yet!")
        }
        catch (e) {
            this.logger.log(e,message.channel)
            return message.reply("Whoops something went wrong!")
        }
    }

    async runDialogFlow(projectId, userId, msg) {
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

    async messageHandler(message) {
        message.content = message.content.trim();
        if(this.sleep && message.content.startsWith(this.prefix+"wake") === false){
            return;
        }
        let wordSplit = message.content.split(" ");
        let profanitiesWhiteList = await this.runtime.storage.getWhiteList();
        if(profanitiesWhiteList.length) {
            profanitiesWhiteList=profanitiesWhiteList.map(x=>x._id);
        }
        if(message.content.startsWith(this.prefix+"whitelist") === false){
            for(var i=0;i<wordSplit.length;i++) {
                if(profanities.includes(wordSplit[i].toLowerCase()) && profanitiesWhiteList.indexOf(wordSplit[i].toLowerCase()) === -1) {
                    wordSplit[i] = wordSplit[i].repeat();
                    try{
                        await this.runtime.storage.updateProfanityCount(message.author.id);
                        let profCount = await this.runtime.storage.getProfanityCount(message.author.id);
                    }
                    catch(err) {
                        console.log(err);
                    }
                    await message.react('👎');
                    return message.reply("Don't say bad words!");
                    //return message.reply("Don't say bad words! This is your Warning Number: "+profCount.data.count);
                }
            }
        }
        if (message.mentions.has(this.client.user)) {
            //dialogflow
            if(message.content.startsWith("<@!"+this.client.user.id+">")) {
                let actualMessage = message.content.split(" ").splice(1).join(" ");
                let dialogFlowReply = await this.runDialogFlow(process.env.PROJECT_ID,message.author.id,actualMessage);
                return message.reply(dialogFlowReply);
            }
            else{
                return message.reply("If you wanna talk to me, mention me at start of your message :)");
            }
        }
        if (message.content.startsWith(this.prefix) == false) {
            return;
        }
    
        let withoutPrefix = message.content.slice(1);
        let split = withoutPrefix.split(/ +/);
        let command = split[0];
        let args = split.slice(1);
    
        this.commandHandler(message, command, args);
    }
    
}

module.exports = {
    Obstacles
}