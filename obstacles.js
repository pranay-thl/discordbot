require('dotenv').config();
const Discord = require('discord.js');
const Quote = require('inspirational-quotes');
const movieQuote = require("popular-movie-quotes");
const dialogflow = require('dialogflow');
const axios = require('axios');
const io = require('socket.io-client');
const when = require('when');

var profanities = require('profanities');
const { isInteger, arg } = require('mathjs');

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
        this.socket = null;
        this.queue = {
            textChannel : null,
            voiceChannel : null,
            connection : null,
            songs : [],
            volumne : 5,
            playing: null,
            duration : "00:00:00",
            rawDuration: 0,
            loop : false,
            loopQueue: false,
        }
        this.connectSocketServer()
    }

    joinServer(host,port,username,version) {
        this.MinecraftClient = new this.runtime.client.MinecraftClient(host,port,username,version, this);
        this.MinecraftClient.connect();
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

    createToDoListResponse(username, todoList) {
        if (todoList.length === 0) {
            return "Nothing here, try adding an item to your list!"
        }
        return "Your To-Do List:\n" + todoList.map((i) => `${todoList.indexOf(i) + 1}. ${i}`).join("\n")
        // let embed = new Discord.MessageEmbed()
        //     .setColor('RANDOM')
        //     .setTitle(username+"'s To-Do List");
        // if(todoList.length === 0) {
        //     embed.addField("Nothing here, try adding an item to your list");
        // } 
        // todoList.forEach(element => {
        //     embed.addField(element);
        // });
        // embed.setTimestamp()
        // return embed;
    }

    waitNms(n) {
        return when.promise((resolve, reject) => {
            setTimeout(() => {
                return resolve();
            }, n); 
        }) 
    }

    async recurPlaySongs(message,songList) {
        for(let i=0;i<songList.length;i++) {
            await this.api.music.play(message,this.queue,songList[i],true);
            await this.waitNms(1000);
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
                        { name: this.prefix+'quote', value: 'Get an inspirational Quote' },
                        { name: this.prefix+'quote f', value: 'Get an inspirational Quote with Author name' },
                        { name: this.prefix+'mquote', value: 'Get a movie Quote' },
                        { name: this.prefix+'speak <text>', value: 'Speaks out the said text' },
                        { name: this.prefix+'avatar <@mention>', value: 'Gets the avatar of mentioned user' },
                        { name: this.prefix+'skin UserName', value: 'Gets the skin of user' },
                        { name: this.prefix+'nasa <YYYY-MM-DD> <camera: fhaz/rhaz/mast/chemcam/mahli/mardi/navcam>', value: 'Gets the camera image from Curiosity Rover of a'
                        + ' given date. Both params are optional, default date is today.'},
                        { name: this.prefix+'todo <add/pop> <item>', value: 'Your personal todo list !' },
                        { name: this.prefix+'math <expression>', value: 'Solves your math homework :p' },
                        { name: this.prefix+'playlist <create/add/view/play> <playlistname> <song>', value: 'Keep your playlist here!' },
                        { name: this.prefix+'play <song name/youtube url>', value: 'Music commands: play(p), skip, stop, queue(q), nowplaying(np), remove, loop, loopqueue'},
    
                    )
                return await message.channel.send(helpEmbed);
            }
            if (command === "ping") {
                message.reply("pong");
                return;
            }
            // =========Admin Command Starts Here===========
            if(command === "purge") {
                if(args.length === 0 || args.length >1 || isNaN(args[0]) || isInteger(args[0]) === false || args[0]<1) {
                    return message.reply("Invalid argument. Please check "+this.prefix+"help for command usages");
                }
                if(message.guild){
                    if(message.member.roles.cache.get("707713457713053858") || message.author.id === "366182222228619265") {
                        
                        let purgeReturn = await message.channel.bulkDelete(parseInt(args[0])+1);
                        return;
                        //return message.channel.send(`Purged last ${purgeReturn.size} messages.`);
                    }
                    else{
                        return message.reply("You're not authorized to run this command!");
                    }
                }
                else{
                    return message.reply("You must be in a Server to run the command!");
                }
            }
            // =========Admin Command Ends Here===========
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
            if(command === 'leave') {
                this.client.emit('guildMemberRemove', message.member);
                return;
            }
            if (command === 'avatar') {
                if (args[0]) {
                    const user = this.getUserFromMention(args[0]);
                    if (!user) {
                        return message.reply('Please use a proper mention if you want to see someone else\'s avatar.');
                    }
    
                    return message.channel.send(`${user.username}'s avatar: ${user.displayAvatarURL({ dynamic: true, size: 1024 })}`);
                }
    
                return message.channel.send(`${message.author.username}, your avatar: ${message.author.displayAvatarURL({ dynamic: true, size: 1024 })}`);
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
            // if (command === "mute") {
            //     if (this.voiceConnection) {
            //         return await this.voiceConnection.disconnect();
            //     }
            //     return;
            // }
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
                    if(message.member.roles.cache.get("707713457713053858") || message.author.id === "366182222228619265") {
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
                            await this.runtime.storage.whitelistWord(args[0].toLowerCase(),message.author.id,message.author.username);
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
                        await this.runtime.storage.whitelistWord(args[0].toLowerCase(),message.author.id,message.author.username);
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
            if(command === "blacklist") {
                if(args.length === 0 || args.length >1) {
                    return message.reply("Invalid argument. Please check "+this.prefix+"help for command usages");
                }
                if(message.guild){
                    if(message.member.roles.cache.get("707713457713053858") || message.author.id === "366182222228619265") {
                        if(profanities.indexOf(args[0])===-1) {
                            await this.runtime.storage.blacklistWord(args[0],message.author.id,message.author.username);
                            return message.channel.send("Word blacklisted");
                        }
                        else{
                            return message.channel.send("Word is already blaclisted");
                        }
                    }
                    else{
                        return message.reply("You're not authorized to blacklist words!");
                    }
                }
                else if(message.author.id === "366182222228619265"){
                    if(profanities.indexOf(args[0])===-1) {
                        await this.runtime.storage.blacklistWord(args[0],message.author.id,message.author.username);
                        return message.channel.send("Word blacklisted");
                    }
                    else{
                        return message.channel.send("Word is already blacklisted");
                    }
                }
                else{
                    return message.reply("You're not authorized to whitelist words!");
                }
            }
            if(command === "joinServer") {
                if(message.author.id !== "366182222228619265") {
                    return message.reply("TheHurtLocker only.");
                }
                this.joinServer(process.env.MC_HOST,25565,"Obstacles","1.13.2");
                return;
            }
            if(command === "executeCommand") {
                if(message.author.id !== "366182222228619265") {
                    return message.reply("TheHurtLocker only.");
                }
                if(args.length === 0) {
                    return message.reply("Invalid argument. Please check "+this.prefix+"help for command usages");
                }
                this.MinecraftClient.executeCommand(args.join(" "));
                return;
            }
            if(command === "startTalk") {
                if(message.guild) {
                    if(!(message.member.roles.cache.get("707713457713053858") || message.author.id === "366182222228619265")){
                        return message.reply("You're not authorized!");
                    }
                }
                else{
                    if(message.author.id !== "366182222228619265") {
                        return message.reply("TheHurtLocker only.");
                    }   
                }
                if(args.length === 0) {
                    return message.reply("Invalid argument. Please check "+this.prefix+"help for command usages");
                }
                this.selfTalk = true;
                return message.channel.send(args.join(" "));
            }
            if(command === "stopTalk") {
                if(message.guild) {
                    if(!(message.member.roles.cache.get("707713457713053858") || message.author.id === "366182222228619265")){
                        return message.reply("You're not authorized!");
                    }
                }
                else{
                    if(message.author.id !== "366182222228619265") {
                        return message.reply("TheHurtLocker only.");
                    }   
                }
                this.selfTalk = false;
                return message.channel.send("Stopped parsing self messages.");
            }
            if (command === "todo") {
                let todolist = await this.api.todo.getToDoList(message.author.id);
                if (args.length === 0) {
                    return message.reply(this.createToDoListResponse(message.author.username,todolist));
                }
                else if (args[0] === "add") {
                    if (args.length < 2) {
                        return message.reply("Please specify an item to be added");
                    }
                    await this.api.todo.addToDoList(message.author.id, args.slice(1).join(" "));
                    todolist = await this.api.todo.getToDoList(message.author.id);
                    await message.reply("Item added to your To-Do List");
                    return message.reply(this.createToDoListResponse(message.author.username,todolist));
                }
                else if (args[0] === "pop") {
                    await this.api.todo.popToDoList(message.author.id);
                    todolist = await this.api.todo.getToDoList(message.author.id);
                    await message.reply("Item removed from your To-Do List");
                    return message.reply(this.createToDoListResponse(message.author.username,todolist));

                }
                else{
                    return message.reply("Invalid arguments. Refer help section");
                }
            }
            if(command === "chucknorris" || command === "chuck") {
                let chuck_res = await this.api.chuck.fetchJoke();
                var quoteEmbed = new Discord.MessageEmbed()
                    .setColor('RANDOM')
                    .setAuthor("Chuck Norris")
                    .setDescription(chuck_res.data)
                    .setTimestamp()
                return await message.channel.send(quoteEmbed);
            }
            if(command === "math") {
                if(args.length === 0) {
                    return message.reply("Please provide a valid Math expression!");
                }
                let mathRes = await this.api.math.evaluateExpression(args.join(" "));
                if(mathRes.data) {
                    return message.channel.send(mathRes.data.toString());
                }
                else{
                    return message.channel.send(mathRes.error.msg);
                }
            }
            if(command === "cron") {
                if(message.author.id !== "366182222228619265") {
                    return message.reply("TheHurtLocker only.");
                }
                if(args.length !==1) {
                    return message.reply("Invalid usages");
                }
                const user = this.getUserFromMention(args[0]);
                this.runtime.cronjobs.demo(user);
                return message.reply("Cronjob started");
            }
            if(command === "stopcron") {
                if(message.author.id !== "366182222228619265") {
                    return message.reply("TheHurtLocker only.");
                }
                this.runtime.cronjobs.killAll();
                return message.reply("Cronjobs destroyed");
            }
            if(command === "serverStatus") {
                let server = "play.mythicmc.org";
                if(args[0]) {
                    server = args[0];
                }
                let serverRes = await this.api.serverStatus.fetchStatus(message,server);
                return;

            }
            if(command === "playlist") {
                if(args.length === 0) {
                    return message.reply("Invalid input, Refer to help section for usages");
                }
                if(args[0] === "create") {
                    if(args.length !== 2) {
                        return message.reply("Please provide a valid playlist name");
                    }
                    let playRes = await this.api.playlist.createPlayList(args[1], message.author.id);
                    return message.channel.send("Playlist : " + args[1] + " Created");
                }
                if(args[0] === "add") {
                    if(args.length < 3) {
                        return message.reply("Invalid input, Refer to help section for usages");
                    }
                    let playRes = await this.api.playlist.addToPlaylist(args[1], args.slice(2).join(" "), message.author.id);
                    return message.channel.send("Song : " + args.slice(2).join(" ") + " added to playlist : " + args[1]);
                }
                if(args[0] === "view") {
                    if(args.length !== 2) {
                        return message.reply("Invalid input, Refer to help section for usages");
                    }
                    let playRes = await this.api.playlist.fetchPlaylist(args[1]);
                    if(playRes.data && playRes.data.songs) {
                        let songList = playRes.data.songs;
                        return message.channel.send("Songs in "+args[1]+" : "+songList.length+"\n" + songList.map((i) => `${songList.indexOf(i) + 1}. ${i}`).join("\n"));
                    }
                    else{
                        return message.channel.send("No such playlist Found!");
                    }
                }
                if(args[0] === "play") {
                    if(args.length !== 2) {
                        return message.reply("Invalid input, Refer to help section for usages");
                    }
                    let playRes = await this.api.playlist.fetchPlaylist(args[1]);
                    if(playRes.data && playRes.data.songs) {
                        let songList = playRes.data.songs;
                        if (message.member.voice.channel) {
                            this.recurPlaySongs(message,songList);
                            return message.channel.send(`Playlist ${args[1]} queued.`);
                        }
                        else {
                            return message.reply("You're not in a voice channel.");
                        }
                    }
                    else{
                        return message.channel.send("No such playlist Found!");
                    }
                }
            }
            if(command === "play" || command === "p") {
                if(args.length === 0) {
                    return message.reply("Invalid input, Refer to help section for usages");
                }
                return this.api.music.play(message,this.queue,args.join(" "));
            }
            if(command === "skip") {
                return this.api.music.skip(message,this.queue);
            }
            if(command === "stop") {
                return this.api.music.stop(message, this.queue);
            }
            if(command === "queue" || command === "q") {
                return this.api.music.currQueue(message, this.queue);
            }
            if(command === "np" || command === "nowplaying") {
                return this.api.music.nowPlaying(message, this.queue);
            }
            if(command === "loop") {
                return this.api.music.loop(message,this.queue);
            }
            if(command === "loopqueue") {
                return this.api.music.loopQueue(message,this.queue);
            }
            if(command === "remove") {
                if(args.length !== 1) {
                    return message.reply("Invalid input, Refer to help section for usages");
                }
                return this.api.music.remove(message,this.queue,parseInt(args[0]));
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

    async connectSocketServer() {
        if(this.serverName !== "Vanguard") {
            return;
        }
        this.socket = io.connect(process.env.SOCKET_URL);
        this.socket.on("message", (msgObj)=>{
            this.client.guilds.cache.get("705797413788581919").channels.cache.get("738675322567917640").send("["+msgObj.username+"]: "+msgObj.message);
        })
        // this.socket.on('connect_error',(err)=>{
        //     console.log(err);
        // })
    }

    async messageHandler(message) {
        if (message.author.bot) {
            //note this will disable self talk.
            return;
        }
        message.content = message.content.trim();
        if(this.socket && this.socket.connected) {
            if(!(message.author.id==="723229089502199829" && message.content.startsWith("[") === true)) {
                this.socket.emit('message',"["+message.channel.name+"] "+message.author.username+": "+message.content);   
            }
        }
        if(message.channel.id === "738675322567917640") {
            return;
        }
        if(this.sleep && message.content.startsWith(this.prefix+"wake") === false){
            return;
        }
        let wordSplit = message.content.split(" ");
        let profanitiesWhiteList = await this.runtime.storage.getWhiteList();
        if(profanitiesWhiteList.length) {
            profanitiesWhiteList=profanitiesWhiteList.map(x=>x._id);
        }
        let blacklist = await this.runtime.storage.getBlackList();
        if(blacklist.length) {
            blacklist=blacklist.map(x=>x._id);
        }
        profanities = profanities.concat(blacklist);
        profanities = profanities.filter(x=>profanitiesWhiteList.includes(x.toLowerCase())===false);
        if(message.content.startsWith(this.prefix+"whitelist") === false){
            for(var i=0;i<wordSplit.length;i++) {
                if(profanities.includes(wordSplit[i].toLowerCase())) {
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
        if (message.mentions.has(this.client.user) && message.content.startsWith(this.prefix+"startTalk") === false) {
            //dialogflow
            if(this.selfTalk === false && message.author.id === this.client.user.id) {
                return;
            }
            if(message.content.startsWith("<@!"+this.client.user.id+">") || message.content.startsWith("<@"+this.client.user.id+">")) {
                let actualMessage = message.content.split(" ").splice(1).join(" ");
                let dialogFlowReply = await this.runDialogFlow(process.env.PROJECT_ID,message.author.id,actualMessage);
                return message.reply(dialogFlowReply);
            }
            else{
                return message.reply("If you wanna talk to me, mention me at start of your message :)");
            }
        }
        if (message.content.startsWith(this.prefix) == false || message.author.bot) {
            return;
        }
    
        let withoutPrefix = message.content.slice(1);
        let split = withoutPrefix.split(/ +/);
        let command = split[0];
        let args = split.slice(1);
    
        this.commandHandler(message, command, args);
    }

    async emitToChannel(message) {
        //return await this.client.guilds.cache.get("723230380228083772").channels.cache.get("723230380228083775").send(message);
        return await this.client.guilds.cache.get("705797413788581919").channels.cache.get("726453572669014118").send(message);
    }
    
}

module.exports = {
    Obstacles
}