//TODO : Add logger
const ytdl = require("ytdl-core");
const when = require("when");

var storage;
function init(_runtime) {
    storage = _runtime.storage;
}

async function playHelper(queue, song) {
    if (!song) {
        queue.voiceChannel.leave();
        queue.playing = false;
        return;
    }
    queue.playing = true;
    let dispatcher = queue.connection.play(ytdl(song.url))
        .on("finish", () => {
            queue.songs.shift();
            playHelper(queue, queue.songs[0]);
        })
        .on("error", (err) => {
            console.log(err);
        })
    //dispatcher.setVolumeLogarithmic(queue.volume / 5);
    queue.textChannel.send(`Now Playing: **${song.title}**`);
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
        let songInfo = await ytdl.getInfo(songName);
        let song = {
            title: songInfo.videoDetails.title,
            url: songInfo.url
        };
        queue.songs.push(song);
        if (!queue.connection) {
            queue.textChannel = message.channel;
            queue.voiceChannel = voiceChannel;
            let connection = await voiceChannel.join();
            queue.connection = connection;
        }
        try {
            if (queue.playing === false) {
                playHelper(queue, song);
            }
            else {
                message.channel.send(`${song.title} has been added to the queue!`);
                return currQueue(message,queue);
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
    if(!message.member.voice.channel) {
        return message.channel.send("You need to be in a voice channel to skip music!");
    }
    if(!queue.playing) {
        return message.channel.send("Nothing to skip!");
    }
    queue.connection.dispatcher.end();
}

function stop(message, queue) {
    if(!message.member.voice.channel) {
        return message.channel.send("You need to be in a voice channel to skip music!");
    }
    queue.songs = [];
    queue.playing = false;
    if(queue.connection) {
        queue.connection.dispatcher.end();
    }
    if(queue.voiceChannel) {
        queue.voiceChannel.leave();   
    }
}

function currQueue(message, queue) {
    let songList = queue.songs.map(s=>s.title);
    return message.channel.send("Current Queue : "+songList.length+"\n" + songList.map((i) => `${songList.indexOf(i) + 1}. ${i}`).join("\n"));
}

function nowPlaying(message, queue) {
    if(queue.playing === false) {
        return message.channel.send("Nothing is playing.");
    }
    return message.channel.send(`Now Playing: **${queue.songs[0].title}**`)
}

module.exports = {
    init,
    play,
    skip,
    stop,
    currQueue,
    nowPlaying
}
