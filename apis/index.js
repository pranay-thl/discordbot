var nasa = require("./nasa");
var todo = require("./todo");

function init(_runtime) {
    todo.init(_runtime);
}

module.exports = {
    init,
    nasa,
    todo
}