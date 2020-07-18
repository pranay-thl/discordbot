const when = require("when");

var mongoutils = require("./mongoutils");
var discord = require("./discord");
var settings = require("../../settings");

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
    getWhiteList: discord.getWhiteList
}