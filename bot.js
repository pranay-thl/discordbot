require('dotenv').config();
const Discord = require('discord.js');
const Canvas = require('canvas');

var settings = require("./settings");
var runtime = require("./runtime");
var api = require("./apis");

var { Obstacles } = require("./obstacles");
var clientMap = {};
const client = new Discord.Client({
    disableEveryone: true,
    disabledEvents: ['TYPING_START'],
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async message => {
    try {
        let obstaclesBot;
        if (!(message.guild)) {
            let authorId = message.author.id;
            if (clientMap.hasOwnProperty(authorId)) {
                obstaclesBot = clientMap[authorId];
            }
            else {
                obstaclesBot = new Obstacles(client, authorId, runtime, api);
                clientMap[authorId] = obstaclesBot;
            }
        }
        else {
            let serverName = message.guild.name;
            if (clientMap.hasOwnProperty(serverName)) {
                obstaclesBot = clientMap[serverName];
            }
            else {
                obstaclesBot = new Obstacles(client, serverName, runtime, api);
                clientMap[serverName] = obstaclesBot;
            }
        }
        obstaclesBot.messageHandler(message);
    }
    catch (err) {
        console.log(err);
        message.channel.send("Unexpected error :: " + JSON.stringify(err));
    }
});

client.on("guildCreate", guild => {
    let channel = guild.channels.cache.find(ch => ch.name === 'member-logs');
    if (!channel) {
        guild.channels.create('member-logs', {
            reason: 'To track members',
            permissionOverwrites: [
                {
                    id: client.user.id,
                    allow: ['SEND_MESSAGES'],
                },
            ],
        })
    }
});

function generateWelcomeMessage(member) {
    let welcomeList = [
        `${member} just joined the server - glhf!`,
        `${member} just joined. Everyone, look busy!`,
        `${member} just joined. Can I get a heal?`,
        `${member} joined your party.`,
        `${member} joined. You must construct additional pylons.`,
        `Ermagherd. ${member} is here.`,
        `Welcome, ${member}. Stay awhile and listen.`,
        `Welcome, ${member}. We were expecting you ( ͡° ͜ʖ ͡°)`,
        `Welcome, ${member}. We hope you brought pizza.`,
        `Welcome, ${member}. Leave your weapons by the door.`,
        `A wild ${member} appeared.`,
        `Swoooosh. ${member} just landed.`,
        `Brace yourselves. ${member} just joined the server.`,
        `${member} just joined. Hide your bananas.`,
        `${member} just arrived. Seems OP - please nerf.`,
        `${member} just slid into the server.`,
        `A ${member} has spawned in the server.`,
        `Big ${member} showed up!`,
        `Where’s ${member}? In the server!`,
        `${member} hopped into the server. Kangaroo!!`,
        `${member} just showed up. Hold my beer.`,
    ]
    return welcomeList[Math.floor(Math.random() * welcomeList.length)];
}

function generateGoodbyeMessage(member) {
    let goodbyeWelcomeList = [
        `Adios ${member}`,
        `Dasvidaniya ${member}`,
        `Until we meet again ${member}`,
        `${member}, leaving so early ?`,
        `${member}, you'll be missed.`,
        `Goodbye ${member}`,
        `${member} left the party`,
        `${member} left the server`,
    ]
    return goodbyeWelcomeList[Math.floor(Math.random() * goodbyeWelcomeList.length)];
}

async function addCustomRoles(member) {
    try{
        if(member.guild.name === "Vanguard"){
            //custome roles for Vanguard
            var role= member.guild.roles.cache.find(role => role.name === "Not Guided");
            await member.roles.add(role);
        }
    }
    catch(err) {
        console.log(err);
    }
}

const applyText = (canvas, text) => {
	const ctx = canvas.getContext('2d');

	// Declare a base size of the font
	let fontSize = 70;

	do {
		// Assign the font to the context and decrement it so it can be measured again
		ctx.font = `${fontSize -= 10}px sans-serif`;
		// Compare pixel width of the text to the canvas minus the approximate avatar size
	} while (ctx.measureText(text).width > canvas.width - 300);

	// Return the result to use in the actual canvas
	return ctx.font;
};
client.on('guildMemberAdd', async member => {
    let channel = member.guild.channels.cache.find(ch => ch.name === 'member-logs');
    //backward compatibility
    if (!channel) {
        channel = await member.guild.channels.create('member-logs', {
            reason: 'To track members',
            permissionOverwrites: [
                {
                    id: member.guild.roles.everyone.id,
                    deny: ['SEND_MESSAGES', 'MANAGE_MESSAGES']
                },
                {
                    id: client.user.id,
                    allow: ['SEND_MESSAGES'],
                }
            ],
        })
    }
    if (!channel) {
        return;
    }
    const canvas = Canvas.createCanvas(700, 250);
    const ctx = canvas.getContext('2d');

    const background = await Canvas.loadImage('views/wallpaper.jpg');
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#74037b';
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Slightly smaller text placed above the member's display name
    ctx.font = '28px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Welcome to the server,', canvas.width / 2.5, canvas.height / 3.5);

    // Add an exclamation point here and below
    ctx.font = applyText(canvas, `${member.displayName}!`);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${member.displayName}!`, canvas.width / 2.5, canvas.height / 1.8);

    ctx.beginPath();
    ctx.arc(125, 125, 100, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ format: 'jpg', size: 1024 }));
    ctx.drawImage(avatar, 25, 25, 200, 200);

    const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'welcome-image.png');
    addCustomRoles(member);
    return channel.send(generateWelcomeMessage(member), attachment);
});

client.on('guildMemberRemove', async member => {
    let username = member.user.username;
    let channel = member.guild.channels.cache.find(ch => ch.name === 'member-logs');
    //backward compatibility
    if (!channel) {
        channel = await member.guild.channels.create('member-logs', {
            reason: 'To track members',
            permissionOverwrites: [
                {
                    id: member.guild.roles.everyone.id,
                    deny: ['SEND_MESSAGES', 'MANAGE_MESSAGES']
                },
                {
                    id: client.user.id,
                    allow: ['SEND_MESSAGES'],
                }
            ],
        })
    }
    if (!channel) {
        return;
    }
    return channel.send(generateGoodbyeMessage(username));
});

runtime.storage.init(settings);
runtime.storage.connect().then(() => {
    api.init(runtime);
    client.login(process.env.DISCORD_TOKEN);
    runtime.cronjobs.init(client);
}).otherwise((err) => {
    console.log(err);
})

process.on("uncaughtException", (err) => {
    console.log(err);
})
