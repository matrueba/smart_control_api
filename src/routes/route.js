'use strict'
const debug = require('debug')('smartbox-api')
const express = require('express')
const MainContol = require('../control')


class Router {

  constructor(emitter) {
    this.emitter = emitter
    this.control = new MainContol(emitter)
    this.router = express.Router()
    this.router.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method')
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
      res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE')
      next()
    })

    this.initializeRoutes()
    this.control.run()
  }

  initializeRoutes() {
    this.router.get('/', this.getServerStatus.bind(this))
    this.router.post('/control_auto/:deveui', this.postControlAuto.bind(this))
    this.router.post('/control_pump/:deveui', this.pumpControl.bind(this))
    this.router.get('/sensor_values/:deveui', this.getSensorValues.bind(this))
    this.router.get('/last_sensor_values/:deveui', this.getLastSensorValues.bind(this))
    this.router.get('/global_status/:deveui', this.getGlobalStatus.bind(this))
    this.router.get('/control_mode/:deveui', this.getControlMode.bind(this))
  }

  async getServerStatus(req, res, next) {
    debug('A request has come to /')
    try{
      const server = {"res": "API is running"}
    } catch (e) {
      next(e)
    }
    res.send(server)
  }

  async postControlAuto(req, res, next){
    let result
    let status = 200
    const { deveui } = req.params
    debug(`A request has come to /control_auto/${deveui}`)
    debug(`Request device deveui: ${deveui}`)
    try {
      result = this.control.controlAuto(deveui, req.body)
      if (!result.value){
        status = 400
      }
    } catch (e) {
      next(e)
    }
    res.send(result, status)
  }

  async pumpControl(req, res, next){
    const { deveui } = req.params
    let result
    let status = 200
    debug(`A request has come to /control_pump/${deveui}`)
    debug(`Request device deveui: ${deveui}`)
    try {
      result = this.control.handlePump(deveui, req.body)
      if (!result.value){
        status = 400
      }
    } catch (e) {
      next(e)
    }
    res.send(result, status)
  }

  async getControlMode(req, res, next){
    const { deveui } = req.params
    let message
    debug(`A request has come to /control_mode/${deveui}`)
    debug(`Request device deveui: ${deveui}`)
    try {
      message = {
        auto: this.control.control_auto,
      }
    } catch (e) {
      next(e)
    }
    res.send(message, 200)
  }


  async getSensorValues(req, res, next){
    const { deveui } = req.params
    let message
    debug(`A request has come to /sensor_values/${deveui}`)
    debug(`Request device deveui: ${deveui}`)
    try {
      message = {
        groundHumidity: this.control.last_ground_humidity_values[this.control.last_ground_humidity_values.length - 1],
        airHumidity: this.control.last_air_humidity_values[this.control.last_air_humidity_values.length - 1],
        temperature: this.control.last_temperature_values[this.control.last_temperature_values.length - 1],
        waterLevel: this.control.last_water_level_values[this.control.last_water_level_values.length -1]
      }
    } catch (e) {
      next(e)
    }
    res.send(message, 200)
  }

  async getLastSensorValues(req, res, next){
    const { deveui } = req.params
    let message
    debug(`A request has come to /last_sensor_values/${deveui}`)
    debug(`Request device deveui: ${deveui}`)
    try {
      message = {
        groundHumidity: this.control.last_ground_humidity_values,
        airHumidity: this.control.last_air_humidity_values,
        temperature: this.control.last_temperature_values,
        waterLevel: this.control.last_water_level_values
      }
    } catch (e) {
      next(e)
    }
    res.send(message, 200)
  }


  async getGlobalStatus(req, res, next){
    const { deveui } = req.params
    let message
    debug(`A request has come to /global_status/${deveui}`)
    debug(`Request device deveui: ${deveui}`)
    try {
      const current_date = new Date()
      let irrigationTime = 0
      if (this.control.pump_started){
        irrigationTime = (current_date  - this.control.start_pump_date)
      }
      
      message = {
        auto: this.control.control_auto,
        pumpStarted: this.control.pump_started,
        groundHumidity: this.control.last_ground_humidity_values[this.control.last_ground_humidity_values.length - 1],
        airHumidity: this.control.last_air_humidity_values[this.control.last_air_humidity_values.length - 1],
        temperature: this.control.last_temperature_values[this.control.last_temperature_values.length - 1],
        waterLevel: this.control.last_water_level_values[this.control.last_water_level_values.length -1],
        irrigationTime: Math.round(irrigationTime),
        autoMinuteScheduled: this.control.start_minutes,
        autoHourScheduled: this.control.start_hour
      }
    } catch (e) {
      next(e)
    }
    res.send(message, 200)
  } 

  getRouter() {
    return this.router
  }
}

module.exports = Router