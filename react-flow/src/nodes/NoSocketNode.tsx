
import { Handle, Position, type NodeProps } from '@xyflow/react';

import { type NoSocketNode } from './types';

export function NoSocketNode({
  positionAbsoluteX,
  positionAbsoluteY,
  data,
}: NodeProps<NoSocketNode>) {
  const x = `${Math.round(positionAbsoluteX)}px`;
  const y = `${Math.round(positionAbsoluteY)}px`;

  return (
    // We add this class to use the same styles as React Flow's default nodes.
    <div className="react-flow__node-default">
      {data.label && <div>{data.label}</div>}

      <div>
        {x} {y}
      </div>
    </div>
  );
}
