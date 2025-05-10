<template>
  <div class="repl">
    <div class="repl-header">
      <h3>Python REPL</h3>
      <div class="repl-info">
        <span v-if="selectedDevice">Device: {{ selectedDevice }}</span>
        <span v-else>No device selected</span>
      </div>
    </div>
    <div class="repl-container">
      <div class="output-area" ref="outputArea">
        <div
          v-for="(message, index) in messages"
          :key="index"
          :class="{ 'error': message.type === 'error' }"
        >
          {{ message.text }}
        </div>
      </div>
      <div class="input-area">
        <input
          v-model="input"
          @keydown.enter.prevent="sendInput"
          placeholder="Enter Python code..."
          :disabled="!selectedDevice"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useWebSocket } from '../composables/useWebSocket';

export default {
  name: 'REPL',
  props: {
    selectedDevice: String
  },
  setup(props) {
    const input = ref('');
    const messages = ref([]);
    const outputArea = ref(null);
    const { ws, sendCommand } = useWebSocket();

    const sendInput = () => {
      if (props.selectedDevice && input.value.trim()) {
        sendCommand({
          type: 'repl-input',
          deviceId: props.selectedDevice,
          payload: input.value
        });
        messages.value.push({ text: `>>> ${input.value}` });
        input.value = '';
      }
    };

    const handleWebSocketMessage = (message) => {
      if (message.type === 'console-output' && message.deviceId === props.selectedDevice) {
        messages.value.push({ text: message.message });
      } else if (message.type === 'console-error' && message.deviceId === props.selectedDevice) {
        messages.value.push({ text: message.message, type: 'error' });
      } else if (message.type === 'repl-output' && message.deviceId === props.selectedDevice) {
        messages.value.push({ text: message.output });
      }
    };

    onMounted(() => {
      ws.value.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      };
    });

    onUnmounted(() => {
      ws.value.onmessage = null;
    });

    watch(messages, () => {
      if (outputArea.value) {
        outputArea.value.scrollTop = outputArea.value.scrollHeight;
      }
    }, { deep: true });

    return {
      input,
      messages,
      outputArea,
      sendInput
    };
  }
};
</script>

<style scoped>
.repl {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-left: 1px solid #ddd;
}

.repl-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.repl-info {
  color: #666;
}

.repl-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.output-area {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  font-family: 'Consolas', monospace;
  font-size: 14px;
  background-color: #f6f8fa;
}

.error {
  color: #e74c3c;
}

.input-area {
  padding: 16px;
  background-color: white;
  border-top: 1px solid #ddd;
}

input {
  width: 100%;
  padding: 8px;
  font-family: 'Consolas', monospace;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
  outline: none;
}

input:disabled {
  background-color: #f5f5f5;
}
</style>
