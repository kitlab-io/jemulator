<script>
    import { T, useTask } from "@threlte/core";
    import { interactivity } from "@threlte/extras";
    import { Spring } from "svelte/motion";

    interactivity();

    const scale = new Spring(1);

    let rotation = 0;
    useTask((delta) => {
        rotation += delta;
    });
</script>

<T.PerspectiveCamera
    makeDefault
    position={[10, 10, 10]}
    oncreate={(ref) => {
        ref.lookAt(0, 1, 0);
    }}
/>

<T.DirectionalLight position={[0, 10, 10]} castShadow />

<T.Mesh
    rotation.y={rotation}
    position.y={1}
    scale={scale.current}
    onpointerenter={() => {
        scale.target = 1.5;
    }}
    onpointerleave={() => {
        scale.target = 1;
    }}
    castShadow
    position={[ 0, 5, 0 ]}
>
    <T.BoxGeometry args={[1, 2, 1]} />
    <T.MeshStandardMaterial color="hotpink" />
</T.Mesh>

<T.Mesh rotation.x={-Math.PI / 2} receiveShadow>
    <T.CircleGeometry args={[4, 40]} />
    <T.MeshStandardMaterial color="white" />
</T.Mesh>
