const when = require("when");
const { todo } = require(".");

var storage;
function init(_runtime) {
    storage = _runtime.storage;
}

function getToDoList(userId) {
    return when.promise(async (resolve, reject) => {
        try {
            let todolist = await storage.getToDoList(userId);
            if(!todolist.data) {
                return resolve([]);
            }
            else{
                return resolve(todolist.data.list);
            }
        }
        catch (err) {
            return reject(err);
        }
    });
}

function addToDoList(userId, msg) {
    return storage.addToDoList(userId, msg);
}

function popToDoList(userId) {
    return storage.popToDoList(userId);
}

module.exports = {
    init,
    getToDoList,
    addToDoList,
    popToDoList
}