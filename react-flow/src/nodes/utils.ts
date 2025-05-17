/**
 * Utility functions for React Flow nodes
 */

import { Node } from '@xyflow/react';

/**
 * Helper function to safely type node data
 * This function helps TypeScript recognize the correct type of node data
 * without requiring type assertions in every component
 */
export function getTypedNodeData<T extends Node>(node: T): T extends Node<infer D, any> ? D : never {
  return node.data as any;
}

/**
 * Helper function to create a typed node data object from a component's data prop
 * Use this in your node components to ensure TypeScript correctly recognizes data properties
 */
export function useNodeData<D>(data: unknown): D {
  return data as D;
}
