'use strict'

const MqttClient = require('./src/mqttClient')
const server = require('./src/server')
const MainContol = require('./src/control')

const mqttClient = new MqttClient()
const control = new MainContol()

control.run()
server.run()
mqttClient.start()
