'use strict'

const http = require('http')
const express = require('express')
const chalk = require('chalk')
const router = require('../src/routes/route')
const debug = require('debug')('smartbox-api')
const asyncify = require('express-asyncify')


const port = process.env.PORT || 5000
const app = asyncify(express())
const server = http.createServer(app)

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use('/api', router)

app.use((err, req, res, next) => {
  debug(`Error: ${err.message}`)
  if (err.message.match(/not found/)) {
    return res.status(404).send({ error: err.message })
  }

  res.status(500).send({ error: err.message })
})

function run(){
    server.listen(port, () => {
        console.log(chalk.blue(`SERVER LISTENING ON PORT ${chalk.green(port)}`))
    })
}


module.exports = { run }