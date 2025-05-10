import { parentPort } from 'worker_threads';
import { loadPyodide } from 'pyodide';

// Custom console implementation for Pyodide
const pyodideConsole = {
  write: (text) => {
    parentPort.postMessage({
      type: 'console-output',
      text
    });
  },
  writeln: (text) => {
    pyodideConsole.write(text + '\n');
  },
  writeError: (text) => {
    parentPort.postMessage({
      type: 'console-error',
      text
    });
  }
};

// Initialize Pyodide
let pyodide = null;

async function initializePyodide() {
  // pyodide = await Pyodide.createPyodide({
  //   indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.21.3/full/'
  // });

  pyodide = await loadPyodide();

  // Set up Pyodide console
  pyodide.setStdout(pyodideConsole.write);
  pyodide.setStderr(pyodideConsole.writeError);

  // Configure Pyodide for MicroPython compatibility
  await pyodide.runPythonAsync(`
    import sys
    sys.path.append('/lib')
    
    # MicroPython specific imports
    import machine
    import network
    import time
  `);

  // Initialize REPL
  pyodide.globals.set('repl', pyodide.PyProxy.repl());
}

// Handle messages from the main thread
parentPort.on('message', async (message) => {
  try {
    switch (message.type) {
      case 'load-code':
        await loadCode(message.code);
        break;
      case 'execute-code':
        await executeCode(message.code);
        break;
      case 'repl-input':
        await handleReplInput(message.input);
        break;
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  } catch (error) {
    console.error('Error in worker:', error);
    parentPort.postMessage({
      type: 'error',
      message: error.message,
      stack: error.stack
    });
  }
});

async function handleReplInput(input) {
  if (!pyodide) await initializePyodide();
  
  try {
    const result = await pyodide.globals.get('repl').execute(input);
    parentPort.postMessage({
      type: 'repl-output',
      result: result.toString()
    });
  } catch (error) {
    throw error;
  }
}

// Load Python code into the runtime
async function loadCode(code) {
  if (!pyodide) await initializePyodide();
  
  try {
    await pyodide.runPythonAsync(code);
    parentPort.postMessage({
      type: 'code-loaded',
      success: true
    });
  } catch (error) {
    console.error('Error loading code:', error);
    throw error;
  }
}

// Execute Python code
async function executeCode(code) {
  if (!pyodide) await initializePyodide();
  
  try {
    const result = await pyodide.runPythonAsync(code);
    parentPort.postMessage({
      type: 'code-executed',
      result: result.toString()
    });
  } catch (error) {
    console.error('Error executing code:', error);
    throw error;
  }
}

// Handle worker termination
parentPort.on('close', () => {
  if (pyodide) {
    pyodide.destroy();
  }
});
