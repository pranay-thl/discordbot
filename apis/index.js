var nasa = require("./nasa");
var todo = require("./todo");
var chuck = require("./chucknorris");

function init(_runtime) {
    todo.init(_runtime);
}

module.exports = {
    init,
    nasa,
    todo,
    chuck
}