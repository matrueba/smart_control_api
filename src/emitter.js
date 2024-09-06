'use strict'

/**
 * Module dependencies
 */
const EventEmitter = require('events')

const mqttEmitter = new EventEmitter() // Handle events in MQTT client

module.exports = { mqttEmitter }
