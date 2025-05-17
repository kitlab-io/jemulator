<!-- <script>
  import { Canvas } from '@threlte/core'
  import Scene from './scenes/Demo.svelte'
</script>
<Canvas>
  <Scene />
</Canvas>
 -->
<script lang="ts">
  import { Canvas } from "@threlte/core";
  import { Studio } from "@threlte/studio";
  // import Scene from "./scenes/Demo.svelte";
  import { World, Debug } from '@threlte/rapier'
  import PhysicsVehicleController from "./scenes/PhysicsVehicleController.svelte";
</script>

<div style="width: 100%; height: 100%;">
  <Canvas shadows>
    <Studio>
      <World>
        <Debug />
        <PhysicsVehicleController />
      </World>
    </Studio>
    <!-- <World>
      <PhysicsVehicleController />
    </World> -->
  </Canvas>
</div>
