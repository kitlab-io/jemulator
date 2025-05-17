import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { BatteryNode as BatteryNodeType, NodeComponentProps, NodeData } from './types';
import { useNodeData } from './utils';

function BatteryNodeComponent({ data }: NodeComponentProps<BatteryNodeType>) {
  // Use the utility function to properly type the data object
  const typedData = useNodeData<NodeData<BatteryNodeType>>(data);
  return (
    <div className="node battery-node">
      <Handle type="source" position={Position.Right} id="power" />
      <div className="node-content">
        <div className="battery-icon">🔋</div>
        <div className="node-label">{typedData.label}</div>
      </div>
      <Handle type="target" position={Position.Left} id="ground" />
    </div>
  );
}

export const BatteryNode = memo(BatteryNodeComponent);
