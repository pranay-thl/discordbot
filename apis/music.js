//TODO : Add logger
require('dotenv').config();
const ytdl = require("ytdl-core");
const yts = require('yt-search');
const Youtube = require('simple-youtube-api');
const youtube = new Youtube(process.env.YOUTUBE_API_KEY);
const when = require("when");
const Discord = require('discord.js');
var storage;
function init(_runtime) {
    storage = _runtime.storage;
}

async function resetQueue(queue) {
    if (queue.connection) {
        if (queue.connection.dispatcher) {
            await queue.connection.dispatcher.end();
        }
        queue.connection = null;
    }
    if (queue.voiceChannel) {
        await queue.voiceChannel.leave();
        queue.voiceChannel = null;
    }
    queue.playing = null;
    queue.songs = [];
    queue.textChannel = null;
    queue.rawDuration = 0;
    queue.duration = "00:00:00";
    queue.loop = false;
    queue.loopQueue = false;
}

async function playHelper(queue, song) {
    if (!song) {
        return resetQueue(queue);
    }
    let dispatcher = queue.connection.play(ytdl(song.url), {
        //quality: 'highestaudio',
        //highWaterMark: 1024 * 1024 * 10
    })
        .on("start", () => {
            queue.playing = song;
            queue.songs.shift();
        })
        .on("finish", () => {
            if (queue.playing) {
                queue.rawDuration -= parseInt(queue.playing.rawDuration);
                queue.duration = new Date(queue.rawDuration * 1000).toISOString().substr(11, 8);
                if (queue.loop) {
                    queue.rawDuration += parseInt(queue.playing.rawDuration);
                    queue.duration = new Date(queue.rawDuration * 1000).toISOString().substr(11, 8);
                    queue.songs.unshift(queue.playing);
                }
                if (!queue.loop && queue.loopQueue) {
                    queue.rawDuration += parseInt(queue.playing.rawDuration);
                    queue.duration = new Date(queue.rawDuration * 1000).toISOString().substr(11, 8);
                    queue.songs.push(queue.playing);
                }
                playHelper(queue, queue.songs[0]);
            }
        })
        .on("error", (err) => {
            console.log(err);
            queue.textChannel.send('<@366182222228619265> I crashed while playing a song!');
            queue.rawDuration -= parseInt(queue.playing.rawDuration);
            queue.duration = new Date(queue.rawDuration * 1000).toISOString().substr(11, 8);
            playHelper(queue, queue.songs[0]);
        })
    //dispatcher.setVolumeLogarithmic(queue.volume / 5);
    //queue.textChannel.send(`Now Playing: **${song.title}**`);
}

async function play(message, queue, songName, silentMode = false) {
    try {
        let voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.channel.send("You need to be in a voice channel to play music!");
        }
        let perms = voiceChannel.permissionsFor(message.client.user);
        if (!perms.has("CONNECT") || !perms.has("SPEAK")) {
            return message.channel.send("I need permission to join and speak in your voice channel!");
        }
        let songRes;
        let vURL;
        if(songName.match(/^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/)) {
            vURL = songName;
            songName = songName
            .replace(/(>|<)/gi, '')
            .split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
            let vId = songName[2].split(/[^0-9a-z_\-]/i)[0];
            songRes = await youtube.getVideoByID(id);
            if (!songRes) {
                return message.channel.send("No such song found!");
            }
        }
        else{
            songRes = await youtube.searchVideos(songName, 1);
            songRes = songRes[0];
            if (!songRes) {
                return message.channel.send("No such song found!");
            }
            vURL = `https://www.youtube.com/watch?v=${songRes.id}`;
            songRes = await youtube.getVideoByID(songRes.id);
        }
        let duration = new Date(songRes.duration.seconds * 1000).toISOString().substr(11, 8);
        let song = {
            title: songRes.title,
            url: vURL,
            thumbnail: songRes.thumbnails.default.url,
            duration: duration,
            rawDuration: songRes.duration.seconds,
            requestedBy: `${message.author.username} (${message.author.tag})`
        };
        queue.songs.push(song);
        queue.rawDuration += parseInt(song.rawDuration);
        queue.duration = new Date(queue.rawDuration * 1000).toISOString().substr(11, 8);
        if (!queue.connection) {
            queue.textChannel = message.channel;
            queue.voiceChannel = voiceChannel;
            let connection = await voiceChannel.join();
            queue.connection = connection;
        }
        try {
            if (!queue.playing) {
                if (!silentMode) {
                    message.channel.send(queueEmbed(song, queue));
                }
                playHelper(queue, song);
            }
            else {
                if (!silentMode) {
                    return message.channel.send(queueEmbed(song, queue));
                }
                return;
            }
        }
        catch (err) {
            console.log(err);
            if (!silentMode) {
                return message.channel.send("Error while playing music!");
            }
            return;
        }

    }
    catch (err) {
        console.log(err);
        if (!silentMode) {
            return message.channel.send("Unexpected Error while adding song to queue.");
        }
        return;
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
    return resetQueue(queue);
}

