import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { RockerSwitchNode as RockerSwitchNodeType, NodeComponentProps, NodeData } from './types';
import { useNodeData } from './utils';

function RockerSwitchNodeComponent({ data }: NodeComponentProps<RockerSwitchNodeType>) {
  // Use the utility function to properly type the data object
  const typedData = useNodeData<NodeData<RockerSwitchNodeType>>(data);
  const isOn = typedData.isOn || false;
  const switchType = typedData.type || 'power';
  
  return (
    <div className="node rocker-switch-node">
      <Handle type="target" position={Position.Left} id="power" />
      <div className="node-content">
        <div className={`switch-icon ${isOn ? 'switch-on' : 'switch-off'}`}>
          {isOn ? '⚡' : '⭘'}
        </div>
        <div className="node-label">{typedData.label}</div>
        <div className="switch-type">
          {switchType === 'power' ? 'Power' : 'Direction'}
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="signal" />
    </div>
  );
}

export const RockerSwitchNode = memo(RockerSwitchNodeComponent);
