import type { FiberRoot } from '../types/react';
import type { WastedRenderFiberInfo } from '../types/internal';

// Closure contexts go here
export const wastedRenderFiberInfo: Map<number, WastedRenderFiberInfo> =
  new Map();
export const fiberRoots: Map<number, Set<FiberRoot>> = new Map();

export const store = {
  SELF_REACT_COMPONENTS: new Set<string>(),
  currentCommitFrameId: 0,
};
