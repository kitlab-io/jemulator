import type { NodeTypes, Edge } from '@xyflow/react';

import { PositionLoggerNode } from './PositionLoggerNode';
import { NoSocketNode } from './NoSocketNode';
import { BatteryNode } from './BatteryNode';
import { LEDNode } from './LEDNode';
import { RockerSwitchNode } from './RockerSwitchNode';
import { WireNode } from './WireNode';
import { MotorNode } from './MotorNode';
import { MicrocontrollerNode } from './MicrocontrollerNode';
import { PotentiometerNode } from './PotentiometerNode';
import { MomentarySwitchNode } from './MomentarySwitchNode';
import { FuelGaugeNode } from './FuelGaugeNode';
import { AppNode } from './types';

// Create two sets of nodes - one for the LED circuit and one for the toy vehicle
export const ledCircuitNodes: AppNode[] = [
  // Battery node (power source)
  {
    id: 'battery1',
    type: 'battery',
    position: { x: 100, y: 200 },
    data: { label: '9V Battery' },
  },
  
  // Rocker switch to control the circuit
  {
    id: 'switch1',
    type: 'rocker-switch',
    position: { x: 300, y: 200 },
    data: { label: 'Power Switch' },
  },
  
  // Wire connecting battery to switch
  {
    id: 'wire1',
    type: 'wire',
    position: { x: 200, y: 150 },
    data: { label: 'Connection Wire' },
  },
  
  // LED that will be powered
  {
    id: 'led1',
    type: 'led',
    position: { x: 500, y: 200 },
    data: { label: 'Status LED' },
  },
  
  // Wire connecting switch to LED
  {
    id: 'wire2',
    type: 'wire',
    position: { x: 400, y: 150 },
    data: { label: 'Connection Wire' },
  },
];

// Toy electric vehicle nodes
export const vehicleCircuitNodes: AppNode[] = [
  // Battery node (power source)
  {
    id: 'vehicle-battery',
    type: 'battery',
    position: { x: 100, y: 300 },
    data: { label: '12V Battery' },
  },
  
  // System power cutoff switch
  {
    id: 'power-switch',
    type: 'rocker-switch',
    position: { x: 250, y: 300 },
    data: { 
      label: 'Power Switch',
      isOn: false,
      type: 'power'
    },
  },
  
  // Microcontroller - central component
  {
    id: 'microcontroller',
    type: 'microcontroller',
    position: { x: 400, y: 400 },
    data: { 
      label: 'Microcontroller',
      isActive: false,
      connectedComponents: [],
      throttleValue: 0,
      steeringValue: 50,
      brakeActive: false,
      fuelLevel: 100,
      directionForward: true
    },
  },
  
  // Drive motor
  {
    id: 'drive-motor',
    type: 'motor',
    position: { x: 650, y: 300 },
    data: { 
      label: 'Drive Motor',
      isRunning: false,
      speed: 0,
      type: 'drive'
    },
  },
  
  // Steering motor
  {
    id: 'steering-motor',
    type: 'motor',
    position: { x: 650, y: 450 },
    data: { 
      label: 'Steering Motor',
      isRunning: false,
      position: 'center',
      type: 'steering'
    },
  },
  
  // Throttle potentiometer
  {
    id: 'throttle-pot',
    type: 'potentiometer',
    position: { x: 250, y: 500 },
    data: { 
      label: 'Throttle',
      value: 0,
      type: 'throttle'
    },
  },
  
  // Steering potentiometer
  {
    id: 'steering-pot',
    type: 'potentiometer',
    position: { x: 400, y: 600 },
    data: { 
      label: 'Steering',
      value: 50,
      type: 'steering'
    },
  },
  
  // Brake switch
  {
    id: 'brake-switch',
    type: 'momentary-switch',
    position: { x: 550, y: 500 },
    data: { 
      label: 'Brake',
      isPressed: false
    },
  },
  
  // Direction switch
  {
    id: 'direction-switch',
    type: 'rocker-switch',
    position: { x: 100, y: 500 },
    data: { 
      label: 'Direction',
      isOn: true,
      type: 'direction'
    },
  },
  
  // Fuel gauge sensor
  {
    id: 'fuel-gauge',
    type: 'fuel-gauge',
    position: { x: 100, y: 400 },
    data: { 
      label: 'Fuel Gauge',
      fuelLevel: 100
    },
  },
  
  // Wires for connections
  {
    id: 'wire-battery-switch',
    type: 'wire',
    position: { x: 175, y: 300 },
    data: { label: 'Power Wire' },
  },
  {
    id: 'wire-switch-micro',
    type: 'wire',
    position: { x: 325, y: 350 },
    data: { label: 'Power Wire' },
  },
  {
    id: 'wire-micro-drive',
    type: 'wire',
    position: { x: 525, y: 350 },
    data: { label: 'Control Wire' },
  },
  {
    id: 'wire-micro-steering',
    type: 'wire',
    position: { x: 525, y: 425 },
    data: { label: 'Control Wire' },
  },
  {
    id: 'wire-throttle-micro',
    type: 'wire',
    position: { x: 325, y: 450 },
    data: { label: 'Signal Wire' },
  },
  {
    id: 'wire-steering-micro',
    type: 'wire',
    position: { x: 400, y: 500 },
    data: { label: 'Signal Wire' },
  },
  {
    id: 'wire-brake-micro',
    type: 'wire',
    position: { x: 475, y: 450 },
    data: { label: 'Signal Wire' },
  },
  {
    id: 'wire-direction-micro',
    type: 'wire',
    position: { x: 250, y: 450 },
    data: { label: 'Signal Wire' },
  },
  {
    id: 'wire-fuel-micro',
    type: 'wire',
    position: { x: 250, y: 400 },
    data: { label: 'Signal Wire' },
  },
];

