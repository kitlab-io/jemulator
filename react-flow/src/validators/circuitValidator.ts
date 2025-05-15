import { Edge, Node } from '@xyflow/react';

export interface CircuitValidationResult {
  isValid: boolean;
  errors: string[];
  completedCircuits: string[][];
}

/**
 * Validates if a circuit is properly connected
 * A valid circuit must:
 * 1. Have at least one power source (battery)
 * 2. Have a complete path from power source back to power source
 * 3. Have all required components properly connected
 */
export function validateCircuit(nodes: Node[], edges: Edge[]): CircuitValidationResult {
  const result: CircuitValidationResult = {
    isValid: false,
    errors: [],
    completedCircuits: [],
  };

  // Check if we have at least one battery
  const batteries = nodes.filter(node => node.type === 'battery');
  if (batteries.length === 0) {
    result.errors.push('Circuit requires at least one battery');
    return result;
  }

  // For each battery, try to find a path back to itself
  for (const battery of batteries) {
    const visited = new Set<string>();
    const path: string[] = [];
    
    // Start DFS from the battery
    const hasCompletePath = findPath(battery.id, battery.id, edges, visited, path);
    
    if (hasCompletePath && path.length > 0) {
      // Add battery to complete the circuit representation
      path.push(battery.id);
      result.completedCircuits.push(path);
    }
  }

  // Check if we have at least one LED in any completed circuit
  const hasLED = result.completedCircuits.some(circuit => 
    circuit.some(nodeId => 
      nodes.find(node => node.id === nodeId && node.type === 'led')
    )
  );

  if (result.completedCircuits.length === 0) {
    result.errors.push('No complete circuit found');
  } else if (!hasLED) {
    result.errors.push('Circuit does not contain an LED');
  }

  // Check if we have at least one switch in any completed circuit
  const hasSwitch = result.completedCircuits.some(circuit => 
    circuit.some(nodeId => 
      nodes.find(node => node.id === nodeId && node.type === 'rocker-switch')
    )
  );

  if (!hasSwitch && result.completedCircuits.length > 0) {
    result.errors.push('Circuit does not contain a switch');
  }

  // Circuit is valid if we have at least one complete circuit with an LED and a switch
  result.isValid = result.completedCircuits.length > 0 && hasLED && hasSwitch && result.errors.length === 0;

  return result;
}

/**
 * Recursive DFS to find a path from start to target
 */
function findPath(
  current: string, 
  target: string, 
  edges: Edge[], 
  visited: Set<string>,
  path: string[]
): boolean {
  // If we've already visited this node, skip it
  if (visited.has(current)) {
    return false;
  }

  // Mark current node as visited
  visited.add(current);
  path.push(current);

  // Get all outgoing edges from the current node
  const outgoingEdges = edges.filter(edge => edge.source === current);

  // For each outgoing edge, try to find a path to the target
  for (const edge of outgoingEdges) {
    const nextNode = edge.target;
    
    // If we've reached the target, we're done
    if (nextNode === target && path.length > 1) {
      return true;
    }
    
    // Otherwise, continue the search
    if (findPath(nextNode, target, edges, visited, path)) {
      return true;
    }
  }

  // If we get here, we didn't find a path from this node
  path.pop();
  return false;
}

/**
 * Checks if the LED in the circuit would be on based on switch states
 */
export function isLEDOn(nodes: Node[], edges: Edge[], completedCircuit: string[]): boolean {
  // Find all switches in the circuit
  const switchesInCircuit = completedCircuit
    .map(nodeId => nodes.find(node => node.id === nodeId && node.type === 'rocker-switch'))
    .filter(Boolean) as Node[];
  
  // If there are no switches, the LED is always on
  if (switchesInCircuit.length === 0) {
    return true;
  }
  
  // Check if all switches are in the "on" position
  // This assumes the switch node has an "isOn" property in its data
  return switchesInCircuit.every(switchNode => 
    (switchNode.data as any)?.isOn === true
  );
}
