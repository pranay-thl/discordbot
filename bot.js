require('dotenv').config();
const fs = require('fs');
const Discord = require('discord.js');
const Quote = require('inspirational-quotes');
const movieQuote = require("popular-movie-quotes");

var settings = require("./settings");

const client = new Discord.Client();
const COMMAND_PREFIX = "?";

var voiceConnection;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

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
                    { name: '!quote', value: 'Get an inspirational Quote' },
                    { name: '!quote f', value: 'Get an inspirational Quote with Author name' },
                    { name: '!mquote', value: 'Get a movie Quote' },
                    { name: '!speak <text>', value: 'Speaks out the said text' },
                    { name: '!avatar <@mention>', value: 'Gets the avatar of mentioned user' },

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
            if (settings.VOICE_SUPPORT === false) {
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
        return message.reply("Whoops I don't know that one yet!")
    }
    catch (e) {
        console.log(e);
    }
}

client.on('message', async message => {
    if (message.mentions.has(client.user)) {
        message.reply("If you wanna talk to me, begin with a !");
        return;
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

client.login(process.env.DISCORD_TOKEN);