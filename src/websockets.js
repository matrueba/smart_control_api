const WebSocket = require('ws')
const { v4: uuidv4 } = require('uuid')


class WebSockets{
    constructor(emitter){
        this.emitter = emitter
        this.clients = {}
        this.wss = new WebSocket.Server({ port: 8080 })
        initialize()
    }

    initialize(){
        this.wss.on('connection', ws => {
            const clientUuid = uuidv4()
            clientes[clientUuid] = ws
            console.log(`Client connected with ${clientUuid}`)
            ws.send(`Welcome to server. Server assign you: ${clientUuid}`)


            this.emitter.on('websocket', message => {
            })
          

          

          ws.on('close', () => {
            console.log(`Client with ID: ${clientUuid} disconnected`);
            delete clients[clientUuid]
          })
        })
    }
}

module.exports = WebSockets