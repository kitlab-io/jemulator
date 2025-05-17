import { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  ReactFlowProvider,
  useReactFlow,
  useNodesState,
  useEdgesState,
  type OnConnect,
  type Edge,
  type Node,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { initialNodes, nodeTypes, ledCircuitNodes, vehicleCircuitNodes, ledCircuitEdges, vehicleCircuitEdges, incompleteVehicleCircuitEdges } from './nodes';
import { initialEdges, edgeTypes } from './edges';
import { 
  validateCircuit, 
  CircuitValidationResult, 
  isLEDOn,
  validateVehicleCircuit,
  VehicleCircuitValidationResult,
  updateVehicleNodes
} from './validators';

import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const driverObj = driver({
  popoverClass: "driverjs-theme",
  stagePadding: 4,
});

const setGuide = () => {
  console.log("setGuide");
  driverObj.highlight({
    element: 'div[data-id="e"]',
    popover: {
      side: "bottom",
      title: "This is a title",
      description: "This is a description",
    }
  })
}

export const FlowEditor = () => {
  // State to track which circuit we're displaying
  const [circuitType, setCircuitType] = useState<'led' | 'vehicle'>('vehicle');
  
  // State to track if the puzzle solution is shown
  const [showSolution, setShowSolution] = useState<boolean>(false);
  
  // Initialize with the vehicle circuit by default
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // LED circuit validation state
  const [ledValidationResult, setLedValidationResult] = useState<CircuitValidationResult>({ 
    isValid: false, 
    errors: [], 
    completedCircuits: [] 
  });
  const [ledStatus, setLedStatus] = useState<boolean>(false);
  
  // Vehicle circuit validation state
  const [vehicleValidationResult, setVehicleValidationResult] = useState<VehicleCircuitValidationResult>({ 
    isValid: false, 
    errors: [], 
    completedCircuits: [],
    powerStatus: false,
    driveMotorStatus: {
      isRunning: false,
      speed: 0,
      direction: 'forward',
    },
    steeringMotorStatus: {
      isRunning: false,
      position: 'center',
    },
    brakeStatus: false,
    fuelLevel: 100,
  });


  const onInit = useCallback((reactFlowInstance: any) => {
    console.log("onInit", reactFlowInstance);
    setGuide();
  }, []);
  const onConnect: OnConnect = useCallback(
    (connection) => {
      setEdges((edges) => {
        const newEdges = addEdge(connection, edges);
        // Validate circuit after adding a new connection based on circuit type
        if (circuitType === 'led') {
          const result = validateCircuit(nodes, newEdges);
          setLedValidationResult(result);
        } else {
          const result = validateVehicleCircuit(nodes, newEdges);
          setVehicleValidationResult(result);
        }
        return newEdges;
      });
      console.log(connection, "edges set for connection");
    },
    [setEdges, nodes, circuitType]
  );

  const { getIntersectingNodes } = useReactFlow();
 
  const onNodeDrag = useCallback((_: React.MouseEvent, node: Node) => {
    const intersections = getIntersectingNodes(node).map((n) => n.id);
 
    setNodes((ns) =>
      ns.map((n) => ({
        ...n,
        className: intersections.includes(n.id) ? 'highlight' : '',
      })),
    );
  }, [getIntersectingNodes]);
  
  // Toggle switch state or update component values when clicked
  const onNodeClick = useCallback((_, node: Node) => {
    if (node.type === 'rocker-switch') {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === node.id) {
            // Toggle the isOn state
            return {
              ...n,
              data: {
                ...n.data,
                isOn: !((n.data as any).isOn || false),
              },
            };
          }
          return n;
        })
      );
    } else if (node.type === 'momentary-switch') {
      // For momentary switch, set to pressed when clicked
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === node.id) {
            return {
              ...n,
              data: {
                ...n.data,
                isPressed: true,
              },
            };
          }
          return n;
        })
      );
      
      // After a short delay, set it back to unpressed
      setTimeout(() => {
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === node.id) {
              return {
                ...n,
                data: {
                  ...n.data,
                  isPressed: false,
                },
              };
            }
            return n;
          })
        );
      }, 500);
    } else if (node.type === 'potentiometer') {
      // For potentiometer, we'll handle changes through the slider input
      // The actual change is handled in the PotentiometerNode component
      console.log(`Potentiometer ${node.id} clicked`);
    } else if (node.type === 'fuel-gauge') {
      // Simulate fuel consumption when clicked (for testing)
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === node.id) {
            const currentLevel = (n.data as any).fuelLevel || 100;
            const newLevel = Math.max(0, currentLevel - 10); // Decrease by 10%
            return {
              ...n,
              data: {
                ...n.data,
                fuelLevel: newLevel,
              },
            };
          }
          return n;
        })
      );
    }
  }, []);
  
  // Handle input changes for potentiometers
  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type === 'potentiometer') {
      // This is where we would handle potentiometer value changes
      // But since we're using a slider input in the component, this is just a placeholder
      console.log(`Potentiometer ${node.id} dragged`);
    }
  }, []);
  
  // Switch between LED and vehicle circuits
  const switchCircuit = useCallback((type: 'led' | 'vehicle') => {
    setCircuitType(type);
    if (type === 'led') {
      setNodes(ledCircuitNodes);
      setEdges(ledCircuitEdges);
      setShowSolution(false);
    } else {
      setNodes(vehicleCircuitNodes);
      // Use the appropriate edge set based on solution state
      setEdges(showSolution ? vehicleCircuitEdges : incompleteVehicleCircuitEdges);
    }
  }, [showSolution]);
  
  // Toggle between incomplete and complete vehicle circuit
  const toggleSolution = useCallback(() => {
    const newSolutionState = !showSolution;
    setShowSolution(newSolutionState);
    
    if (circuitType === 'vehicle') {
      // Update edges based on solution state
      setEdges(newSolutionState ? vehicleCircuitEdges : incompleteVehicleCircuitEdges);
    }
  }, [showSolution, circuitType]);
  
  // Validate circuit whenever nodes or edges change
  useEffect(() => {
    if (circuitType === 'led') {
      // LED circuit validation
      const result = validateCircuit(nodes, edges);
      setLedValidationResult(result);
      
      // Check if LED should be on
      if (result.isValid && result.completedCircuits.length > 0) {
        const ledOn = isLEDOn(nodes, edges, result.completedCircuits[0]);
        setLedStatus(ledOn);
        
        // Update LED nodes to reflect their status
        setNodes((nds) =>
          nds.map((n) => {
            if (n.type === 'led') {
              return {
                ...n,
                data: {
                  ...n.data,
                  isOn: ledOn,
                },
                className: ledOn ? 'led-on' : 'led-off',
              };
            }
            return n;
          })
        );
      } else {
        setLedStatus(false);
      }
    } else {
      // Vehicle circuit validation
      const result = validateVehicleCircuit(nodes, edges);
      setVehicleValidationResult(result);
      
      // Update nodes based on validation result
      const updatedNodes = updateVehicleNodes(nodes, result);
      setNodes(updatedNodes);
    }
  }, [nodes, edges, circuitType]);

  return (
    <div className="flow-container">
      <div className="circuit-selector">
        <button 
          onClick={() => switchCircuit('led')} 
          className={circuitType === 'led' ? 'active' : ''}
        >
          LED Circuit
        </button>
        <button 
          onClick={() => switchCircuit('vehicle')} 
          className={circuitType === 'vehicle' ? 'active' : ''}
        >
          Toy Vehicle Circuit
        </button>
        
        {circuitType === 'vehicle' && (
          <button 
            onClick={toggleSolution} 
            className={`solution-button ${showSolution ? 'solution-active' : ''}`}
          >
            {showSolution ? 'Hide Solution' : 'Show Solution'}
          </button>
        )}
      </div>
      
      <ReactFlow
        nodes={nodes}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeDrag={onNodeDrag}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        edges={edges}
        edgeTypes={edgeTypes}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        fitView
      >
        <Background />
        <MiniMap />
        <Controls />
      </ReactFlow>
      
      {/* Circuit validation status panel */}
      <div className="validation-panel">
        <h3>Circuit Status</h3>
        
        {circuitType === 'led' ? (
          // LED Circuit Status
          <>
            <div className={`status-indicator ${ledValidationResult.isValid ? 'valid' : 'invalid'}`}>
              {ledValidationResult.isValid ? 'Valid Circuit ✓' : 'Invalid Circuit ✗'}
            </div>
            
            {ledValidationResult.errors.length > 0 && (
              <div className="error-list">
                <h4>Issues:</h4>
                <ul>
                  {ledValidationResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {ledValidationResult.isValid && (
              <div className="led-status">
                <h4>LED Status:</h4>
                <div className={`led-indicator ${ledStatus ? 'on' : 'off'}`}>
                  {ledStatus ? 'ON' : 'OFF'}
                </div>
              </div>
            )}
          </>
        ) : (
          // Vehicle Circuit Status
          <>
            <div className={`status-indicator ${vehicleValidationResult.isValid ? 'valid' : 'invalid'}`}>
              {vehicleValidationResult.isValid ? 'Valid Circuit ✓' : 'Invalid Circuit ✗'}
            </div>
            
            {vehicleValidationResult.errors.length > 0 && (
              <div className="error-list">
                <h4>Issues:</h4>
                <ul>
                  {vehicleValidationResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {vehicleValidationResult.isValid && (
              <div className="vehicle-status">
                <h4>System Power:</h4>
                <div className={`power-indicator ${vehicleValidationResult.powerStatus ? 'on' : 'off'}`}>
                  {vehicleValidationResult.powerStatus ? 'ON' : 'OFF'}
                </div>
                
                <h4>Drive Motor:</h4>
                <div className="motor-status">
                  <div>Status: {vehicleValidationResult.driveMotorStatus.isRunning ? 'Running' : 'Stopped'}</div>
                  <div>Speed: {vehicleValidationResult.driveMotorStatus.speed}%</div>
                  <div>Direction: {vehicleValidationResult.driveMotorStatus.direction}</div>
                </div>
                
                <h4>Steering:</h4>
                <div className="steering-status">
                  <div>Position: {vehicleValidationResult.steeringMotorStatus.position}</div>
                </div>
                
                <h4>Brake:</h4>
                <div className={`brake-indicator ${vehicleValidationResult.brakeStatus ? 'active' : 'inactive'}`}>
                  {vehicleValidationResult.brakeStatus ? 'ENGAGED' : 'RELEASED'}
                </div>
                
                <h4>Fuel Level:</h4>
                <div className="fuel-level-container">
                  <div 
                    className="fuel-level-indicator" 
                    style={{ 
                      width: `${vehicleValidationResult.fuelLevel}%`,
                      backgroundColor: vehicleValidationResult.fuelLevel > 70 ? 'green' : 
                                      vehicleValidationResult.fuelLevel > 30 ? 'orange' : 'red'
                    }}
                  />
                </div>
                <div>{vehicleValidationResult.fuelLevel}%</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default function App() {
  // https://reactflow.dev/learn/troubleshooting#001
  return (
    <ReactFlowProvider>
    <FlowEditor />
    </ReactFlowProvider>
      );
}
