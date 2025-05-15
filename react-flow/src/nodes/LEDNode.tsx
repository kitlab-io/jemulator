import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { LEDNode } from './types';
// import './styles.css';

function LEDNodeComponent({ data }: NodeProps<LEDNode['data'] & { isOn?: boolean }>) {
  const isOn = data.isOn || false;

  return (
    <div className={`node led-node ${isOn ? 'led-on' : 'led-off'}`}>
      <Handle type="target" position={Position.Left} />
      <div className="node-content">
        <div className="led-icon">{isOn ? '💡' : '⚪'}</div>
        <div className="node-label">{data.label}</div>
        <div className="led-status">{isOn ? 'ON' : 'OFF'}</div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export const LEDNode = memo(LEDNodeComponent);
