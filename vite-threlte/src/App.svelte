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
  import Scene from "./scenes/Demo.svelte";
</script>

<div style="width: 100%; height: 100%;">
  <Canvas>
    <Studio>
      <Scene />
    </Studio>
  </Canvas>
</div>
