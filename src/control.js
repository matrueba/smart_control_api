'use strict'
const debug = require('debug')('main-control')
const calculateMean = require('./utils/commonUtils').calculateMean


class MainContol{

    constructor (emitter) {
        this.emitter = emitter
        this.last_ground_humidity_values = [0] //Store last 10 ground humidity values
        this.last_temperature_values = [0] //Store last 10 temperature values
        this.last_air_humidity_values = [0] //Store last 10 air humidity values
        this.last_water_level_values = [0] //Store last 10 water level values
        this.control_auto = false  //Define if control auto is enabled
        this.pump_started = false  //Define if pump is started
        this.enable_start = true   //Define pump start is enabled
        this.start_hour = 0        //Define the hour from when pump can be started
        this.start_minutes = 0     //Define the minutes from when pump can be started
        this.start_pump_date = 0 //Define the time when pump started last time
        this.max_pump_time = parseInt(process.env.MAX_PUMP_TIME)   //Define the maximum time the pump can be running
        this.min_time_2_restart = parseInt(process.env.MIN_TIME_TO_RESTART)  //Define the minimum time since pump were started to enable again
        this.max_water_value = parseInt(process.env.MAX_WATER_VALUE) || 15
    }

    run(){

        setInterval(() => {
            this.check_start_pump()
            this.check_stop_pump()
            this.restart_enable()
        }, 1000)


        //event triggered when ground humidity value is received and store in last data array
        this.emitter.on('temperature', message => {
            debug(`Temperature value received: ${message.value}`)
            if (this.last_temperature_values.length >= 10){
                this.last_temperature_values.shift()  
            }
            this.last_temperature_values.push(message.value) 
        })
        this.emitter.on('ground_humidity', message => {
            debug(`Ground humidity value received: ${message.value}`)
            if (this.last_ground_humidity_values.length >= 10){
                this.last_ground_humidity_values.shift()  
            }
            this.last_ground_humidity_values.push(message.value) 
        })
        this.emitter.on('air_humidity', message => {
            debug(`Air humidity value received: ${message.value}`)
            if (this.last_air_humidity_values.length >= 10){
                this.last_air_humidity_values.shift()  
            }
            this.last_air_humidity_values.push(message.value) 
        })
        this.emitter.on('water_level', message => {
            debug(`Water level value received: ${message.value}`)
            if (this.last_water_level_values.length >= 10){
                this.last_water_level_values.shift()  
            }
            this.last_water_level_values.push(message.value) 
        })


        this.emitter.on('command', payload => {
            switch(payload.command){
                case "discover":
                    const publishTopic = "SERVER/RESULT"
                    const message = {
                        "timestamp": Date.now(),
                        "token": payload.token,
                        "source": "system_control",
                        "command_response": payload.command,
                        "value": "OK"
                    }    
                    this.mqttClient.publish(publishTopic, JSON.stringify(message), {qos: 1, retain: false})
                break
            }
        })


        this.emitter.on('command_result', payload => {
            if (payload.value === "OK"){
            switch(payload.command_response){ 
                case "start_pump":
                    this.manualPumpStatus(payload, true)
                break
                case "stop_pump":
                    this.manualPumpStatus(payload, false)
                break
                case "control_auto":
                    this.controlModeStatus(payload, true)
                break
                case "control_manual":
                    this.controlModeStatus(payload, false)
                break
                }
            }
            //PUBLSH GENERAL STATE ON MQTT
        })
    }

    goToManual(deveui){
        let result
        try { 
            const message = {
                "payload": {
                    "timestamp": Date.now(),
                    "token": process.env.TOKEN,
                    "source": "system_control",
                    "command": "control_manual"
                },
                "topic": `CONTROL/COMMAND`
            }
            this.emitter.emit('publish_mqtt', message)
            result = {
                "value": true,
                "mesage": "Manual mode command sent"
            }
        } catch (error) {
            result = {
                "value": false,
                "mesage": `Unable to procces manual mode request: ${error}`
            }
            return result
        }
        return result
    }

    goToAuto(deveui){
        let result
        try { 
            const message = {
                "payload": {
                    "timestamp": Date.now(),
                    "token": process.env.TOKEN,
                    "source": "system_control",
                    "command": "control_auto"
                },
                "topic": `CONTROL/COMMAND`
            }
            this.emitter.emit('publish_mqtt', message)
            result = {
                "value": true,
                "mesage": "Auto mode command sent"
            }
        
        } catch (error) {
            result = {
                "value": false,
                "mesage": `Unable to procces auto mode request: ${error}`
            }
            return result
        }
        return result
    }

