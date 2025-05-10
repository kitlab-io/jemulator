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
import { ref, onMounted } from 'vue';
import { useWebSocket } from '../composables/useWebSocket';

export default {
  name: 'DeviceManager',
  setup() {
    const devices = ref([]);
    const selectedDevice = ref(null);
    const { ws, sendCommand } = useWebSocket();

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
