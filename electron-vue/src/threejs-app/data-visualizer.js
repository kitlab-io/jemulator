import * as THREE from 'three';

/**
 * Handles 3D visualization of data from the database
 */
export class DataVisualizer {
  constructor(scene) {
    this.scene = scene;
    this.visualizations = new Map();
    this.animationObjects = [];
    
    // Create a group to hold all visualizations
    this.visualizationGroup = new THREE.Group();
    this.scene.add(this.visualizationGroup);
  }
  
  /**
   * Update the visualization based on new data
   * @param {Object} data - Data from the database
   */
  updateVisualization(data) {
    // Clear existing visualizations
    this.clearVisualizations();
    
    // Create new visualizations based on data
    Object.entries(data).forEach(([key, value], index) => {
      const visualization = this.createVisualization(key, value, index);
      if (visualization) {
        this.visualizations.set(key, visualization);
        this.visualizationGroup.add(visualization);
      }
    });
    
    // Position the visualizations in a circular pattern
    this.arrangeVisualizations();
  }
  
  /**
   * Create a visualization for a specific data entry
   * @param {string} key - Data key
   * @param {any} value - Data value
   * @param {number} index - Index of the data entry
   * @returns {THREE.Object3D} - The created visualization
   */
  createVisualization(key, value, index) {
    const type = typeof value;
    const group = new THREE.Group();
    group.userData = { key, value, type };
    
    // Create different visualizations based on data type
    let object;
    
    if (type === 'number') {
      // For numbers, create a bar with height proportional to value
      const height = Math.max(0.1, Math.min(5, Math.abs(value) / 10));
      const geometry = new THREE.BoxGeometry(0.5, height, 0.5);
      const material = new THREE.MeshStandardMaterial({
        color: value >= 0 ? 0x4caf50 : 0xf44336,
        metalness: 0.3,
        roughness: 0.7
      });
      object = new THREE.Mesh(geometry, material);
      object.position.y = height / 2;
      
      // Add animation for numbers
      this.animationObjects.push({
        object,
        initialScale: new THREE.Vector3(1, 1, 1),
        animation: (time) => {
          object.scale.y = 1 + Math.sin(time * 2 + index) * 0.1;
        }
      });
    } else if (type === 'boolean') {
      // For booleans, create a sphere (true) or cube (false)
      const geometry = value 
        ? new THREE.SphereGeometry(0.4, 32, 16) 
        : new THREE.BoxGeometry(0.6, 0.6, 0.6);
      const material = new THREE.MeshStandardMaterial({
        color: value ? 0x2196f3 : 0xff9800,
        metalness: 0.5,
        roughness: 0.5
      });
      object = new THREE.Mesh(geometry, material);
      
      // Add animation for booleans
      this.animationObjects.push({
        object,
        initialRotation: new THREE.Euler(),
        animation: (time) => {
          if (value) {
            object.rotation.x = time * 0.5;
            object.rotation.y = time * 0.3;
          } else {
            object.rotation.y = time * 0.5;
          }
        }
      });
    } else if (type === 'string') {
      // For strings, create a torus
      const geometry = new THREE.TorusGeometry(0.3, 0.1, 16, 32);
      const material = new THREE.MeshStandardMaterial({
        color: 0x9c27b0,
        metalness: 0.3,
        roughness: 0.7
      });
      object = new THREE.Mesh(geometry, material);
      
      // Add animation for strings
      this.animationObjects.push({
        object,
        initialRotation: new THREE.Euler(),
        animation: (time) => {
          object.rotation.x = time * 0.3;
          object.rotation.y = time * 0.5;
        }
      });
    } else if (type === 'object') {
      // For objects, create a complex shape
      if (Array.isArray(value)) {
        // For arrays, create a row of small cubes
        const arrayGroup = new THREE.Group();
        const size = Math.min(value.length, 5);
        
        for (let i = 0; i < size; i++) {
          const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
          const material = new THREE.MeshStandardMaterial({
            color: 0x3f51b5,
            metalness: 0.3,
            roughness: 0.7
          });
          const cube = new THREE.Mesh(geometry, material);
          cube.position.x = (i - (size - 1) / 2) * 0.3;
          arrayGroup.add(cube);
          
          // Add animation for array elements
          this.animationObjects.push({
            object: cube,
            initialPosition: cube.position.clone(),
            animation: (time) => {
              cube.position.y = cube.userData.initialPosition.y + Math.sin(time * 3 + i) * 0.1;
            }
          });
        }
        
        object = arrayGroup;
      } else {
        // For objects, create a dodecahedron
        const geometry = new THREE.DodecahedronGeometry(0.4);
        const material = new THREE.MeshStandardMaterial({
          color: 0x00bcd4,
          metalness: 0.5,
          roughness: 0.5
        });
        object = new THREE.Mesh(geometry, material);
        
        // Add animation for objects
        this.animationObjects.push({
          object,
          initialRotation: new THREE.Euler(),
          animation: (time) => {
            object.rotation.x = time * 0.2;
            object.rotation.y = time * 0.4;
            object.rotation.z = time * 0.1;
          }
        });
      }
    } else {
      // For other types, create a simple cube
      const geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
      const material = new THREE.MeshStandardMaterial({
        color: 0x795548,
        metalness: 0.3,
        roughness: 0.7
      });
      object = new THREE.Mesh(geometry, material);
    }
    
    // Add the object to the group
    group.add(object);
    
    // Add a text label for the key
    this.addTextLabel(group, key);
    
    return group;
  }
  
  /**
   * Add a text label to a visualization
   * @param {THREE.Object3D} group - The group to add the label to
   * @param {string} text - The text to display
   */
  addTextLabel(group, text) {
    // Create a canvas for the text
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
    // Draw the text
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = '24px Arial';
    context.fillStyle = '#000000';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // Create a texture from the canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // Create a plane with the texture
    const geometry = new THREE.PlaneGeometry(1, 0.25);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.position.y = -0.5;
    plane.rotation.x = -Math.PI / 2;
    
    // Add the plane to the group
    group.add(plane);
  }
  
  /**
   * Arrange visualizations in a circular pattern
   */
  arrangeVisualizations() {
    const count = this.visualizations.size;
    const radius = Math.max(2, count * 0.5);
    
    let index = 0;
    this.visualizations.forEach((visualization) => {
      const angle = (index / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      visualization.position.set(x, 0, z);
      visualization.lookAt(0, 0, 0);
      
      index++;
    });
  }
  
  /**
   * Clear all visualizations
   */
  clearVisualizations() {
    while (this.visualizationGroup.children.length > 0) {
      const child = this.visualizationGroup.children[0];
      this.visualizationGroup.remove(child);
      
      // Dispose of geometries and materials
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
    
    this.visualizations.clear();
    this.animationObjects = [];
  }
  
  /**
   * Update animations
   */
  update() {
    const time = performance.now() * 0.001;
    
    for (const animObj of this.animationObjects) {
      if (animObj.animation) {
        animObj.animation(time);
      }
    }
  }
}
