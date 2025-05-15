import type { Edge, EdgeTypes } from '@xyflow/react';

export const initialEdges: Edge[] = [
  // Connect battery to wire1
  {
    id: 'battery1-wire1',
    source: 'battery1',
    target: 'wire1',
    animated: true,
    style: { stroke: '#ff9900' }, // Orange color for power flow
  },
  // Connect wire1 to switch
  {
    id: 'wire1-switch1',
    source: 'wire1',
    target: 'switch1',
    animated: true,
    style: { stroke: '#ff9900' },
  },
  // Connect switch to wire2
  {
    id: 'switch1-wire2',
    source: 'switch1',
    target: 'wire2',
    animated: true,
    style: { stroke: '#ff9900' },
  },
  // Connect wire2 to LED
  {
    id: 'wire2-led1',
    source: 'wire2',
    target: 'led1',
    animated: true,
    style: { stroke: '#ff9900' },
  },
  // Connect LED back to battery to complete the circuit
  {
    id: 'led1-battery1',
    source: 'led1',
    target: 'battery1',
    animated: true,
    style: { stroke: '#3366ff' }, // Blue color for return path
  },
];

export const edgeTypes = {
  // Add your custom edge types here!
} satisfies EdgeTypes;
