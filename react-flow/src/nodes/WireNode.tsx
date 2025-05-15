import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { WireNode } from './types';

function WireNodeComponent({ data }: NodeProps<WireNode['data']>) {
  return (
    <div className="node wire-node">
      <Handle type="target" position={Position.Left} />
      <div className="node-content">
        <div className="wire-icon">〰️</div>
        <div className="node-label">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export const WireNode = memo(WireNodeComponent);
