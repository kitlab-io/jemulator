import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { FuelGaugeNode as FuelGaugeNodeType, NodeComponentProps, NodeData } from './types';
import { useNodeData } from './utils';

function FuelGaugeNodeComponent({ data }: NodeComponentProps<FuelGaugeNodeType>) {
  // Use the utility function to properly type the data object
  const typedData = useNodeData<NodeData<FuelGaugeNodeType>>(data);
  const fuelLevel = typedData.fuelLevel || 100;
  
  // Calculate color based on fuel level
  const getFuelColor = () => {
    if (fuelLevel > 70) return 'green';
    if (fuelLevel > 30) return 'orange';
    return 'red';
  };
  
  return (
    <div className="node fuel-gauge-node">
      <Handle type="target" position={Position.Left} id="power" />
      <div className="node-content">
        <div className="fuel-gauge-icon">⛽</div>
        <div className="node-label">{typedData.label}</div>
        <div className="fuel-level-container">
          <div 
            className="fuel-level-indicator" 
            style={{ 
              width: `${fuelLevel}%`, 
              backgroundColor: getFuelColor() 
            }}
          />
        </div>
        <div className="fuel-level-text">
          Fuel: {fuelLevel}%
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="signal" />
      <Handle type="source" position={Position.Bottom} id="ground" />
    </div>
  );
}

export const FuelGaugeNode = memo(FuelGaugeNodeComponent);
