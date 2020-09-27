const when = require("when");

var storage;
function init(_runtime) {
    storage = _runtime.storage;
}

function createPlayList(playlistName,user) {
    return storage.createPlayList(playlistName,user);
}

function addToPlaylist(playlistName, songName, user) {
    return storage.addToPlaylist(playlistName, songName, user);
}

function fetchPlaylist(playlistName) {
    return storage.fetchPlaylist(playlistName);
}


module.exports = {
    init,
    createPlayList,
    addToPlaylist,
    fetchPlaylist
}