'use strict'
const debug = require('debug')('main-control')


class Device{

    constructor(){
        this.last_ground_humidity_values = [] //Store last 10 ground humidity values
        this.last_temperature_values = [] //Store last 10 temperature values
        this.last_air_humidity_values = [] //Store last 10 air humidity values
        this.last_water_level_values = [] //Store last 10 water level values
        this.control_auto = false  //Define if control auto is enabled
        this.pump_started = false  //Define if pump is started
        this.enable_start = true   //Define pump start is enabled
        this.start_hour = 0        //Define the hour from when pump can be started
        this.start_minutes = 0     //Define the minutes from when pump can be started
        this.start_pump_date = 0 //Define the time when pump started last time
        this.max_pump_time = parseInt(process.env.MAX_PUMP_TIME)   //Define the maximum time the pump can be running
        this.min_time_2_restart = parseInt(process.env.MIN_TIME_TO_RESTART)  //Define the minimum time since pump were started to enable again
    }

    check_stop_pump(){
        const water_level = 10 // temporal fix variable
        //If pump is started and control is auto
        if ((this.pump_started == true) && (this.control_auto == true)){     
            const current_date = new Date()
            const pump_time = (current_date  - this.start_pump_date) / 1000
            //If water level is greater than threshold o max pump time is exceeded stop pump
            if ((pump_time >= this.max_pump_time) || (water_level > 15)){
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

module.exports = Device