'use strict'

/**
 * Module dependencies
 */
const EventEmitter = require('events')

const mqttEmitter = new EventEmitter() // Handle events in MQTT client
const controlEmitter = new EventEmitter() // Handle events in auto control

module.exports = { mqttEmitter, controlEmitter }
