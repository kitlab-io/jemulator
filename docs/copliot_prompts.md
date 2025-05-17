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

#
using the LED circuit implementation in @App.tsx as reference, add a simulation to @App.tsx  for a toy electic vehicle with the following components:
- a battery
- a motor for drive train
- a motor for steering
- a fuel gauge sensor
- a momentary switch for braking
- a potentiometer for steering
- a potentiometer for throttle
- a rocker switch for the direction of the throttle
- a rocker switch for system power cutoff 
- a microcontroller connected all the components

on the microcontroller, implement the following features:
- an input socket for receiving events from the components
- a socket for common electrical ground for the components and battery
- an input socket for receiving power to the battery

create new node types and node source files as needed in @react-flow/src 

create circuit validation for this toy vehicle similar to the LED circuit

#
design a system and modules for launching one or more Electron renderer processes with each potentially having their own web app. For example, one renderer process could run a Vue app, another a Three.JS app, and another a svelte app. All the renderer processes must be able to read and write persistent state to a local sqlite database via a websocket service exposed by the main electron process. the user can launch any number and type of renderer process/view to observe or manipulate a part of persistent state in the best way that view provides.  

##
with each web app potentially having its own vite build process, how can we organize the build scripts to launch electron app and building each web app for development environment from a single npm run command?

#
let's implement a persistent data store as sqlite db saved in the application support directory via Electron. the main electron process connects to this db and exposes a real-time proxy db connection over websocket server. any of the browser windows' web apps can connect to this websocket server via shared websocket client implementation. create a sample sqlite db and all necessary files to implement this across the electron app, vue app in main window, and react and needle apps in seccondary windows.