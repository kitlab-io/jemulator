import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { WireNode as WireNodeType, NodeComponentProps, BaseNodeData } from './types';
import { useNodeData } from './utils';

function WireNodeComponent({ data }: NodeComponentProps<WireNodeType>) {
  // Use the utility function to properly type the data object
  const typedData = useNodeData<BaseNodeData>(data);
  return (
    <div className="node wire-node">
      <Handle type="target" position={Position.Left} id="input" />
      <div className="node-content">
        <div className="wire-icon">〰️</div>
        <div className="node-label">{typedData.label}</div>
      </div>
      <Handle type="source" position={Position.Right} id="output" />
    </div>
  );
}

export const WireNode = memo(WireNodeComponent);
