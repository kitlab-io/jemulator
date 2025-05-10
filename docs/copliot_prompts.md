#
extend the nodejs main process in electron-vue/src/main.js to manage simulating multiple IoT devices running micropython. A separate web interface will be provided in the renderer process to manage the python code running on the simulated devices and simulate the devices operating in a 3D environment. 

The main process should have the following features:
- spawn and destroy multiple worker threads that each run a separate instance of pyodide simulating a micropython runtime for each IoT device
- provide a websocket server that allows the renderer process to send commands and receive state from each worker thread    
- provide access to the filesystem to each worker thread to load user-created python code to run on the simulated devices

#
update the setup of the pyodide instance in @console.html to:
- load a custom python class that simulates the state and controls of a microcontroller connected to a battery, a motor, and a temperature sensor
- each of the microcontroller-connected components has a pyodide.ffi binding to emit events to the spawned browser process when their state changes
- the browser process relays the events via main process IPC to the renderer process to update the 3D environment

#
update main.js to forward websocket messages with type 'component-event' to the renderer process. then in the renderer process, update DeviceManager.vue to parse the events and update corresponding game objects in the 3D environment. the gameobjects are registered with the window object in the renderer process like 'window.RCCarController'. the 'component-event' message should contain the name of the component that emitted the event and the event data like this payload:
{
    "type": "component-event",
    "deviceId": "device1",
    "event": {
        "type": "motor_update",
        "component": "motor",
        "data": {
            "speed": 10,
            "direction": 1,
            "is_running": true,
            "power_consumption": 0.95
        },
        "timestamp": 1746865268.4099998,
        "deviceId": "device1"
    }
}
when receiving a 'motor_update' event, call the corresponding method on the gameobject registered in the renderer process using the appropriate arguments derived from the payload. for example:
window.RCCarController.setConstantMotorSpeed(event.data.speed * event.data.direction)