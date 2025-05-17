import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { MicrocontrollerNode as MicrocontrollerNodeType, NodeComponentProps, NodeData } from './types';
import { useNodeData } from './utils';

function MicrocontrollerNodeComponent({ data }: NodeComponentProps<MicrocontrollerNodeType>) {
  // Use the utility function to properly type the data object
  const typedData = useNodeData<NodeData<MicrocontrollerNodeType>>(data);
  const connectedComponents = typedData.connectedComponents || [];
  
  return (
    <div className="node microcontroller-node">
      {/* Power input */}
      <Handle type="target" position={Position.Left} id="power" style={{ top: '20%' }} />
      
      {/* Common ground */}
      <Handle type="source" position={Position.Bottom} id="ground" />
      
      {/* Input sockets for components */}
      <Handle type="target" position={Position.Top} id="driveMotor" style={{ left: '20%' }} />
      <Handle type="target" position={Position.Top} id="steeringMotor" style={{ left: '40%' }} />
      <Handle type="target" position={Position.Top} id="fuelGauge" style={{ left: '60%' }} />
      <Handle type="target" position={Position.Top} id="brakeSwitch" style={{ left: '80%' }} />
      
      {/* Control output sockets */}
      <Handle type="source" position={Position.Right} id="driveOutput" style={{ top: '20%' }} />
      <Handle type="source" position={Position.Right} id="steeringOutput" style={{ top: '40%' }} />
      <Handle type="source" position={Position.Right} id="displayOutput" style={{ top: '60%' }} />
      
      <div className="node-content">
        <div className="microcontroller-icon">💻️</div>
        <div className="node-label">{typedData.label}</div>
        <div className="microcontroller-status">
          Status: {typedData.isActive ? 'Active' : 'Inactive'}
        </div>
        <div className="connected-components">
          Connected: {connectedComponents.length}
        </div>
      </div>
    </div>
  );
}

export const MicrocontrollerNode = memo(MicrocontrollerNodeComponent);
