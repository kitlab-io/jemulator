<template>
  <div id="app">
    <div class="app-container">
      <DeviceManager @select-device="selectDevice" @remove-device="removeDevice" />
      <div class="editor-container">
        <CodeEditor :selected-device="selectedDevice" />
      </div>
      <REPL :selected-device="selectedDevice" />
    </div>
  </div>
</template>

<script>
import DeviceManager from './components/DeviceManager.vue';
import CodeEditor from './components/CodeEditor.vue';
import REPL from './components/REPL.vue';

export default {
  name: 'App',
  components: {
    DeviceManager,
    CodeEditor,
    REPL
  },
  data() {
    return {
      selectedDevice: null
    };
  },
  methods: {
    selectDevice(deviceId) {
      this.selectedDevice = deviceId;
    },
    removeDevice(deviceId) {
      if (this.selectedDevice === deviceId) {
        this.selectedDevice = null;
      }
    }
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-left: 1px solid #ddd;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
}
</style>