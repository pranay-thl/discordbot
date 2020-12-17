const axios = require('axios');
const BASE_URL = "https://api.mcsrvstat.us/2/";
const Discord = require('discord.js');
async function fetchStatus(message,server) {
    try {
        var server_res = await axios.get(BASE_URL+server);
        const serverMsg = new Discord.MessageEmbed()
        .setAuthor(`⚐ ⚐ ⚐  ${server_res.data.hostname} ⚐ ⚐ ⚐`)
        //.setThumbnail(server_res.data.icon)
        .setColor('RANDOM')
        .setDescription(`${server_res.data.motd.clean.join("\n")}`)
        .addFields(
            { name: 'IP', value: server_res.data.ip,inline: true },
            { name: 'Port', value: server_res.data.port, inline: true },
            { name: 'Players', value: server_res.data.players.online + "/" +server_res.data.players.max, inline: true },
            { name: 'version', value: server_res.data.version, inline: true },
        )
        message.channel.send(serverMsg);
        //return { data: server_res.data.value };
    }
    catch (err) {
        console.log(err);
        return message.reply("API :: ServerStatus :: Something Went Wrong");
    }
}

module.exports = {
    fetchStatus
}