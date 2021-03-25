global.fetch  = require('node-fetch');
URL = require('url').URL;
const unsplash = require('unsplash-js');
const Discord = require('discord.js');
const serverApi = unsplash.createApi({ accessKey: process.env.UNSPLASH_KEY });
async function fetchImage(message, keyword) {
    try{
        if(!keyword) {
            keyword = "mountain";
        }
        let imageRes=await serverApi.photos.getRandom({
            query: keyword,
            count: 1,
        });
        let imgURL = imageRes.response[0].urls.full;
        const unsplashEmbed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setImage(imgURL)
        return message.channel.send(unsplashEmbed);
    }
    catch(err) {
        console.log(err);
        return message.reply("API :: Unsplash :: Something Went Wrong");
    }
}

module.exports = {
    fetchImage
}