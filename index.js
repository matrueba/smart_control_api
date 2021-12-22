'use strict'

const MqttClient = require('./src/mqttClient')
const server = require('./src/server')
const autoControl = require('./src/control')

const mqttClient = new MqttClient()

autoControl.run()
server.run()
mqttClient.start()
