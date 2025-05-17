import { Edge, Node } from '@xyflow/react';

export interface VehicleCircuitValidationResult {
  isValid: boolean;
  errors: string[];
  completedCircuits: string[][];
  powerStatus: boolean;
  driveMotorStatus: {
    isRunning: boolean;
    speed: number;
    direction: 'forward' | 'reverse';
  };
  steeringMotorStatus: {
    isRunning: boolean;
    position: 'left' | 'center' | 'right';
  };
  brakeStatus: boolean;
  fuelLevel: number;
}

/**
 * Validates if a toy vehicle circuit is properly connected
 * A valid circuit must:
 * 1. Have a battery
 * 2. Have a microcontroller
 * 3. Have all required components properly connected
 * 4. Have a complete power path from battery through the power switch to the microcontroller
 */
export function validateVehicleCircuit(nodes: Node[], edges: Edge[]): VehicleCircuitValidationResult {
  const result: VehicleCircuitValidationResult = {
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
  };

  // Check if we have at least one battery
  const batteries = nodes.filter(node => node.type === 'battery');
  if (batteries.length === 0) {
    result.errors.push('Circuit requires at least one battery');
    return result;
  }

  // Check if we have a microcontroller
  const microcontrollers = nodes.filter(node => node.type === 'microcontroller');
  if (microcontrollers.length === 0) {
    result.errors.push('Circuit requires a microcontroller');
    return result;
  }
  
  // Check if we have all required components
  const driveMotors = nodes.filter(node => node.type === 'motor' && (node.data as any).type === 'drive');
  if (driveMotors.length === 0) {
    result.errors.push('Circuit requires a drive motor');
  }
  
  const steeringMotors = nodes.filter(node => node.type === 'motor' && (node.data as any).type === 'steering');
  if (steeringMotors.length === 0) {
    result.errors.push('Circuit requires a steering motor');
  }
  
  const throttlePots = nodes.filter(node => node.type === 'potentiometer' && (node.data as any).type === 'throttle');
  if (throttlePots.length === 0) {
    result.errors.push('Circuit requires a throttle potentiometer');
  }
  
  const steeringPots = nodes.filter(node => node.type === 'potentiometer' && (node.data as any).type === 'steering');
  if (steeringPots.length === 0) {
    result.errors.push('Circuit requires a steering potentiometer');
  }
  
  const brakeSwitches = nodes.filter(node => node.type === 'momentary-switch');
  if (brakeSwitches.length === 0) {
    result.errors.push('Circuit requires a brake switch');
  }
  
  const directionSwitches = nodes.filter(node => 
    node.type === 'rocker-switch' && (node.data as any).type === 'direction'
  );
  if (directionSwitches.length === 0) {
    result.errors.push('Circuit requires a direction switch');
  }
  
  const powerSwitches = nodes.filter(node => 
    node.type === 'rocker-switch' && (node.data as any).type === 'power'
  );
  if (powerSwitches.length === 0) {
    result.errors.push('Circuit requires a power switch');
  }
  
  const fuelGauges = nodes.filter(node => node.type === 'fuel-gauge');
  if (fuelGauges.length === 0) {
    result.errors.push('Circuit requires a fuel gauge');
  }

  // For each battery, try to find a path to the microcontroller through the power switch
  for (const battery of batteries) {
    const microcontroller = microcontrollers[0];
    const visited = new Set<string>();
    const path: string[] = [];
    
    // Start DFS from the battery to find a path to the microcontroller
    const hasPathToMicro = findPath(
      battery.id, 
      microcontroller.id, 
      edges, 
      visited, 
      path,
      (edge) => edge.targetHandle === 'power' || !edge.targetHandle
    );
    
    if (hasPathToMicro && path.length > 0) {
      result.completedCircuits.push(path);
      
      // Check if the power switch is in the path and if it's on
      const powerSwitchInPath = path.some(nodeId => {
        const node = nodes.find(n => n.id === nodeId && n.type === 'rocker-switch' && (n.data as any).type === 'power');
        return node !== undefined;
      });
      
      if (powerSwitchInPath) {
        // Check if the power switch is on
        const powerSwitch = nodes.find(
          node => node.type === 'rocker-switch' && 
          (node.data as any).type === 'power' && 
          path.includes(node.id)
        );
        
        if (powerSwitch && (powerSwitch.data as any).isOn) {
          result.powerStatus = true;
        } else {
          result.powerStatus = false;
        }
      }
    }
    
    // Find ground connections (return paths)
    for (const component of [...driveMotors, ...steeringMotors, ...throttlePots, ...steeringPots, ...brakeSwitches, ...microcontrollers, ...fuelGauges]) {
      const groundPath: string[] = [];
      const groundVisited = new Set<string>();
      
      const hasGroundPath = findPath(
        component.id,
        battery.id,
        edges,
        groundVisited,
        groundPath,
        (edge) => edge.sourceHandle === 'ground' || !edge.sourceHandle
      );
      
      if (hasGroundPath && groundPath.length > 0) {
        result.completedCircuits.push(groundPath);
      }
    }
  }

  // Circuit is valid if we have at least one complete circuit and all required components
  result.isValid = result.completedCircuits.length > 0 && result.errors.length === 0;

  // If the circuit is valid and powered, update component statuses
  if (result.isValid && result.powerStatus) {
    // Update drive motor status
    if (driveMotors.length > 0) {
      const driveMotor = driveMotors[0];
      const throttlePot = throttlePots.length > 0 ? throttlePots[0] : null;
      const brakeSwitch = brakeSwitches.length > 0 ? brakeSwitches[0] : null;
      const directionSwitch = directionSwitches.length > 0 ? directionSwitches[0] : null;
      
      // Check if brake is pressed
      const brakePressed = brakeSwitch ? (brakeSwitch.data as any).isPressed : false;
      result.brakeStatus = brakePressed;
      
      // Get throttle value
      const throttleValue = throttlePot ? (throttlePot.data as any).value || 0 : 0;
      
      // Get direction
      const directionForward = directionSwitch ? (directionSwitch.data as any).isOn : true;
      
      // Motor runs if throttle > 0 and brake is not pressed
      const isRunning = throttleValue > 0 && !brakePressed;
      
      result.driveMotorStatus = {
        isRunning,
        speed: brakePressed ? 0 : throttleValue,
        direction: directionForward ? 'forward' : 'reverse',
      };
    }
    
    // Update steering motor status
    if (steeringMotors.length > 0) {
      const steeringMotor = steeringMotors[0];
      const steeringPot = steeringPots.length > 0 ? steeringPots[0] : null;
      
      // Get steering value
      const steeringValue = steeringPot ? (steeringPot.data as any).value || 50 : 50;
      
      // Determine steering position
      let position: 'left' | 'center' | 'right' = 'center';
      if (steeringValue < 40) {
        position = 'left';
      } else if (steeringValue > 60) {
        position = 'right';
      }
      
      result.steeringMotorStatus = {
        isRunning: true, // Steering is always active when power is on
        position,
      };
    }
    
    // Update fuel level
    if (fuelGauges.length > 0) {
      const fuelGauge = fuelGauges[0];
      result.fuelLevel = (fuelGauge.data as any).fuelLevel || 100;
    }
  }

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
  path: string[],
  edgeFilter: (edge: Edge) => boolean = () => true
): boolean {
  // If we've already visited this node, skip it
  if (visited.has(current)) {
    return false;
  }

  // Mark current node as visited
  visited.add(current);
  path.push(current);

  // If we've reached the target, we're done
  if (current === target && path.length > 1) {
    return true;
  }

  // Get all outgoing edges from the current node that match the filter
  const outgoingEdges = edges.filter(edge => 
    edge.source === current && edgeFilter(edge)
  );

  // For each outgoing edge, try to find a path to the target
  for (const edge of outgoingEdges) {
    const nextNode = edge.target;
    
    // Continue the search
    if (findPath(nextNode, target, edges, visited, path, edgeFilter)) {
      return true;
    }
  }

  // If we get here, we didn't find a path from this node
  path.pop();
  return false;
}

