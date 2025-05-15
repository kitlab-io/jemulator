import type { Node, BuiltInNode } from '@xyflow/react';

export type BatteryNode = Node<{ label: string }, 'battery'>;
export type LEDNode = Node<{ label: string }, 'led'>;
export type RockerSwitchNode = Node<{ label: string }, 'rocker-switch'>;
export type WireNode = Node<{ label: string }, 'wire'>;
export type PositionLoggerNode = Node<{ label: string }, 'position-logger'>;
export type NoSocketNode = Node<{ label: string }, 'no-socket'>;
export type AppNode = BuiltInNode | PositionLoggerNode | NoSocketNode;
