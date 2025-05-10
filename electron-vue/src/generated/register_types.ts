// Import types from dependencies
import "@needle-tools/car-physics"
import "@needle-tools/car-physics/codegen/register_types.ts"
import "needle.samples.carphysics"
import "needle.samples.carphysics/codegen/register_types.ts"

/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { PrintNumberComponent } from "../scripts/PrintNumberComponent.js";
import { RCCarController } from "../scripts/RCCarController.js";

// Register types
TypeStore.add("PrintNumberComponent", PrintNumberComponent);
TypeStore.add("RCCarController", RCCarController);
