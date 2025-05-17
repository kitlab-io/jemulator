import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { MomentarySwitchNode as MomentarySwitchNodeType, NodeComponentProps, NodeData } from './types';
import { useNodeData } from './utils';

function MomentarySwitchNodeComponent({ data }: NodeComponentProps<MomentarySwitchNodeType>) {
  // Use the utility function to properly type the data object
  const typedData = useNodeData<NodeData<MomentarySwitchNodeType>>(data);
  const isPressed = typedData.isPressed || false;
  
  return (
    <div className="node momentary-switch-node">
      <Handle type="target" position={Position.Left} id="power" />
      <div className="node-content">
        <div 
          className={`momentary-switch-icon ${isPressed ? 'switch-pressed' : 'switch-released'}`}
        >
          {isPressed ? '⏺️' : '⚪'}
        </div>
        <div className="node-label">{typedData.label}</div>
        <div className="switch-status">
          {isPressed ? 'PRESSED' : 'RELEASED'}
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="signal" />
      <Handle type="source" position={Position.Bottom} id="ground" />
    </div>
  );
}

export const MomentarySwitchNode = memo(MomentarySwitchNodeComponent);
