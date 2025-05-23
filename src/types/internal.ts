import type { Fiber } from 'bippy';

export interface ComponentTreeNode {
  name: string | null;
  children: ComponentTreeNode[];
}

export interface HookNode {
  memoizedState: unknown;
  baseState: unknown;
}

export type PropNode = any;

// These info should be intuitive enough to understand the wasted render
// MCP can query the wastes during a certain period
// It should reflect
// 1. name of wasted component
// 2. reason of wasted render
// 3. datetime of the waste
// TODO: frameify states change, props change, hook change.
export interface WastedRenderFiberInfo {
  name: string;
  collectedAt: number;
  commitId: number;
  fiber: Fiber;
  stateNode: HTMLElement | null;
  reasons: Record<string, any>;
}

export interface BaseChange {
  name: string | number;
  value: unknown;
  prevValue: unknown;
}

export interface PropChange extends BaseChange {
  name: string;
}

export interface StateChange extends BaseChange {
  name: string | number;
}

export interface ContextChange extends BaseChange {
  name: string;
  contextType: unknown;
}
