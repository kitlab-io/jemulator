import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { BatteryNode } from './types';

function BatteryNodeComponent({ data }: NodeProps<BatteryNode['data']>) {
  return (
    <div className="node battery-node">
      <Handle type="source" position={Position.Right} />
      <div className="node-content">
        <div className="battery-icon">🔋</div>
        <div className="node-label">{data.label}</div>
      </div>
      <Handle type="target" position={Position.Left} />
    </div>
  );
}

export const BatteryNode = memo(BatteryNodeComponent);
