var storage = require("./storage");
var {Logger} = require("./log");
var client = require("./client");
module.exports = {
    storage,
    log: Logger,
    client
}