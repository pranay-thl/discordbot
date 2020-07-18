var mongoutils = require("./mongoutils");
const when = require("when");


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
            return resolve({});
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

module.exports = {
    getProfanityCount,
    updateProfanityCount,
    whitelistWord,
    getWhiteList
}