// Use the vehicle circuit by default
export const initialNodes = vehicleCircuitNodes;

export const nodeTypes = {
  'position-logger': PositionLoggerNode,
  'no-socket': NoSocketNode,
  'battery': BatteryNode,
  'led': LEDNode,
  'rocker-switch': RockerSwitchNode,
  'wire': WireNode,
  'motor': MotorNode,
  'microcontroller': MicrocontrollerNode,
  'potentiometer': PotentiometerNode,
  'momentary-switch': MomentarySwitchNode,
  'fuel-gauge': FuelGaugeNode,
} satisfies NodeTypes;

// Define the connections between nodes for LED circuit
export const ledCircuitEdges: Edge[] = [
  // Connect battery to wire1
  {
    id: 'e1-2',
    source: 'battery1',
    target: 'wire1',
    animated: true,
  },
  // Connect wire1 to switch
  {
    id: 'e2-3',
    source: 'wire1',
    target: 'switch1',
    animated: true,
  },
  // Connect switch to wire2
  {
    id: 'e3-4',
    source: 'switch1',
    target: 'wire2',
    animated: true,
  },
  // Connect wire2 to LED
  {
    id: 'e4-5',
    source: 'wire2',
    target: 'led1',
    animated: true,
  },
];

// Define the connections for the toy vehicle circuit
export const vehicleCircuitEdges: Edge[] = [
  // Power connections
  {
    id: 'v-e1',
    source: 'vehicle-battery',
    target: 'wire-battery-switch',
    animated: true,
    style: { stroke: 'orange' },
  },
  {
    id: 'v-e2',
    source: 'wire-battery-switch',
    target: 'power-switch',
    animated: true,
    style: { stroke: 'orange' },
  },
  {
    id: 'v-e3',
    source: 'power-switch',
    target: 'wire-switch-micro',
    animated: true,
    style: { stroke: 'orange' },
  },
  {
    id: 'v-e4',
    source: 'wire-switch-micro',
    target: 'microcontroller',
    targetHandle: 'power',
    animated: true,
    style: { stroke: 'orange' },
  },
  
  // Motor connections
  {
    id: 'v-e5',
    source: 'microcontroller',
    sourceHandle: 'driveOutput',
    target: 'wire-micro-drive',
    animated: true,
    style: { stroke: 'green' },
  },
  {
    id: 'v-e6',
    source: 'wire-micro-drive',
    target: 'drive-motor',
    targetHandle: 'control',
    animated: true,
    style: { stroke: 'green' },
  },
  {
    id: 'v-e7',
    source: 'microcontroller',
    sourceHandle: 'steeringOutput',
    target: 'wire-micro-steering',
    animated: true,
    style: { stroke: 'green' },
  },
  {
    id: 'v-e8',
    source: 'wire-micro-steering',
    target: 'steering-motor',
    targetHandle: 'control',
    animated: true,
    style: { stroke: 'green' },
  },
  
  // Input connections
  {
    id: 'v-e9',
    source: 'throttle-pot',
    sourceHandle: 'signal',
    target: 'wire-throttle-micro',
    animated: true,
    style: { stroke: 'blue' },
  },
  {
    id: 'v-e10',
    source: 'wire-throttle-micro',
    target: 'microcontroller',
    targetHandle: 'driveMotor',
    animated: true,
    style: { stroke: 'blue' },
  },
  {
    id: 'v-e11',
    source: 'steering-pot',
    sourceHandle: 'signal',
    target: 'wire-steering-micro',
    animated: true,
    style: { stroke: 'blue' },
  },
  {
    id: 'v-e12',
    source: 'wire-steering-micro',
    target: 'microcontroller',
    targetHandle: 'steeringMotor',
    animated: true,
    style: { stroke: 'blue' },
  },
  {
    id: 'v-e13',
    source: 'brake-switch',
    sourceHandle: 'signal',
    target: 'wire-brake-micro',
    animated: true,
    style: { stroke: 'blue' },
  },
  {
    id: 'v-e14',
    source: 'wire-brake-micro',
    target: 'microcontroller',
    targetHandle: 'brakeSwitch',
    animated: true,
    style: { stroke: 'blue' },
  },
  {
    id: 'v-e15',
    source: 'direction-switch',
    sourceHandle: 'signal',
    target: 'wire-direction-micro',
    animated: true,
    style: { stroke: 'blue' },
  },
  {
    id: 'v-e16',
    source: 'wire-direction-micro',
    target: 'microcontroller',
    targetHandle: 'driveMotor',
    animated: true,
    style: { stroke: 'blue' },
  },
  {
    id: 'v-e17',
    source: 'fuel-gauge',
    sourceHandle: 'signal',
    target: 'wire-fuel-micro',
    animated: true,
    style: { stroke: 'blue' },
  },
  {
    id: 'v-e18',
    source: 'wire-fuel-micro',
    target: 'microcontroller',
    targetHandle: 'fuelGauge',
    animated: true,
    style: { stroke: 'blue' },
  },
  
  // Ground connections (return path)
  {
    id: 'v-e19',
    source: 'drive-motor',
    sourceHandle: 'ground',
    target: 'vehicle-battery',
    animated: true,
    style: { stroke: 'gray' },
  },
  {
    id: 'v-e20',
    source: 'steering-motor',
    sourceHandle: 'ground',
    target: 'vehicle-battery',
    animated: true,
    style: { stroke: 'gray' },
  },
  {
    id: 'v-e21',
    source: 'throttle-pot',
    sourceHandle: 'ground',
    target: 'vehicle-battery',
    animated: true,
    style: { stroke: 'gray' },
  },
  {
    id: 'v-e22',
    source: 'steering-pot',
    sourceHandle: 'ground',
    target: 'vehicle-battery',
    animated: true,
    style: { stroke: 'gray' },
  },
  {
    id: 'v-e23',
    source: 'brake-switch',
    sourceHandle: 'ground',
    target: 'vehicle-battery',
    animated: true,
    style: { stroke: 'gray' },
  },
  {
    id: 'v-e24',
    source: 'microcontroller',
    sourceHandle: 'ground',
    target: 'vehicle-battery',
    animated: true,
    style: { stroke: 'gray' },
  },
  {
    id: 'v-e25',
    source: 'fuel-gauge',
    sourceHandle: 'ground',
    target: 'vehicle-battery',
    animated: true,
    style: { stroke: 'gray' },
  },
];

// Create a version of the vehicle circuit with incomplete connections (for puzzle)
export const incompleteVehicleCircuitEdges: Edge[] = [
  // Only include some basic connections to start with
  {
    id: 'v-e1',
    source: 'vehicle-battery',
    target: 'wire-battery-switch',
    animated: true,
    style: { stroke: 'orange' },
  },
  {
    id: 'v-e2',
    source: 'wire-battery-switch',
    target: 'power-switch',
    animated: true,
    style: { stroke: 'orange' },
  },
  // Missing connections to microcontroller and components
];

// The incompleteVehicleCircuitEdges is already defined above

// Use the incomplete vehicle circuit edges by default (for puzzle)
export const initialEdges = incompleteVehicleCircuitEdges;
