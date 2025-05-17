import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { WebSocketClient } from './websocket-client.js';
import { DataVisualizer } from './data-visualizer.js';
import { UIManager } from './ui-manager.js';

// Main application class
class ThreeJSApp {
  constructor() {
    // App state
    this.isConnected = false;
    this.clientId = null;
    this.namespace = 'threejs-visualization';
    this.data = {};
    
    // Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    
    // Managers
    this.wsClient = null;
    this.visualizer = null;
    this.uiManager = null;
    
    // Initialize the application
    this.init();
  }
  
  async init() {
    // Initialize Three.js
    this.initThreeJS();
    
    // Initialize WebSocket client
    this.wsClient = new WebSocketClient();
    await this.wsClient.connect();
    
    // Initialize data visualizer
    this.visualizer = new DataVisualizer(this.scene);
    
    // Initialize UI
    this.uiManager = new UIManager(
      document.getElementById('ui-container'),
      this.onNamespaceChange.bind(this),
      this.onDataChange.bind(this)
    );
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Load initial data
    this.loadData();
    
    // Start animation loop
    this.animate();
  }
  
  initThreeJS() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x121212);
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('canvas-container').appendChild(this.renderer.domElement);
    
    // Add orbit controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
    
    // Add grid helper
    const gridHelper = new THREE.GridHelper(10, 10);
    this.scene.add(gridHelper);
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }
  
  setupEventListeners() {
    // WebSocket events
    this.wsClient.on('connected', (clientId) => {
      this.clientId = clientId;
      this.isConnected = true;
      this.uiManager.updateConnectionStatus(true, clientId);
      
      // Register as a Three.js renderer
      this.wsClient.register('Three.js Visualizer', 'threejs');
    });
    
    this.wsClient.on('disconnected', () => {
      this.isConnected = false;
      this.uiManager.updateConnectionStatus(false);
    });
    
    this.wsClient.on('db-changed', (data) => {
      if (data.namespace === this.namespace) {
        this.loadData();
      }
    });
    
    // Database change events from Electron
    window.electronAPI.onDbChanged((data) => {
      if (data.namespace === this.namespace) {
        this.loadData();
      }
    });
  }
  
  async loadData() {
    try {
      this.uiManager.setLoading(true);
      
      const result = await window.electronAPI.dbGetAll(this.namespace);
      
      if (result.success) {
        this.data = result.values || {};
        this.visualizer.updateVisualization(this.data);
        this.uiManager.updateDataDisplay(this.data);
      } else {
        console.error('Failed to load data:', result.error);
        this.uiManager.showError(result.error);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.uiManager.showError(error.message);
    } finally {
      this.uiManager.setLoading(false);
    }
  }
  
  async onNamespaceChange(newNamespace) {
    this.namespace = newNamespace;
    await this.loadData();
  }
  
  async onDataChange(key, value) {
    try {
      const result = await window.electronAPI.dbSet(
        this.namespace,
        key,
        value
      );
      
      if (result.success) {
        this.loadData();
      } else {
        console.error('Failed to save data:', result.error);
        this.uiManager.showError(result.error);
      }
    } catch (error) {
      console.error('Error saving data:', error);
      this.uiManager.showError(error.message);
    }
  }
  
  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    // Update controls
    this.controls.update();
    
    // Update visualizations if needed
    this.visualizer.update();
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ThreeJSApp();
});