    startPump(deveui){
        let result
        try {
            result = {
                "value": false,
                "mesage": "Start is in auto mode"
            }
            if (this.control_auto == false){
                const message = {
                    "payload": {
                        "timestamp": Date.now(),
                        "token": process.env.TOKEN,
                        "source": "system_control",
                        "command": "start_pump"
                    },
                    "topic": `CONTROL/COMMAND`
                }
                this.emitter.emit('publish_mqtt', message)
                result = {
                    "value": true,
                    "mesage": "Start Pump command sent"
                }
            }
        } catch (error) {
            result = {
                "value": false,
                "mesage": `Unable to procces start pump request: ${error}`
            }
            return result
        }
        return result
    }

    stopPump(deveui){
        let result
        try {
            result = {
                "value": false,
                "mesage": "Start is in auto mode"
            }
            if (this.control_auto == false){
                const message = {
                    "payload": {
                        "timestamp": Date.now(),
                        "token": process.env.TOKEN,
                        "source": "system_control",
                        "command": "stop_pump"
                    },
                    "topic": `CONTROL/COMMAND`
                }
                this.emitter.emit('publish_mqtt', message)
                result = {
                    "value": true,
                    "mesage": "Stop Pump command sent"
                }
            } 
        } catch (error){
            result = {
                "value": false,
                "mesage": `Unable to procces stop pump request: ${error}`
            }
            return result
        }
        return result
    }

    //event triggered when change in pump status is received
    manualPumpStatus(message, mode){
        debug(`Pump status info received: ${mode}`)     
        if (this.pump_started === true){
            this.start_pump_date = new Date()
        } else {
            this.enable_start = false
        }
    }

    controlModeStatus(message, mode){
        debug(`Control Auto mode info received: ${mode}`)
        this.control_auto = mode
        if (mode){
            this.start_minutes = message.data.activation_minute
            this.start_hour = message.data.activation_hour
        }
    }

    //Enable the capability to start pump once current time is above to min time to restart
    restart_enable(){
        const current_date = new Date()
        if ((this.pump_started == false) && (this.enable_start == false)){
            if (current_date >=  new Date(this.start_pump_date.getTime() + this.min_time_2_restart*1000)){
                this.enable_start = true
            }
        }
    }

    check_stop_pump(){
        //If pump is started and control is auto
        if ((this.pump_started == true) && (this.control_auto == true)){     
            const current_date = new Date()
            const pump_time = (current_date  - this.start_pump_date) / 1000
            //If water level is greater than threshold o max pump time is exceeded stop pump
            if ((pump_time >= this.max_pump_time) || (calculateMean(this.last_water_level_values) > this.max_water_value)){
                const message = {
                    "payload": {
                        "timestamp": Date.now(),
                        "token": process.env.TOKEN,
                        "source": "system_control",
                        "command": "stop_pump"
                    },
                    "topic": "CONTROL/COMMAND"
                }
                this.emitter.emit('publish_mqtt', message)               
            }
        }
    }

    check_start_pump(){
        let ground_humidity_counter = 0
        const date = new Date()
        const current_hour = date.getHours()
        const current_minute = date.getMinutes()
        // Check if auto mode is enabled and pump is not working
        if ((this.control_auto == true) && (this.pump_started == false) && (this.enable_start == true)) {   
            //Check the time to start irrigation
            if ((current_hour == this.start_hour) && (current_minute >= this.start_minutes)){
                //Check if at least 10 ground humidity values have been received
                if(this.last_ground_humidity_values.length == 10) {
                    //Check the quantity of values under threshold
                    for (let i=0; i <10; i++){
                        if (this.last_ground_humidity_values[i] < 50){
                            ground_humidity_counter += 1
                        }
                    }
                    //If quantity of values under threshold is greater than value start pump
                    if (ground_humidity_counter >=9){
                        const message = {
                            "payload": {
                                "timestamp": Date.now(),
                                "token": process.env.TOKEN,
                                "source": "system_control",
                                "command": "start_pump"
                            },
                            "topic": "CONTROL/COMMAND"
                        }
                        this.emitter.emit('publish_mqtt', message)
                    }
                }
            }
        }
    }

    periodicPublicStatus(){
        //Publish internal configuration and status to monitor in apps
        // is better take the information of the app directly from server
        const statusMsg = {
            "control_mode": this.control_auto === true ? "auto" : "manual",
            "start_enable": this.enable_start,
            "start_time": this.start_hour.toString() + ":" + this.start_minutes.toString(),
            "pump_started": this.pump_started,
            "max_pump_time": this.max_pump_time
        }
    }
}
  
module.exports = MainContol
