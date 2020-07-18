class Logger{
    constructor() {
        this.debug = false
    }
    setDebug () {
        this.debug = !this.debug;
    }
    log(message,channel) {
        if(typeof(message) === "object") {
            if(message.message){
                message = message.message;
            }
            else{
                message = JSON.stringify(message);
            }
        }
        console.log(message);
        if(this.debug) {
            if(channel) {
                channel.send(message);
            }
        }
    }
}
module.exports = {
    Logger
}