import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { RockerSwitchNode } from './types';

function RockerSwitchNodeComponent({ data }: NodeProps<RockerSwitchNode['data']>) {
  const [isOn, setIsOn] = useState(false);
  
  return (
    <div className="node rocker-switch-node">
      <Handle type="target" position={Position.Left} />
      <div className="node-content">
        <div 
          className={`switch-icon ${isOn ? 'switch-on' : 'switch-off'}`}
          onClick={() => setIsOn(!isOn)}
        >
          {isOn ? '⚡' : '⭘'}
        </div>
        <div className="node-label">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export const RockerSwitchNode = memo(RockerSwitchNodeComponent);
