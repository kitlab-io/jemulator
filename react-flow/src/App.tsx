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

import { initialNodes, nodeTypes } from './nodes';
import { initialEdges, edgeTypes } from './edges';
import { validateCircuit, CircuitValidationResult, isLEDOn } from './validators';

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
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [validationResult, setValidationResult] = useState<CircuitValidationResult>({ 
    isValid: false, 
    errors: [], 
    completedCircuits: [] 
  });
  const [ledStatus, setLedStatus] = useState<boolean>(false);


  const onInit = useCallback((node: Node, edge: Edge) => {
    console.log("onInit");
    console.log(node, edge);
    setGuide();
  }, []);
  const onConnect: OnConnect = useCallback(
    (connection) => {
      setEdges((edges) => {
        const newEdges = addEdge(connection, edges);
        // Validate circuit after adding a new connection
        const result = validateCircuit(nodes, newEdges);
        setValidationResult(result);
        return newEdges;
      });
      console.log(connection, "edges set for connection");
    },
    [setEdges, nodes]
  );

  const { getIntersectingNodes } = useReactFlow();
 
  const onNodeDrag = useCallback((_: MouseEvent, node: Node) => {
    const intersections = getIntersectingNodes(node).map((n) => n.id);
 
    setNodes((ns) =>
      ns.map((n) => ({
        ...n,
        className: intersections.includes(n.id) ? 'highlight' : '',
      })),
    );
  }, [getIntersectingNodes]);
  
  // Toggle switch state when clicked
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
    }
  }, []);
  
  // Validate circuit whenever nodes or edges change
  useEffect(() => {
    const result = validateCircuit(nodes, edges);
    setValidationResult(result);
    
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
  }, [nodes, edges]);

  return (
    <div className="flow-container">
      <ReactFlow
        nodes={nodes}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeDrag={onNodeDrag}
        onNodeClick={onNodeClick}
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
        <div className={`status-indicator ${validationResult.isValid ? 'valid' : 'invalid'}`}>
          {validationResult.isValid ? 'Valid Circuit ✓' : 'Invalid Circuit ✗'}
        </div>
        
        {validationResult.errors.length > 0 && (
          <div className="error-list">
            <h4>Issues:</h4>
            <ul>
              {validationResult.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        
        {validationResult.isValid && (
          <div className="led-status">
            <h4>LED Status:</h4>
            <div className={`led-indicator ${ledStatus ? 'on' : 'off'}`}>
              {ledStatus ? 'ON' : 'OFF'}
            </div>
          </div>
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
