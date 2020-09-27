var mongoutils = require("./mongoutils");
const when = require("when");
const { resolve, reject } = require("when");


//Profanity Counter
function getProfanityCount(userId) {
    return when.promise((resolve, reject) => {
        var col = mongoutils.getDb().collection("profanity");
        col.find({'_id':userId}).toArray((err,res)=>{
            if(err) {
                return reject({err:{msg:err}});
            }
            return resolve({data:res[0]});
        });
    });
}

function updateProfanityCount(userId) {
    return when.promise((resolve, reject) => {
        var col = mongoutils.getDb().collection("profanity");
        col.updateOne({'_id':userId},{$inc:{count:1}},{upsert:true},(err,res)=>{
            if(err) {
                return reject({err:{msg:err}});
            }
            if(res == null || res.length === 0) {
                return reject({err:{msg:"userId not found"}});
            }
            return resolve({});
        });
    });
}

function whitelistWord(word,userId, userName) {
    return when.promise((resolve, reject) => {
        var col = mongoutils.getDb().collection("profanityWhileList");
        col.insertOne({_id:word, insertBy: userId, userName:userName, insertedOn: new Date()},(err,res)=>{
            if(err) {
                return reject({err:{msg:err}});
            }
            var col = mongoutils.getDb().collection("profanityBlackList");
            col.deleteOne({_id:word},(err,res) =>{
                if(err) {
                    return reject({err:{msg:err}});
                }
                return resolve({});
            });
        });
    });
}


function blacklistWord(word,userId, userName) {
    return when.promise((resolve, reject) => {
        var col = mongoutils.getDb().collection("profanityBlackList");
        col.insertOne({_id:word, insertBy: userId, userName:userName, insertedOn: new Date()},(err,res)=>{
            if(err) {
                return reject({err:{msg:err}});
            }
            var col = mongoutils.getDb().collection("profanityWhileList");
            col.deleteOne({_id:word},(err,res) =>{
                if(err) {
                    return reject({err:{msg:err}});
                }
                return resolve({});
            });
        });
    });
}



function getWhiteList() {
    return when.promise((resolve, reject) => {
        var col = mongoutils.getDb().collection("profanityWhileList");
        col.find({}).toArray((err,res)=>{
            if(err) {
                return reject({err:{msg:err}});
            }
            return resolve(res);
        });
    });
}

function getBlackList() {
    return when.promise((resolve, reject) => {
        var col = mongoutils.getDb().collection("profanityBlackList");
        col.find({}).toArray((err,res)=>{
            if(err) {
                return reject({err:{msg:err}});
            }
            return resolve(res);
        });
    });
}

function getToDoList(userId) {
    return when.promise((resolve, reject) => {
        var col = mongoutils.getDb().collection("todolist");
        col.findOne({ '_id': userId }).then((res) => {
            return resolve({ data: res });
        }).catch((err) => {
            return reject({ err: { msg: err } });
        })
    });
}

function addToDoList(userId, msg) {
    return when.promise((resolve, reject) => {
        var col = mongoutils.getDb().collection("todolist");
        col.updateOne({ '_id': userId }, { "$push": { "list": msg }, }, { upsert: true }).then((res) => {
            return resolve({});
        }).catch((err) => {
            return reject({ err: { msg: err } });
        })
    });
}

function popToDoList(userId) {
    return when.promise((resolve, reject) => {
        var col = mongoutils.getDb().collection("todolist");
        col.updateOne({ '_id': userId }, { "$pop": { "list": -1 } }).then((res) => {
            return resolve({});
        }).catch((err) => {
            return reject({ err: { msg: err } });
        })
    });
}

function createPlayList(playlistName, userId) {
    return when.promise((resolve, reject) => {
        var col = mongoutils.getDb().collection("playlist");
        col.insertOne({'_id': playlistName, 'createdBy': userId , 'songs': []}).then((res) => {
            return resolve({}); 
        }).catch((err) => {
            return reject({err: {msg: err}});
        });
    });
}

function addToPlaylist(playlistName, songName, userId) {
    return when.promise((resolve, reject) => {
        var col = mongoutils.getDb().collection("playlist");
        col.updateOne({'_id': playlistName, 'createdBy': userId},{ '$push': { 'songs': songName }}).then((res) => {
            if(res.matchedCount === 0) {
                return reject({err: {msg: "No such playlist found"}});
            }
            return resolve({data: res}); 
        }).catch((err) => {
            return reject({err: {msg: err}});
        });
    });
}

function fetchPlaylist(playlistName) {
    return when.promise((resolve, reject) => {
        var col = mongoutils.getDb().collection("playlist");
        col.findOne({ '_id': playlistName }).then((res) => {
            return resolve({ data: res });
        }).catch((err) => {
            return reject({ err: { msg: err } });
        })
    });
}

module.exports = {
    getProfanityCount,
    updateProfanityCount,
    whitelistWord,
    blacklistWord,
    getWhiteList,
    getBlackList,
    getToDoList,
    addToDoList,
    popToDoList,
    createPlayList,
    addToPlaylist,
    fetchPlaylist
}