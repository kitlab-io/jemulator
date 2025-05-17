<script lang="ts">
  import { T, useThrelte } from '@threlte/core';
  import { interactivity, OrbitControls } from '@threlte/extras';
  import { RigidBody, Collider, useRapier, Debug } from '@threlte/rapier';
  import { Vector3, Quaternion, MathUtils, Object3D, Euler, Group, RepeatWrapping } from 'three';
  import { onMount, onDestroy } from 'svelte';
  
  // Define types for our components
  interface Wheel {
    index: number;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    steeringAngle: number;
    rotationAngle: number;
  }

  interface MovementState {
    forward: number;
    right: number;
    brake: number;
    reset: boolean;
    accelerateForce: { value: number; min: number; max: number; step: number };
    brakeForce: { value: number; min: number; max: number; step: number };
  }

  // Enable interactivity for all objects
  interactivity();

  // Get the Threlte context
  const { renderer, scene, camera } = useThrelte();
  console.log('Threlte context initialized');
  
  // Get Rapier physics
  const { world } = useRapier();
  console.log('Rapier physics world obtained:', world ? 'success' : 'failed');

  // Car properties
  let car: Object3D | null = null;
  let chassis: any = null; // Rapier RigidBody type
  // let wheels: Wheel[] = [];
  let wheels:Wheel[] = [
    {
      index: 0,
      position: { x: -1, y: 0, z: -1.5 },
      rotation: { x: 90, y: 0, z: 90 },
      steeringAngle: 0,
      rotationAngle: 0
    },
    {
      index: 1,
      position: { x: 1, y: 0, z: -1.5 },
      rotation: { x: 90, y: 0, z: 90 },
      steeringAngle: 0,
      rotationAngle: 0
    },
    {
      index: 2,
      position: { x: -1, y: 0, z: 1.5 },
      rotation: { x: 90, y: 0, z: 90 },
      steeringAngle: 0,
      rotationAngle: 0
    },
    {
      index: 3,
      position: { x: 1, y: 0, z: 1.5 },
      rotation: { x: 90, y: 0, z: 90 },
      steeringAngle: 0,
      rotationAngle: 0
    }
  ];
  let vehicleController: any = null; // Rapier VehicleController type

  // Movement state
  const movement: MovementState = {
    forward: 0,
    right: 0,
    brake: 0,
    reset: false,
    accelerateForce: { value: 0, min: -30, max: 30, step: 1 },
    brakeForce: { value: 0, min: 0, max: 1, step: 0.05 }
  };

  // Handle keyboard input
  function handleKeyDown(event: KeyboardEvent): void {
    console.log('Key pressed:', event.key);
    if (event.key === 'w' || event.key === 'ArrowUp') movement.forward = -1;
    if (event.key === 's' || event.key === 'ArrowDown') movement.forward = 1;
    if (event.key === 'a' || event.key === 'ArrowLeft') movement.right = 1;
    if (event.key === 'd' || event.key === 'ArrowRight') movement.right = -1;
    if (event.key === 'r') movement.reset = true;
    if (event.key === ' ') movement.brake = 1;
  }

  function handleKeyUp(event: KeyboardEvent): void {
    console.log('Key released:', event.key);
    if (event.key === 'w' || event.key === 's' || event.key === 'ArrowUp' || event.key === 'ArrowDown') movement.forward = 0;
    if (event.key === 'a' || event.key === 'd' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') movement.right = 0;
    if (event.key === 'r') movement.reset = false;
    if (event.key === ' ') movement.brake = 0;
  }

  // Add wheel to the vehicle
  function addWheel(index: number, position: {x: number, y: number, z: number}, carMesh: Object3D): void {
    console.log(`Adding wheel ${index} at position:`, position);
    // Define wheel properties
    const wheelRadius = 0.3;
    const wheelWidth = 0.4;
    const suspensionRestLength = 0.8;
    const wheelPosition = position; // Position relative to chassis
    const wheelDirection = { x: 0.0, y: -1.0, z: 0.0 }; // Downward direction
    const wheelAxle = { x: -1.0, y: 0.0, z: 0.0 }; // Axle direction

    // Add the wheel to the vehicle controller
    console.log(`Wheel ${index}: Adding to vehicle controller`);
    vehicleController.addWheel(
      wheelPosition,
      wheelDirection,
      wheelAxle,
      suspensionRestLength,
      wheelRadius
    );
    console.log(`Wheel ${index}: Successfully added to vehicle controller`);

    // Set suspension stiffness for wheel
    console.log(`Wheel ${index}: Setting suspension stiffness`);
    vehicleController.setWheelSuspensionStiffness(index, 24.0);

    // Set wheel friction
    console.log(`Wheel ${index}: Setting friction slip`);
    vehicleController.setWheelFrictionSlip(index, 1000.0);

    // Enable steering for the wheel
    console.log(`Wheel ${index}: Setting initial steering (front wheel: ${position.z < 0})`);
    vehicleController.setWheelSteering(index, position.z < 0);

    // Create a wheel reference object to track position and rotation
    const wheel: Wheel = {
      index,
      position: { ...position },
      rotation: { x: 0, y: 0, z: 0 },
      steeringAngle: 0,
      rotationAngle: 0
    };

    wheels.push(wheel);
    console.log(`Wheel ${index}: Setup complete`);
  }

  // Update car controls based on input
  function updateCarControl(delta: number) {
    // console.log('Updating car controls');
    // console.log(movement)
    if (!vehicleController || !chassis) {
      console.log('Cannot update car: vehicle controller or chassis not initialized');
      return;
    }

    if (movement.reset) {
      // Reset car position and rotation
      chassis.setTranslation({ x: 0, y: 1, z: 0 }, true);
      chassis.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      chassis.setLinvel({ x: 0, y: 0, z: 0 }, true);
      chassis.setAngvel({ x: 0, y: 0, z: 0 }, true);

      movement.accelerateForce.value = 0;
      movement.brakeForce.value = 0;
      return;
    }

    let accelerateForce = 0;

    if (movement.forward < 0) {
      accelerateForce = movement.accelerateForce.value - movement.accelerateForce.step;
      if (accelerateForce < movement.accelerateForce.min) accelerateForce = movement.accelerateForce.min;
    } else if (movement.forward > 0) {
      accelerateForce = movement.accelerateForce.value + movement.accelerateForce.step;
      if (accelerateForce > movement.accelerateForce.max) accelerateForce = movement.accelerateForce.max;
    } else {
      if (chassis.isSleeping()) chassis.wakeUp();
    }

    movement.accelerateForce.value = accelerateForce;

    // Apply engine force
    vehicleController.setWheelEngineForce(0, accelerateForce);
    vehicleController.setWheelEngineForce(1, accelerateForce);

    // Apply brake force
    const brakeForce = movement.brake * 1.0;
    vehicleController.setWheelBrake(0, brakeForce);
    vehicleController.setWheelBrake(1, brakeForce);
    vehicleController.setWheelBrake(2, brakeForce);
    vehicleController.setWheelBrake(3, brakeForce);

    // Apply steering
    const steeringAngle = -movement.right * 0.5;
    vehicleController.setWheelSteering(0, steeringAngle);
    vehicleController.setWheelSteering(1, steeringAngle);

    // Update wheel positions and rotations
    // updateWheelVisuals(accelerateForce, steeringAngle, delta);
  }

  // Update wheel visuals based on physics state
  function updateWheelVisuals(engineForce: number, steeringAngle: number, delta: number): void {
    if (!vehicleController || wheels.length === 0) return;

    for (let i = 0; i < wheels.length; i++) {
      const wheel = wheels[i];
      const wheelPosition = vehicleController.wheelPosition(wheel.index);
      const wheelRotation = vehicleController.wheelRotation(wheel.index);

      // Extract rotation angles from quaternion
      const quat = new Quaternion(wheelRotation.x, wheelRotation.y, wheelRotation.z, wheelRotation.w);
      const euler = new Euler();
      euler.setFromQuaternion(quat);

      // Update wheel object
      wheel.rotation.x = euler.x;
      wheel.rotation.y = euler.y;
      wheel.rotation.z = euler.z;
      wheel.position.x = wheelPosition.x;
      wheel.position.y = wheelPosition.y;
      wheel.position.z = wheelPosition.z;

      // Update steering angle
      if (i === 0 || i === 1) {
        wheel.steeringAngle = steeringAngle;
      }

      // Update rotation angle based on movement
      wheel.rotationAngle += engineForce * delta * 0.1;
    }
  }

  // Initialize the vehicle controller once physics is ready
  function initVehicleController(rigidBody: any): void {
    console.log('Initializing vehicle controller...');
    if (!world) {
      console.error('Cannot initialize vehicle controller: Rapier world not available');
      return;
    }
    if (!rigidBody) {
      console.error('Cannot initialize vehicle controller: Rigid body not provided');
      return;
    }
    
    console.log('Setting chassis rigid body');
    chassis = rigidBody;
    console.log('Creating vehicle controller from Rapier world');
    try {
      vehicleController = world.createVehicleController(chassis);
      console.log('Vehicle controller created successfully');
    } catch (error) {
      console.error('Failed to create vehicle controller:', error);
      return;
    }

    // Add wheels
    console.log('Preparing to add wheels, car object status:', car ? 'available' : 'not available');
    if (car) {
      addWheel(0, { x: -1, y: 0, z: -1.5 }, car);
      addWheel(1, { x: 1, y: 0, z: -1.5 }, car);
      addWheel(2, { x: -1, y: 0, z: 1.5 }, car);
      addWheel(3, { x: 1, y: 0, z: 1.5 }, car);

      // Set initial steering for front wheels
      console.log('Setting initial steering for front wheels');
      vehicleController.setWheelSteering(0, 0);
      vehicleController.setWheelSteering(1, 0);
      console.log('Vehicle controller initialization complete');
    }
  }

  // Animation loop using requestAnimationFrame
  let lastTime = 0;
  let animationFrameId: number;
  let frameCount = 0;
  const logInterval = 100; // Log every 100 frames

  function animate(time: number): void {
    const delta = (time - lastTime) / 1000;
    lastTime = time;
    
    // Log status periodically
    frameCount++;
    if (frameCount % logInterval === 0) {
      // console.log(`Animation frame ${frameCount}, vehicle controller status:`, vehicleController ? 'active' : 'not initialized');
      // console.log('Chassis status:', chassis ? 'active' : 'not initialized');
    }

    if (vehicleController && chassis) {
      updateCarControl(delta);
      vehicleController.updateVehicle(delta);
    }

    animationFrameId = requestAnimationFrame(animate);
  }

  // Add event listeners for keyboard controls and start animation loop
  onMount(() => {
    console.log('Component mounted, setting up event listeners and animation loop');
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Start animation loop
    console.log('Starting animation loop');
    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(animate);
    console.log('Animation loop started with ID:', animationFrameId);
  });

  // Clean up event listeners and animation loop
  onDestroy(() => {
    console.log('Component being destroyed, cleaning up resources');
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    
    // Cancel animation loop
    if (animationFrameId) {
      console.log('Cancelling animation frame:', animationFrameId);
      cancelAnimationFrame(animationFrameId);
    }
    console.log('Component cleanup complete');
  });
</script>

<!-- <div class="scene-container"> -->
  <T.PerspectiveCamera
    makeDefault
    position={[10, 10, 10]}
  >
    <OrbitControls enableZoom={true} />
  </T.PerspectiveCamera>

  <T.DirectionalLight
    castShadow
    position={[8, 20, -3]}
    intensity={1.5}
  />

  <T.AmbientLight intensity={0.5} />

  <!-- Ground -->
  <RigidBody type="fixed">
    <T.Group scale={[ 1, 1, 1 ]}>
      <T.Mesh receiveShadow position={[ 0, -3.1, 0 ]}>
        <T.BoxGeometry args={[100, 0.5, 100]} />
        <T.MeshStandardMaterial color="#888888">
          <T.Texture
            url="/grid.png"
            repeat={[80, 80]}
            wrapS={RepeatWrapping}
            wrapT={RepeatWrapping}
            slot="map"
          />
        </T.MeshStandardMaterial>
      </T.Mesh>
    </T.Group>
  </RigidBody>

  <!-- Car chassis -->
  <RigidBody 
    type="dynamic"
    bind:rigidBody={chassis}
    oncreate={initVehicleController}
  >
    <T.Group position={[ 0, 1, 0 ]} bind:ref={car}
      <!-- Car body -->
      <T.Mesh castShadow position={[ 0, 0, 0 ]}>
        <T.BoxGeometry args={[2, 1, 4]} />
        <T.MeshStandardMaterial color="#FF0000" />
      </T.Mesh>

      <!-- Wheels -->
      {#each wheels as wheel, i}
        <!-- <T.Mesh
          castShadow
          position={[wheel.position.x, wheel.position.y, wheel.position.z]}
          rotation={[0, wheel.steeringAngle, wheel.rotationAngle]}
        > -->
        <T.Mesh
        castShadow
        position={[ 1.5, 0, -1.5 ]}
        rotation={[0, 0, Math.PI/2]}
        scale={[ -2.2, -0.8, -2.2 ]}
      >
          <T.CylinderGeometry args={[0.3, 0.3, 0.4, 16]} rotation={[0, 0, Math.PI/2]} />
          <T.MeshStandardMaterial color="#000000" />
        </T.Mesh>
      {/each}
    </T.Group>
  </RigidBody>

  <!-- Lighting -->
  <T.HemisphereLight intensity={0.5} />
  <T.DirectionalLight 
    position={[0, 12.5, 12.5]} 
    intensity={4} 
    castShadow 
    shadow-mapSize-width={2048}
    shadow-mapSize-height={2048}
    shadow-camera-left={-40}
    shadow-camera-right={40}
    shadow-camera-top={40}
    shadow-camera-bottom={-40}
    shadow-camera-near={1}
    shadow-camera-far={50}
  />

  <!-- Instructions -->
  <div class="instructions">
    <h2>Rapier Vehicle Controller</h2>
    <p>WASD or Arrow keys to move</p>
    <p>Space to brake</p>
    <p>R to reset</p>
  </div>
<!-- </div> -->

<style>
  .instructions {
    position: absolute;
    top: 10px;
    left: 10px;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    padding: 10px;
    border-radius: 5px;
    font-family: Arial, sans-serif;
  }
</style>
