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
    this.router.get('/', this.getStatus.bind(this))
    this.router.post('/control_auto/:deveui', this.postControlAuto.bind(this))
    this.router.post('/start_pump/:deveui', this.startPump.bind(this))
    this.router.post('/stop_pump/:deveui', this.stopPump.bind(this))
    this.router.get('/ground_humidity/:deveui', this.getGroundHumidity.bind(this))
  }

  async getStatus(req, res, next) {
    debug('A request has come to /')
    try{
      const server = {"res": "API is running"}
    } catch (e) {
      next(e)
    }
    res.send(server)
  }

  async postControlAuto(req, res, next){
    const { deveui } = req.params
    debug(`A request has come to /control/${deveui}`)
    debug(`Request device deveui: ${deveui}`)
    try {
      const message = {"type": "control_auto", "data": req.body}
      this.emitter.emit('server_request', message) //replace by direct function of control
    } catch (e) {
      next(e)
    }
    res.send(200)
  }

  async startPump(req, res, next){
    const { deveui } = req.params
    debug(`A request has come to /start_pump/${deveui}`)
    debug(`Request device deveui: ${deveui}`)
    try {
      const message = {"type": "start_pump", "data": ""}
      this.emitter.emit('server_request', message)
    } catch (e) {
      next(e)
    }
    res.send(200)
  }

  async stopPump(req, res, next){
    const { deveui } = req.params
    debug(`A request has come to /stop_pump/${deveui}`)
    debug(`Request device deveui: ${deveui}`)
    try {
      const message = {"type": "stop_pump", "data": ""}
      this.emitter.emit('server_request', message)
    } catch (e) {
      next(e)
    }
    res.send(200)
  }

  async getGroundHumidity(req, res, next){
    const { deveui } = req.params
    debug(`A request has come to /ground_humidity/${deveui}`)
    debug(`Request device deveui: ${deveui}`)
    try {
      const groundHumidityValue = this.control.last_ground_humidity_values[0]
    } catch (e) {
      next(e)
    }
    res.send(200)
  } 

  getRouter() {
    return this.router
  }
}

module.exports = Router