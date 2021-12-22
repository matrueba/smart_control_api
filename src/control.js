'use strict'

const mqttEmitter = require('./emitter').mqttEmitter
const controlEmitter = require('./emitter').controlEmitter
const debug = require('debug')('main-control')

let last_humidity_values = [] //Store last 10 ground humidity values
let control_auto = false  //Define if control auto is enabled
let pump_started = false  //Define if pump is started
let enable_start = true   //Define pump start is enabled
let start_hour = 0        //Define the hour from when pump can be started
let start_minutes = 0     //Define the minutes from when pump can be started
let start_pump_date = 0 //Define the time when pump started last time
const max_pump_time = 0   //Define the maximum time the pump can be running
const min_time_2_restart = 86400  //Define the minimum time since pump were started to enable again


function run(){

    //event triggered when ground humidity value is received and store in last data array
    mqttEmitter.on('ground_humidity', message => {
        debug(`Ground humidity value received: ${message.value}`)
        if (last_humidity_values.length >= 10){
            last_humidity_values.shift()  
        }
        last_humidity_values.push(message.value) 
    })

    //event triggered when change in pump status is received
    mqttEmitter.on('pump_status', message => {
        debug(`Pump status info received: ${message.pump_started}`)
        pump_started = message.pump_started
        if (pump_started === true){
            start_pump_date = new Date()
        }
    })

    //event triggered when request is received
    controlEmitter.on('server_request', message => {
        debug(`Request come from: ${message.type}`)
        switch(message.type){
            case "control_auto":
                if (message.data === true || message.data === false)
                debug(`Control auto: ${message.data}`)
                control_auto = message.data === 'true' ? true : false
            break
            case "time_start":
                const time = message.data
                const date = new Date(time)
                date.toISOString().substr(14, 5)
                start_minutes = date.getMinutes()
                start_hour = date.getHours()
            break
        }
    })

    setInterval(() => {
        check_start_pump()
        check_stop_pump()
        restart_enable()
    }, 1000)
}

function restart_enable(){
    //Enable the capability to start pup once current time is above to min time to restart
    const current_date = new Date()
    if (current_date >= start_pump_date + min_time_2_restart){
        enable_start = true
    }
}

function check_stop_pump(){

    const water_level = 10 // temporal fix variable

    //If pump is started and control is auto
    if ((pump_started == true) && (control_auto == true)){     
        const current_date = new Date()
        const pump_time = (current_date  - start_pump_date) / 1000
        //If water level is greater than threshold o max pump time is exceeded stop pump
        if ((pump_time >= max_pump_time) || (water_level > 15)){
            const message = {
                "payload": {
                    "timestamp": Date.now(),
                    "token": global.get('token'),
                    "source": "system_control",
                    "command": "stop_pump"
                },
                "topic": "SERVER/COMMAND"
            }
            mqttEmitter.emit('publish_mqtt', message)               
        }
    }
}

function check_start_pump(){

    let humidity_counter = 0
    const date = new Date()
    const current_hour = date.getHours()
    const current_minute = date.getMinutes()

    // Check if auto mode is enabled and pump is not working
    if ((control_auto == true) && (pump_started == false) && (enable_start == true)) {   
        //Check the time to start irrigation
        if ((current_hour == start_hour) && (current_minute >= start_minutes)){
            //Check if at least 10 ground humidity values have been received
            if(last_humidity_values.length == 10) {
                //Check the quantity of values under threshold
                for (let i=0; i <10; i++){
                    if (last_humidity_values[i] < 50){
                        humidity_counter += 1
                    }
                }
                //If quantity of values under threshold is greater than value start pump
                if (humidity_counter >=9){
                    const message = {
                        "payload": {
                            "timestamp": Date.now(),
                            "token": process.env.TOKEN,
                            "source": "system_control",
                            "command": "start_pump"
                        },
                        "topic": "SERVER/COMMAND"
                    }
                    mqttEmitter.emit('publish_mqtt', message)
                }
            }
        }
    }

}

module.exports = {run}

