import type { NodeTypes, Edge } from '@xyflow/react';

import { PositionLoggerNode } from './PositionLoggerNode';
import { NoSocketNode } from './NoSocketNode';
import { BatteryNode } from './BatteryNode';
import { LEDNode } from './LEDNode';
import { RockerSwitchNode } from './RockerSwitchNode';
import { WireNode } from './WireNode';
import { AppNode } from './types';

export const initialNodes: AppNode[] = [
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

export const nodeTypes = {
  'position-logger': PositionLoggerNode,
  'no-socket': NoSocketNode,
  'battery': BatteryNode,
  'led': LEDNode,
  'rocker-switch': RockerSwitchNode,
  'wire': WireNode,
} satisfies NodeTypes;

// Define the connections between nodes
export const initialEdges: Edge[] = [
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
