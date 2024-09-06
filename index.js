'use strict'
const MqttClient = require('./src/mqttClient')
const Server = require('./src/server')
const EventEmitter = require('events')

const emitter = new EventEmitter()
const mqttClient = new MqttClient(emitter)
const server = new Server(emitter)

server.run()
mqttClient.start()
