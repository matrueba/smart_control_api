'use strict'

/**
 * Module dependencies
 */
const mqtt = require('mqtt')
const chalk = require('chalk')
const debug = require('debug')('MQTTClient')
const emitter = require('./emitter').mqttEmitter

/**
 * MQTT client that receive the mqtt data
 *
 * @class MqttClient
 */
class MqttClient {
  /**
   * MqttClient constructor
   *
   * @param {Object} [mqttClient] - Mqtt Client
   * @param {String} [mqttClientId] - Mqtt Client ID
   * @param {String} [host] - MQTT host URL
   * @param {Int} [port] - MQTT port
   * @param {Int} [topics] - MQTT Topics Subscription
   */
  constructor () {
    this.mqttClient = null
    this.mqttClientId = 'smartbox_mqtt_client_' + Math.random().toString(16).substr(2, 8)
    this.host = 'mqtt://' + process.env.MQTT_HOST || '127.0.0.1'
    this.port = process.env.MQTT_PORT || 1883
    this.token = process.env.TOKEN || ''
    this.topics = {
      'DEVICE/+/COMMAND': { qos: 1 },
      'DEVICE/+/RESULT': { qos: 1 },
      'DEVICE/+/DATA/AIR_HUMIDITY': { qos: 1 },
      'DEVICE/+/DATA/TEMPERATURE': { qos: 1 },
      'DEVICE/+/DATA/GROUND_HUMIDITY': { qos: 1 },
      'DEVICE/+/DATA/WATER_LEVEL': { qos: 1 }
    }
  }

  /**
   * Start MQTT client execution
   */
  start () {
    // connection with MQTT broker, if client is disconnected try reconnection
    this.mqttClient = mqtt.connect(this.host, { clientId: this.mqttClientId, port: this.port, protocol: 'tcp' })

    this.mqttClient.on('error', (err) => {
      debug(err)
    })

    this.mqttClient.on('connect', () => {
      console.log(chalk.blue(`MQTT client ${chalk.green(this.mqttClientId)} CONNECTED TO MQTT SERVER ON URL: ${chalk.green(this.host)}`))
      this.mqttClient.subscribe(this.topics, (err) => {
        if (!err) {
          console.log(`Client ${chalk.green(this.mqttClientId)} subscribed to topics ${chalk.green(Object.keys(this.topics))}`)
        }
      })
    })

    this.mqttClient.on('reconnect', () => {
      console.log(chalk.blue(`MQTT CLIENT ${this.mqttClientId} TRYING TO RECONNECT TO MQTT SERVER ON URL: ${chalk.green(this.host)}`))
    })

    this.mqttClient.on('message', (topic, message) => {
      debug(`MQTT message received with topic: ${topic}`)
      debug(`MQTT message received with message: ${topic}`)
      this.handleMqtt(topic, message)
    })

    this.mqttClient.on('close', () => {
      debug(`MQTT client ${chalk.green(this.mqttClientId)} disconnected`)
    })

    emitter.on('publish_mqtt', message => {
      debug(`Publish topic: ${message.topic}`)
      debug(`Publish message: ${message.payload}`)
      this.mqttClient.publish(message.topic, JSON.stringify(message.payload), {qos: 1, retain: false})
  })
  }

  /**
   * Close MQTT client connection
   */
  disconnect () {
    this.mqttClient.end()
  }

  handleMqtt(topic, message){
    const payload = JSON.parse(message)
    console.log(payload)
    if (topic.match(/DEVICE\/.*\/COMMAND/)) {
        if (payload.token === this.token){
            switch(payload.command){
                case "discover":
                    const publishTopic = "SERVER/RESULT"
                    const message = {
                        "timestamp": Date.now(),
                        "token": payload.token,
                        "source": "system_control",
                        "command_response": "discover",
                        "value": "OK"
                    }    
                    this.mqttClient.publish(publishTopic, JSON.stringify(message), {qos: 1, retain: false})
                break
            }
        }
    
    }
    if (topic.match(/DEVICE\/.*\/RESULT/)) {
        if (payload.token === this.token){
            switch(payload.command_response){
                case "start_pump":
                if (payload.value === "OK"){
                  const message = {
                    "pump_started": true
                  }
                  emitter.emit('pump_status', message)
                }
                break
                case "stop_pump":
                    if (payload.value == "OK"){
                      const message = {
                        "pump_started": false,
                      }
                      emitter.emit('pump_status', message)
                    }
                break
            }
        }   
    }
    if (topic.match(/DEVICE\/.*\/DATA\/TEMPERATURE/)) {
      debug(payload)
        
        
    }
    if (topic.match(/DEVICE\/.*\/DATA\/GROUND_HUMIDITY/)) {
      emitter.emit('ground_humidity', payload)
        
        
    }
    if (topic.match(/DEVICE\/.*\/DATA\/AIR_HUMIDITY/)) {
      debug(payload)
      
      
  }
    if (topic.match(/DEVICE\/.*\/DATA\/WATER_LEVEL/)) {
        emitter.emit('mqtt_data', payload)          
    }
  }

}

module.exports = MqttClient