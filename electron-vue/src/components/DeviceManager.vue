<template>
  <div class="device-manager">
    <h3>IoT Devices</h3>
    <div class="device-list">
      <div
        v-for="device in devices"
        :key="device.id"
        class="device-item"
        :class="{ 'active': selectedDevice === device.id }"
        @click="selectDevice(device.id)"
      >
        <span class="device-name">Device {{ device.id }}</span>
        <div class="device-actions">
          <button @click.stop="openConsole(device.id)" class="console-btn" title="Open Console">Console</button>
          <button @click.stop="removeDevice(device.id)" class="remove-btn">Remove</button>
        </div>
      </div>
    </div>
    <div class="device-controls">
      <button @click="addDevice(false)" class="add-device-btn">Add Device</button>
      <button @click="addDevice(true)" class="add-console-btn">Add Console Device</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { useWebSocket } from '../composables/useWebSocket';

export default {
  name: 'DeviceManager',
  setup() {
    const devices = ref([]);
    const selectedDevice = ref(null);
    const { ws, sendCommand } = useWebSocket();
    let componentEventListener = null;

    const addDevice = (withConsole = false) => {
      const newDeviceId = `device${devices.value.length + 1}`;
      sendCommand({
        type: 'spawn-device',
        deviceId: newDeviceId,
        payload: {
          useConsole: withConsole,
          showWindow: withConsole
        }
      });
      devices.value.push({ id: newDeviceId, hasConsole: withConsole });
      selectedDevice.value = newDeviceId;
    };
    
    const openConsole = (deviceId) => {
      // Open a console for an existing device
      sendCommand({
        type: 'spawn-device',
        deviceId: `${deviceId}-console`,
        payload: {
          useConsole: true,
          showWindow: true
        }
      });
    };

    const removeDevice = (deviceId) => {
      sendCommand({
        type: 'destroy-device',
        deviceId
      });
      devices.value = devices.value.filter(d => d.id !== deviceId);
      if (selectedDevice.value === deviceId) {
        selectedDevice.value = null;
      }
    };

    const selectDevice = (deviceId) => {
      selectedDevice.value = deviceId;
    };
    
    // Handle component events from devices
    const handleComponentEvent = (message) => {
      console.log('Received component event:', message);
      
      if (message.type === 'component-event' && message.event) {
        const { deviceId, event } = message;
        
        // Update 3D environment based on the component event
        updateGameObject(deviceId, event);
      }
    };
    
    // Update the corresponding game object in the 3D environment
    const updateGameObject = (deviceId, event) => {
      const { type, component, data } = event;
      
      // Check if we have the appropriate controller in the window object
      if (window.RCCarController) {
        switch (type) {
          case 'motor_update':
            if (component === 'motor') {
              // Update motor state in the 3D environment
              const motorSpeed = data.speed * data.direction;
              console.log(`Setting motor speed to ${motorSpeed} for device ${deviceId}`);
              window.RCCarController.setConstantMotorSpeed(motorSpeed);
            }
            break;
            
          case 'battery_update':
            if (component === 'battery') {
              // Update battery state in the 3D environment if needed
              console.log(`Battery level: ${data.level}% for device ${deviceId}`);
              if (window.RCCarController.setBatteryLevel) {
                window.RCCarController.setBatteryLevel(data.level);
              }
            }
            break;
            
          case 'temperature_update':
            if (component === 'temperature_sensor') {
              // Update temperature visualization if needed
              console.log(`Temperature: ${data.temperature}°C for device ${deviceId}`);
              if (window.RCCarController.setTemperature) {
                window.RCCarController.setTemperature(data.temperature);
              }
            }
            break;
            
          default:
            console.log(`Unhandled event type: ${type}`);
        }
      } else {
        console.warn('RCCarController not found in window object');
      }
    };
    
    onMounted(() => {
      // Set up listener for component events from the main process
      if (window.electronAPI && window.electronAPI.onComponentEvent) {
        componentEventListener = window.electronAPI.onComponentEvent(handleComponentEvent);
      }
    });
    
    onUnmounted(() => {
      // Clean up event listener
      if (componentEventListener) {
        componentEventListener();
      }
    });

    return {
      devices,
      selectedDevice,
      addDevice,
      removeDevice,
      selectDevice,
      openConsole
    };
  }
};
</script>

<style scoped>
.device-manager {
  width: 300px;
  padding: 16px;
  border-right: 1px solid #ddd;
}

.device-list {
  margin: 16px 0;
}

.device-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  margin: 4px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.device-actions {
  display: flex;
  gap: 5px;
}

.device-item.active {
  background-color: #f0f0f0;
  border-color: #42b983;
}

.device-name {
  font-weight: 500;
}

.device-controls {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.add-device-btn, .add-console-btn {
  flex: 1;
  padding: 8px;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.add-device-btn {
  background-color: #42b983;
}

.add-device-btn:hover {
  background-color: #35a275;
}

.add-console-btn {
  background-color: #3498db;
}

.add-console-btn:hover {
  background-color: #2980b9;
}

.console-btn {
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
}

.console-btn:hover {
  background-color: #2980b9;
}

.remove-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
}

.remove-btn:hover {
  background-color: #c0392b;
}
</style>
