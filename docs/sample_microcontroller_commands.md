```python
# Control the motor
motor.forward(50)  # Run forward at 50% speed
motor.reverse(75)  # Run in reverse at 75% speed
motor.stop()       # Stop the motor

# Check battery status
battery.get_level()  # Get current battery level
battery.start_charging()  # Start charging the battery
battery.stop_charging()   # Stop charging

# Monitor temperature
temp_sensor.read_temperature()  # Get current temperature
temp_sensor.set_ambient_temperature(30)  # Change ambient temperature

# Run the demo
demo()  # Run a demonstration of all components
```

```python
if hasattr(window, 'electronAPI'):
        window.electronAPI.sendToMain({
            'type': 'component-event',
            'event': js_event
        })

js_data = to_js(data, depth=2, dict_converter=Object.fromEntries)
    js_event = to_js({
        'type': event_type,
        'component': component,
        'data': js_data,
        'timestamp': time.time(),
        'deviceId': '${deviceId}'
    }, depth=2, dict_converter=Object.fromEntries)

    js_event = to_js({
        'type': event_type,
        'component': component,
    }, depth=2, dict_converter=Object.fromEntries)
    
    js.electronAPI.sendToMain({
        'type': 'component-event',
        'event': js_event
    })
    # Send the event to the main process via IPC
    # print("Sending event to main process:", data)
```