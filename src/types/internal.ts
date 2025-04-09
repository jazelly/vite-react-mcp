export interface ComponentTreeNode {
  name: string | null;
  children: ComponentTreeNode[];
}

export interface HookNode {
  memoizedState: unknown,
  baseState: unknown,
}