/**
 * Updates the nodes based on the validation result
 */
export function updateVehicleNodes(nodes: Node[], validationResult: VehicleCircuitValidationResult): Node[] {
  return nodes.map(node => {
    // Update microcontroller
    if (node.type === 'microcontroller') {
      return {
        ...node,
        data: {
          ...node.data,
          isActive: validationResult.powerStatus,
          throttleValue: validationResult.driveMotorStatus.speed,
          steeringValue: validationResult.steeringMotorStatus.position === 'center' ? 50 : 
                         validationResult.steeringMotorStatus.position === 'left' ? 25 : 75,
          brakeActive: validationResult.brakeStatus,
          fuelLevel: validationResult.fuelLevel,
          directionForward: validationResult.driveMotorStatus.direction === 'forward',
        },
      };
    }
    
    // Update drive motor
    if (node.type === 'motor' && (node.data as any).type === 'drive') {
      return {
        ...node,
        data: {
          ...node.data,
          isRunning: validationResult.driveMotorStatus.isRunning,
          speed: validationResult.driveMotorStatus.speed,
        },
        className: validationResult.driveMotorStatus.isRunning ? 'motor-running' : '',
      };
    }
    
    // Update steering motor
    if (node.type === 'motor' && (node.data as any).type === 'steering') {
      return {
        ...node,
        data: {
          ...node.data,
          isRunning: validationResult.steeringMotorStatus.isRunning,
          position: validationResult.steeringMotorStatus.position,
        },
        className: validationResult.steeringMotorStatus.isRunning ? 'motor-running' : '',
      };
    }
    
    return node;
  });
}
