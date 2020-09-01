const when = require("when");

var mongoutils = require("./mongoutils");
var discord = require("./discord");
var settings = require("../../settings");
const { getBlackList } = require("./discord");

function init(settings) {
    mongoutils.init(settings);
}

module.exports  = {
    init: init,
    connect: mongoutils.connect,
    getDb: mongoutils.getDb,
    disconnect: mongoutils.disconnct,
    getProfanityCount: discord.getProfanityCount,
    updateProfanityCount: discord.updateProfanityCount,
    whitelistWord: discord.whitelistWord,
    blacklistWord: discord.blacklistWord,
    getWhiteList: discord.getWhiteList,
    getBlackList: discord.getBlackList,
    getToDoList: discord.getToDoList,
    addToDoList: discord.addToDoList,
    popToDoList: discord.popToDoList
}