function currQueue(message, queue) {
    if (!queue.playing) {
        return message.channel.send("Nothing is playing right now!");
    }
    const queueMsg = new Discord.MessageEmbed()
        .setAuthor('♫	♫  Current Queue  ♫	♫')
        .setColor('RANDOM')
        .setDescription(queueDescription(queue))
        .addFields(
            { name: 'Queue Size', value: queue.songs.length, inline: true },
            { name: 'Queue Duration', value: queue.duration, inline: true }
        )
    return message.channel.send(queueMsg);

}

function queueDescription(queue) {
    let des = "";
    des += `:arrow_forward: [${queue.playing.title}](${queue.playing.url}) \`[${queue.playing.duration}]\` Requested by  \`${queue.playing.requestedBy}\`\n\n`;
    for (let i = 0; i < queue.songs.length; i++) {
        let song = queue.songs[i];
        des += `\`[${i + 1}]\` [${song.title}](${song.url}) \`[${song.duration}]\` Requested by  \`${song.requestedBy}\`\n\n`;
    }
    return des;
}

function queueEmbed(song, queue) {
    const queueMsg = new Discord.MessageEmbed()
        .setAuthor('♫	♫  Addded to Queue  ♫	♫')
        .setThumbnail(song.thumbnail)
        .setColor('RANDOM')
        .setDescription(`[${song.title}](${song.url})`)
        .addFields(
            { name: 'Song Duration', value: song.duration, inline: true },
            { name: 'Queue Duration', value: queue.duration, inline: true }
        )
    if (queue.playing) {
        queueMsg.addField('Posiiton in Queue', queue.songs.length)
    }
    return queueMsg;
}

function nowPlaying(message, queue) {
    if (!queue.playing) {
        return message.channel.send("Nothing is playing.");
    }
    const videoEmbed = new Discord.MessageEmbed()
        .setThumbnail(queue.playing.thumbnail)
        .setAuthor('♫	♫  Now Playing  ♫	♫')
        .setColor('RANDOM')
        .setDescription(nowPlayingBar(queue))
    if (queue.songs[0]) {
        videoEmbed.addField('Next Song:', queue.songs[0].title);
    }
    return message.channel.send(videoEmbed);
}

function nowPlayingBar(queue) {

    let passedTimeInMS = queue.connection.dispatcher.streamTime;
    let passedTimeFormatted = new Date(passedTimeInMS).toISOString().substr(11, 8);

    let totalDurationInMS = queue.playing.rawDuration * 1000;
    let totalDurationFormatted = new Date(totalDurationInMS).toISOString().substr(11, 8);
    const playBackBarLocation = Math.round(
        (passedTimeInMS / totalDurationInMS) * 10
    );
    let playBack = '';
    /*
    Music bar taken from : https://github.com/galnir/Master-Bot/blob/f963a3fb1f963711ca68aa7bb67c9361c2341639/commands/music/nowplaying.js
    */
    for (let i = 1; i < 21; i++) {
        if (playBackBarLocation == 0) {
            playBack = ':musical_note:▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬';
            break;
        } else if (playBackBarLocation == 10) {
            playBack = '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬:musical_note:';
            break;
        } else if (i == playBackBarLocation * 2) {
            playBack = playBack + ':musical_note:';
        } else {
            playBack = playBack + '▬';
        }
    }
    playBack = `[${queue.playing.title}](${queue.playing.url})\n\n${playBack}\n\n${passedTimeFormatted}/${totalDurationFormatted}\n\nRequested By: \`${queue.playing.requestedBy}\``;
    return playBack;
}

function loop(message, queue) {
    queue.loop = !queue.loop;
    if (queue.loop) {
        message.channel.send(":repeat_one: Loop song enabled");
    }
    else {
        message.channel.send("Loop song disabled");
    }
}

function loopQueue(message, queue) {
    queue.loopQueue = !queue.loopQueue;
    if (queue.loopQueue) {
        message.channel.send(":repeat: Loop queue enabled");
    }
    else {
        message.channel.send("Loop queue disabled");
    }
}

function remove(message, queue, songNumber) {
    if (!message.member.voice.channel) {
        return message.channel.send("You need to be in a voice channel to remove from queue!");
    }
    if (!queue.playing) {
        return message.channel.send("Nothing is playing!");
    }
    if (!(Number.isInteger(songNumber) && songNumber > 0)) {
        return message.channel.send("Provide a valid number!");
    }
    if (songNumber > queue.songs.length) {
        return message.channel.send("Specify a number less than queue length");
    }
    let removeSong = queue.songs[songNumber - 1];
    queue.songs.splice(songNumber - 1, 1);
    queue.rawDuration -= parseInt(removeSong.rawDuration);
    queue.duration = new Date(queue.rawDuration * 1000).toISOString().substr(11, 8);
    return message.channel.send(`${removeSong.title} Removed from queue`);
}

module.exports = {
    init,
    play,
    skip,
    stop,
    currQueue,
    nowPlaying,
    loop,
    loopQueue,
    remove
}
