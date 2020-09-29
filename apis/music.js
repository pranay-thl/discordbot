//TODO : Add logger
const ytdl = require("ytdl-core");
const yts = require('yt-search')
const when = require("when");
const Discord = require('discord.js');
var storage;
function init(_runtime) {
    storage = _runtime.storage;
}

async function playHelper(queue, song) {
    if (!song) {
        queue.playing = null;
        if (queue.connection) {
            if (queue.connection.dispatcher) {
                queue.connection.dispatcher.end();
            }
            queue.connection = null;
        }
        if (queue.voiceChannel) {
            queue.voiceChannel.leave();
            queue.voiceChannel = null;
        }
        queue.textChannel = null;
        return;
    }
    let dispatcher = queue.connection.play(ytdl(song.url), {
        //quality: 'highestaudio',
        //highWaterMark: 1 << 25
    })
        .on("start", () => {
            const videoEmbed = new Discord.MessageEmbed()
                .setThumbnail(song.thumbnail)
                .setColor('RANDOM')
                .addField('Now Playing', `${song.title}\n ${song.url}`)
                .addField('Duration', song.duration)
            if (queue.songs[1]) {
                videoEmbed.addField('Next Song:', queue.songs[1].title);
            }
            queue.textChannel.send(videoEmbed);
            queue.playing = song;
            queue.songs.shift();

        })
        .on("finish", () => {
            playHelper(queue, queue.songs[0]);
        })
        .on("error", (err) => {
            console.log(err);
            queue.textChannel.send('<@366182222228619265> I crashed while playing a song!');
            playHelper(queue, queue.songs[0]);
        })
    //dispatcher.setVolumeLogarithmic(queue.volume / 5);
    //queue.textChannel.send(`Now Playing: **${song.title}**`);
}

async function play(message, queue, songName) {
    try {
        let voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.channel.send("You need to be in a voice channel to play music!");
        }
        let perms = voiceChannel.permissionsFor(message.client.user);
        if (!perms.has("CONNECT") || !perms.has("SPEAK")) {
            return message.channel.send("I need permission to join and speak in your voice channel!");
        }
        let songRes = await yts(songName);
        let songURL = songRes.all[0].url;
        if(!songURL) {
            return message.channel.send("No such song found!");
        }
        let songInfo = await ytdl.getInfo(songURL);
        let duration = new Date(songInfo.videoDetails.lengthSeconds * 1000).toISOString().substr(11, 8);
        let song = {
            title: songInfo.videoDetails.title,
            url: songInfo.videoDetails.video_url,
            thumbnail: songInfo.videoDetails.thumbnail.thumbnails[0].url,
            duration: duration,
        };
        queue.songs.push(song);
        if (!queue.connection) {
            queue.textChannel = message.channel;
            queue.voiceChannel = voiceChannel;
            let connection = await voiceChannel.join();
            queue.connection = connection;
        }
        try {
            if (!queue.playing) {
                message.channel.send(`${song.title} has been added to the queue!`);
                playHelper(queue, song);
            }
            else {
                message.channel.send(`${song.title} has been added to the queue!`);
                return currQueue(message, queue);
            }
        }
        catch (err) {
            console.log(err);
            return message.channel.send("Error while playing music!");
        }

    }
    catch (err) {
        console.log(err);
        return message.channel.send("Unexpected Error while adding song to queue.");
    }
}

function skip(message, queue) {
    if (!message.member.voice.channel) {
        return message.channel.send("You need to be in a voice channel to skip music!");
    }
    if (!queue.playing) {
        return message.channel.send("Nothing to skip!");
    }
    if (queue.connection.dispatcher) {
        queue.connection.dispatcher.end();
        return message.channel.send("Skipping....");
    }
}

function stop(message, queue) {
    if (!message.member.voice.channel) {
        return message.channel.send("You need to be in a voice channel to skip music!");
    }
    queue.songs = [];
    queue.playing = null;
    if (queue.connection) {
        if (queue.connection.dispatcher) {
            queue.connection.dispatcher.end();
        }
        queue.connection = null;
    }
    if (queue.voiceChannel) {
        queue.voiceChannel.leave();
        queue.voiceChannel = null;
    }
    queue.textChannel = null;
}

function currQueue(message, queue) {
    let songList = queue.songs.map(s => s.title);
    return message.channel.send("Current Queue : " + songList.length + "\n" + songList.map((i) => `${songList.indexOf(i) + 1}. ${i}`).join("\n"));
}

function nowPlaying(message, queue) {
    if (!queue.playing) {
        return message.channel.send("Nothing is playing.");
    }
    const videoEmbed = new Discord.MessageEmbed()
        .setThumbnail(queue.playing.thumbnail)
        .setColor('RANDOM')
        .addField('Now Playing', `${queue.playing.title}\n ${queue.playing.url}`)
        .addField('Duration', queue.playing.duration)
    if (queue.songs[0]) {
        videoEmbed.addField('Next Song:', queue.songs[0].title);
    }
    return message.channel.send(videoEmbed);
}

module.exports = {
    init,
    play,
    skip,
    stop,
    currQueue,
    nowPlaying
}
