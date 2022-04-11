'use strict'

const debug = require('debug')('smartbox-api')
const express = require('express')
const controlEmitter = require('../emitter').controlEmitter
const mqttEmitter = require('../emitter').mqttEmitter
const asyncify = require('express-asyncify')
const server = require('../server')

const route = asyncify(express.Router())


route.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
})

route.get('/',  async (req, res, next) => {
  debug('A request has come to /')
  try{
    const server = {"res": "API is running"}
  } catch (e) {
    next(e)
  }
  res.send(server)
})

route.post('/control_auto/:deveui',  async (req, res, next) => {
  const { deveui } = req.params
  debug(`A request has come to /control/${deveui}`)
  debug(`Request device deveui: ${deveui}`)
  try {
    const message = {"type": "control_auto", "data": req.body}
    controlEmitter.emit('server_request', message)
  } catch (e) {
    next(e)
  }
  res.send(200)
})

route.post('/start_pump/:deveui',  async (req, res, next) => {
  const { deveui } = req.params
  debug(`A request has come to /start_pump/${deveui}`)
  debug(`Request device deveui: ${deveui}`)
  try {
    const message = {"type": "start_pump", "data": ""}
    controlEmitter.emit('server_request', message)
  } catch (e) {
    next(e)
  }
  res.send(200)
})

route.post('/stop_pump/:deveui',  async (req, res, next) => {
  const { deveui } = req.params
  debug(`A request has come to /stop_pump/${deveui}`)
  debug(`Request device deveui: ${deveui}`)
  try {
    const message = {"type": "stop_pump", "data": ""}
    controlEmitter.emit('server_request', message)
  } catch (e) {
    next(e)
  }
  res.send(200)
})


module.exports = route