#
extend the nodejs main process in electron-vue/src/main.js to manage simulating multiple IoT devices running micropython. A separate web interface will be provided in the renderer process to manage the python code running on the simulated devices and simulate the devices operating in a 3D environment. 

The main process should have the following features:
- spawn and destroy multiple worker threads that each run a separate instance of pyodide simulating a micropython runtime for each IoT device
- provide a websocket server that allows the renderer process to send commands and receive state from each worker thread    
- provide access to the filesystem to each worker thread to load user-created python code to run on the simulated devices

