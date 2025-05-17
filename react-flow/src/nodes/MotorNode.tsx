import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { MotorNode as MotorNodeType, NodeComponentProps, NodeData } from './types';
import { useNodeData } from './utils';

function MotorNodeComponent({ data }: NodeComponentProps<MotorNodeType>) {
  // Use the utility function to properly type the data object
  const typedData = useNodeData<NodeData<MotorNodeType>>(data);
  const isRunning = typedData.isRunning || false;
  const speed = typedData.speed || 0;
  
  return (
    <div className="node motor-node">
      <Handle type="target" position={Position.Left} id="power" />
      <Handle type="target" position={Position.Top} id="control" />
      <div className="node-content">
        <div className={`motor-icon ${isRunning ? 'motor-running' : 'motor-idle'}`}>
          {isRunning ? '🔄' : '⚙️'}
        </div>
        <div className="node-label">{typedData.label}</div>
        {typedData.type === 'drive' && (
          <div className="motor-speed">Speed: {speed}%</div>
        )}
        {typedData.type === 'steering' && (
          <div className="motor-position">Position: {typedData.position || 'center'}</div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} id="ground" />
    </div>
  );
}

export const MotorNode = memo(MotorNodeComponent);
