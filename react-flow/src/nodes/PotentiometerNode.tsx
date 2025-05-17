import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { PotentiometerNode as PotentiometerNodeType, NodeComponentProps, NodeData } from './types';
import { useNodeData } from './utils';

function PotentiometerNodeComponent({ data, id }: NodeComponentProps<PotentiometerNodeType>) {
  // Use the utility function to properly type the data object
  const typedData = useNodeData<NodeData<PotentiometerNodeType>>(data);
  const value = typedData.value || 0;
  
  // Function to handle slider change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    // This will be handled by the parent component through the onNodeClick handler
    console.log(`Potentiometer ${id} value changed to ${newValue}`);
  };
  
  return (
    <div className="node potentiometer-node">
      <Handle type="target" position={Position.Left} id="power" />
      <div className="node-content">
        <div className="potentiometer-icon">🎚️</div>
        <div className="node-label">{typedData.label}</div>
        <div className="potentiometer-value">
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={value} 
            onChange={handleChange}
            className="potentiometer-slider"
          />
          <span>{value}%</span>
        </div>
        <div className="potentiometer-type">
          {data.type === 'throttle' ? 'Throttle' : 'Steering'}
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="signal" />
      <Handle type="source" position={Position.Bottom} id="ground" />
    </div>
  );
}

export const PotentiometerNode = memo(PotentiometerNodeComponent);
