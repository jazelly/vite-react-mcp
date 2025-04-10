import type { FiberRoot } from '../types/react';
import type { WastedRenderFiberInfo } from '../types/internal';

// Closure contexts go here
export const wastedRenderFiberInfo: Map<string, WastedRenderFiberInfo> =
  new Map();
export const fiberRoots: Map<number, Set<FiberRoot>> = new Map();

export const store = {
  REACT_COMPONENT_NAME_SUFFIX: '$$mcp',
  currentCommitFrameId: 0,
};
