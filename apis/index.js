var nasa = require("./nasa");
var todo = require("./todo");
var chuck = require("./chucknorris");
var math = require("./math");
var playlist = require("./playlist");

function init(_runtime) {
    todo.init(_runtime);
    playlist.init(_runtime);
}

module.exports = {
    init,
    nasa,
    todo,
    chuck,
    math,
    playlist
}