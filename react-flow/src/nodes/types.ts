import type { Node, NodeProps as ReactFlowNodeProps, BuiltInNode } from '@xyflow/react';

// Define a base type for node data to ensure all nodes have the required properties
export interface BaseNodeData extends Record<string, unknown> {
  label: string;
}

// Helper type to extract the data type from a Node type
export type NodeData<T> = T extends Node<infer D, any> ? D : never;

// Helper type for creating properly typed node props
export type NodeComponentProps<T extends Node> = Omit<ReactFlowNodeProps, 'data'> & {
  data: T extends Node<infer D, any> ? D : never;
};

export type BatteryNode = Node<BaseNodeData, 'battery'>;
export type LEDNode = Node<BaseNodeData & { isOn?: boolean }, 'led'>;
export type RockerSwitchNode = Node<BaseNodeData & { 
  isOn?: boolean;
  type?: 'power' | 'direction';
}, 'rocker-switch'>;
export type WireNode = Node<BaseNodeData, 'wire'>;
export type PositionLoggerNode = Node<BaseNodeData, 'position-logger'>;
export type NoSocketNode = Node<BaseNodeData, 'no-socket'>;

// New node types for toy electric vehicle
export type MotorNode = Node<BaseNodeData & { 
  isRunning?: boolean;
  speed?: number;
  position?: 'left' | 'center' | 'right';
  type: 'drive' | 'steering';
}, 'motor'>;

export type MicrocontrollerNode = Node<BaseNodeData & { 
  isActive?: boolean;
  connectedComponents?: string[];
  throttleValue?: number;
  steeringValue?: number;
  brakeActive?: boolean;
  fuelLevel?: number;
  directionForward?: boolean;
}, 'microcontroller'>;

export type PotentiometerNode = Node<BaseNodeData & { 
  value?: number;
  type: 'throttle' | 'steering';
}, 'potentiometer'>;

export type MomentarySwitchNode = Node<BaseNodeData & { 
  isPressed?: boolean;
}, 'momentary-switch'>;

export type FuelGaugeNode = Node<BaseNodeData & { 
  fuelLevel?: number;
}, 'fuel-gauge'>;

// Define a more generic Node type that can be used in the App
export type GenericNode = Node<Record<string, unknown>, string>;

// Define the AppNode type as a union of all node types
export type AppNode = GenericNode;
