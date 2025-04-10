import { Fiber } from 'react-reconciler';
import {
  getRDTHook,
  getDisplayNameForFiber,
  findComponentsInFiber,
  getCurrentStates,
  getPrevStates,
} from '../../shared/util';
import { getDOMNodesByComponentName, getFibersByComponentName } from './util';
import { MemoizedState } from '../../types/react';
import { FiberNotFoundError } from '../../shared/errors';
import { HookNode } from '../../types/internal';

// Function to traverse the Fiber tree and find instances by component name
const findFiberInstancesByName = (
  startNode: Fiber | null,
  componentName: string,
): Fiber[] => {
  const instances: Fiber[] = [];
  if (!startNode) return instances;

  const queue: Fiber[] = [startNode];

  while (queue.length > 0) {
    const node = queue.shift();
    if (!node) continue;

    // Check if the node type matches the component name
    const nodeType = node.type;
    if (nodeType) {
      // Function components might have .displayName or .name
      // Class components usually have .name
      // Built-in elements like 'div' are strings
      const name = getDisplayNameForFiber(node);
      if (name === componentName) {
        instances.push(node);
      }
    }

    // Queue children for traversal
    if (node.child) {
      queue.push(node.child);
    }
    // Queue siblings for traversal
    if (node.sibling) {
      queue.push(node.sibling); // Queue the immediate sibling
    }
  }

  return instances;
};

export const getComponentStates = (
  componentName: string,
): Map<
  string,
  {
    currentStates: HookNode[] | null;
    prevStates: HookNode[] | null;
  }
> => {
  console.log(
    `[vite-react-mcp] Attempting to get state for component: ${componentName}`,
  );

  const fibers = getFibersByComponentName(componentName);

  if (fibers.length === 0)
    throw new FiberNotFoundError(
      `No fibers found for component: ${componentName}`,
    );

  const stateMap = new Map<
    string,
    {
      currentStates: HookNode[] | null;
      prevStates: HookNode[] | null;
    }
  >();

  let id = 1;
  let suffix = ` #${id}`;
  if (fibers.length <= 1) {
    suffix = '';
  }
  for (const fiber of fibers) {
    const currentStates = getCurrentStates(fiber);
    const prevStates = getPrevStates(fiber);

    stateMap.set(`${componentName}${suffix}`, {
      currentStates: filterReportableStates(currentStates),
      prevStates: filterReportableStates(prevStates),
    });

    id++;
    suffix = ` #${id}`;
  }

  return stateMap;
};

export const filterReportableStates = (states: HookNode[]): HookNode[] => {
  return states.filter((state) => {
    try {
      return (
        JSON.stringify(state.memoizedState) === JSON.stringify(state.baseState)
      );
    } catch (error) {
      return false;
    }
  });
};
