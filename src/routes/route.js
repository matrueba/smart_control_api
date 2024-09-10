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
    this.router.post('/control_manual/:deveui', this.postControlManual.bind(this))
    this.router.post('/control_auto/:deveui', this.postControlAuto.bind(this))
    this.router.post('/start_pump/:deveui', this.startPump.bind(this))
    this.router.post('/stop_pump/:deveui', this.stopPump.bind(this))
    this.router.get('/sensor_values/:deveui', this.getSensorValues.bind(this))
    this.router.get('/last_sensor_values/:deveui', this.getLastSensorValues.bind(this))
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
    let status = 200
    const { deveui } = req.params
    debug(`A request has come to /control_auto/${deveui}`)
    debug(`Request device deveui: ${deveui}`)
    try {
      const result = this.control.goToAuto(deveui)
      if (!result.value){
        status = 400
      }
    } catch (e) {
      next(e)
    }
    res.send(status)
  }

  async postControlManual(req, res, next){
    let status = 200
    const { deveui } = req.params
    debug(`A request has come to /control_manual/${deveui}`)
    debug(`Request device deveui: ${deveui}`)
    try {
      const result = this.control.goToManual(deveui)
      if (!result.value){
        status = 400
      }
    } catch (e) {
      next(e)
    }
    res.send(status)
  }

  async startPump(req, res, next){
    const { deveui } = req.params
    let status = 200
    debug(`A request has come to /start_pump/${deveui}`)
    debug(`Request device deveui: ${deveui}`)
    try {
      const result = this.control.startPump(deveui)
      if (!result.value){
        status = 400
      }
    } catch (e) {
      next(e)
    }
    res.send(status)
  }

  async stopPump(req, res, next){
    const { deveui } = req.params
    let status = 200
    debug(`A request has come to /stop_pump/${deveui}`)
    debug(`Request device deveui: ${deveui}`)
    try {
      const result = this.control.stopPump(deveui)
      if (!result.value){
        status = 400
      }
    } catch (e) {
      next(e)
    }
    res.send(status)
  }

  async getSensorValues(req, res, next){
    const { deveui } = req.params
    let message
    debug(`A request has come to /sensor_values/${deveui}`)
    debug(`Request device deveui: ${deveui}`)
    try {
      message = {
        ground_humidity: this.control.last_ground_humidity_values[0],
        air_humididty: this.control.last_air_humidity_values[0],
        temperature: this.control.last_temperature_values[0],
        water_level: this.control.last_water_level_values[0]
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
        ground_humidity: this.control.last_ground_humidity_values,
        air_humididty: this.control.last_air_humidity_values,
        temperature: this.control.last_temperature_values,
        water_level: this.control.last_water_level_values
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