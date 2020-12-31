const when = require('when');
const cron = require("node-cron");
var client;
var jobs = [];

function init(_client) {
    client = _client;
    jobs = [];
}

function killAll() {
    jobs.forEach((job)=>{
        job.destroy();
    })
}

function demo(user, msg) {
    let task = cron.schedule('*/3 * * * * *', () => {
        user.send(msg);
    });
    jobs.push(task);
}

module.exports = {
    init,
    demo,
    killAll
}