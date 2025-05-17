import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { LEDNode as LEDNodeType, NodeComponentProps, NodeData } from './types';
import { useNodeData } from './utils';
// import './styles.css';

function LEDNodeComponent({ data }: NodeComponentProps<LEDNodeType>) {
  // Use the utility function to properly type the data object
  const typedData = useNodeData<NodeData<LEDNodeType>>(data);
  const isOn = typedData.isOn || false;

  return (
    <div className={`node led-node ${isOn ? 'led-on' : 'led-off'}`}>
      <Handle type="target" position={Position.Left} />
      <div className="node-content">
        <div className="led-icon">{isOn ? '💡' : '⚪'}</div>
        <div className="node-label">{typedData.label}</div>
        <div className="led-status">{isOn ? 'ON' : 'OFF'}</div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export const LEDNode = memo(LEDNodeComponent);
