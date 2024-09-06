'use strict'
const http = require('http')
const express = require('express')
const chalk = require('chalk')
const debug = require('debug')('smartbox-api')
const Router = require('./routes/route')


class Server {

  constructor(emitter) {
    this.router = new Router(emitter)
    this.port = process.env.PORT || 5000
    this.app = express()
    this.server = http.createServer(this.app)

    this.initializeMiddleware()
    this.initializeRoutes()
    this.initializeErrorHandling()
  }

  initializeMiddleware(){
    this.app.use(express.urlencoded({ extended: true }))
    this.app.use(express.json())
  }

  initializeRoutes(){
    this.app.use('/api', this.router.getRouter())
  }

  initializeErrorHandling(){
    this.app.use((err, req, res, next) => {
      debug(`Error: ${err.message}`)
      if (err.message.match(/not found/)) {
        return res.status(404).send({ error: err.message })
      }
      res.status(500).send({ error: err.message })
    })    
  }


  run(){
      this.server.listen(this.port, () => {
          console.log(chalk.blue(`SERVER LISTENING ON PORT ${chalk.green(this.port)}`))
      })
  }
}


module.exports = Server