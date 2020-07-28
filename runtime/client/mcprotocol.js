const mc = require('minecraft-protocol');
const when = require('when');

class MinecraftClient {
    constructor(host,port,username,version, obstacles) {
        this.host = host;
        this.port = port;
        this.username = username;
        this.version = version;
        this.login = false;
        this.mcClient = null;
        this.obstacles = obstacles;
    }

    connect() {
        return when.promise((resolve, reject) =>{
            try{
                this.login = false;
                this.mcClient = mc.createClient({
                    host: this.host,
                    port: this.port,
                    username: this.username,
                    version: this.version
                });
                //this.login = true;
                this.mcClient.on('chat', (packet) =>{
                    // if(this.login === false) {
                    //     this.mcClient.write('chat', {message: "/login "+process.env.MC_PASSWORD});
                    //     this.mcClient.write('chat', {message: "/warp hub"});
                    //     this.login = true;
                    //     return resolve({});
                    // }
                    let parsedMessage = "";
                    try{
                        let parsedArray = JSON.parse(packet.message).extra;
                        parsedArray.forEach(element => {
                            parsedMessage+=element.text;
                        });
                        parsedMessage=parsedMessage.replace(/§[0-9]|§[a-zA-Z]/g,"")
                        if(parsedMessage.startsWith("[F]")){
                            this.obstacles.emitToChannel(parsedMessage);
                        }
                    }
                    catch(err) {
                        //todo
                    }
                })
                this.mcClient.on("error", (err) => {
                    console.log(err);
                })
                this.mcClient.on("disconnect",(msg)=>{
                    this.obstacles.emitToChannel(JSON.stringify(msg));
                })
                return resolve({data:{mcClient:this.mcClient}});
            }
            catch(err) {
                console.log(err);
                return reject({error:{msg:err}});
            }
        });
    }
    executeCommand(command) {
        this.mcClient.write('chat', {message: command});
    }
}
module.exports = MinecraftClient;