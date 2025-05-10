<template>
  <div class="code-editor">
    <div class="editor-header">
      <h3>Python Code Editor</h3>
      <div class="editor-buttons">
        <button @click="loadCode" :disabled="!selectedDevice">Load Code</button>
        <button @click="runCode" :disabled="!selectedDevice">Run Code</button>
        <button @click="saveCode" :disabled="!selectedDevice">Save Code</button>
      </div>
    </div>
    <div class="editor-container">
      <textarea
        v-model="code"
        @keydown.ctrl.enter="runCode"
        class="code-area"
        placeholder="Enter your Python code here..."
      ></textarea>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useWebSocket } from '../composables/useWebSocket';

export default {
  name: 'CodeEditor',
  props: {
    selectedDevice: String
  },
  setup(props) {
    const code = ref('');
    const { ws, sendCommand } = useWebSocket();

    const loadCode = async () => {
      // TODO: Implement file picker for loading code
      console.log('Load code not implemented yet');
    };

    const runCode = () => {
      if (props.selectedDevice) {
        sendCommand({
          type: 'execute-code',
          deviceId: props.selectedDevice,
          payload: code.value
        });
      }
    };

    const saveCode = async () => {
      // TODO: Implement file save functionality
      console.log('Save code not implemented yet');
    };

    return {
      code,
      loadCode,
      runCode,
      saveCode
    };
  }
};
</script>

<style scoped>
.code-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.editor-buttons {
  display: flex;
  gap: 8px;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #42b983;
  color: white;
  cursor: pointer;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background-color: #35a275;
}

.editor-container {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.code-area {
  width: 100%;
  height: 100%;
  padding: 16px;
  font-family: 'Consolas', monospace;
  font-size: 14px;
  border: none;
  resize: none;
  outline: none;
  background-color: #f6f8fa;
}
</style>
