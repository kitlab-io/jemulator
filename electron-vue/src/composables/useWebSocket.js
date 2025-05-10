import { ref, onMounted, onUnmounted } from 'vue';

export function useWebSocket() {
  const ws = ref(null);
  const messages = ref([]);
  const connected = ref(false);
  const reconnecting = ref(false);
  const reconnectAttempts = ref(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 2000; // 2 seconds

  const connect = () => {
    if (ws.value) {
      ws.value.close();
    }

    ws.value = new WebSocket('ws://localhost:8080');
    reconnectAttempts.value = 0;
    reconnecting.value = false;

    ws.value.onopen = () => {
      connected.value = true;
      reconnecting.value = false;
      reconnectAttempts.value = 0;
      console.log('WebSocket connected');
    };

    ws.value.onmessage = (event) => {
      const message = JSON.parse(event.data);
      messages.value.push(message);
      // Emit the message to any listeners
      emitMessage(message);
    };

    ws.value.onclose = (event) => {
      connected.value = false;
      console.log('WebSocket disconnected:', event.code);
      
      // Don't try to reconnect if we closed it intentionally
      if (event.code === 1000) return;
      
      startReconnection();
    };

    ws.value.onerror = (error) => {
      console.error('WebSocket error:', error);
      connected.value = false;
      startReconnection();
    };
  };

  const startReconnection = () => {
    if (reconnecting.value) return;
    
    reconnecting.value = true;
    
    const attempt = () => {
      if (reconnectAttempts.value >= MAX_RECONNECT_ATTEMPTS) {
        console.error('Max reconnection attempts reached');
        reconnecting.value = false;
        return;
      }

      console.log(`Reconnecting... Attempt ${reconnectAttempts.value + 1}`);
      reconnectAttempts.value++;
      connect();
    };

    setTimeout(attempt, RECONNECT_DELAY * reconnectAttempts.value);
  };

  const sendCommand = (command) => {
    if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    try {
      ws.value.send(JSON.stringify(command));
    } catch (error) {
      console.error('Error sending command:', error);
      startReconnection();
    }
  };

  const emitMessage = (message) => {
    // This is a placeholder for any additional message handling logic
    // You can add more specific handlers here if needed
    switch (message.type) {
      case 'error':
        console.error('WebSocket error:', message);
        break;
      case 'console-output':
        console.log('Console output:', message.message);
        break;
      case 'console-error':
        console.error('Console error:', message.message);
        break;
      default:
        console.log('Message received:', message);
    }
  };

  onMounted(connect);
  onUnmounted(() => {
    if (ws.value) {
      ws.value.close();
    }
  });

  return {
    ws,
    messages,
    connected,
    sendCommand,
    reconnecting,
    reconnectAttempts
  };
}