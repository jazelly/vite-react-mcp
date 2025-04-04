import { target } from './const';
import type { ReactDevtools } from '../types/react';
import type { FiberRoot } from 'react-reconciler';
import type { Fiber } from 'react-reconciler';

export const getRDTHook: () => ReactDevtools = () => {
  if (!target.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    throw new Error('React DevTools is not installed');
  }
  return target.__REACT_DEVTOOLS_GLOBAL_HOOK__;
};

/**
 * Get React Fiber nodes optimistically
 * @returns { Fiber[] }
 */
export const getFiberNodes = () => {
  const hook = getRDTHook();
  let roots = [];
  if (hook.renderers.size > 0) {
    const rendererIds = Array.from(hook.renderers.keys());
    for (const rendererId of rendererIds) {
      const rootsSet = hook.getFiberRoots(rendererId);
      roots = roots.concat([...rootsSet]);
    }
  }
  return roots;
};

/**
 * Traverse down to find the nearest fiber with stateNode UNDER the given fiber node
 * We step one level down first and then do bfs
 * @param fiber
 * @returns { Fiber | null }
 */
export const getNearestFiberWithStateNode = (
  fiber: Fiber | FiberRoot,
  level?: number,
): Fiber | null => {
  // search down but in a bfs manner to find a fiber with stateNode
  const current = fiber.current ?? fiber;
  if (current.stateNode) {
    return current.stateNode;
  }
  // get down 1 level first
  let queue: Set<Fiber> = new Set();
  let nextQueue: Set<Fiber> = new Set();
  if (current.child) {
    queue.add(current.child);
  }

  let i = 0;
  while (queue.size > 0 && (level == null || i < +level)) {
    for (const f of queue) {
      let current = f;
      while (current) {
        if (current.stateNode) {
          return current;
        }
        if (current.child) {
          nextQueue.add(current.child);
        }
        current = current.sibling;
      }
    }
    queue.clear();
    [queue, nextQueue] = [nextQueue, queue];
    i++;
  }

  return null;
};

/**
 * Get the component name from the fiber node
 * @param fiber
 * @returns { string | undefined }
 */
export const getComponentName = (fiber: Fiber | FiberRoot) => {
  const fiberBase = fiber.current ?? fiber;
  return (
    fiberBase.type?._context?.displayName ||
    fiberBase.type?.displayName ||
    fiberBase.type?.name ||
    fiberBase.elementType?.displayName ||
    fiberBase.elementType?.name
  );
};

/**
 * Traverse fiber tree to find component by name
 * @param fiber
 * @param componentName
 * @param results
 * @returns { fiber: Fiber | FiberRoot; domNode: HTMLElement }[]
 */
export const findComponentsInFiber = (
  fiber: Fiber | FiberRoot,
  componentName: string,
  results: Fiber[] = [],
) => {
  if (!fiber) return results;

  const fiberBase = fiber.current ?? fiber;

  const name = getComponentName(fiber);
  if (name === componentName) {
    results.push(fiber);
  }

  if (fiberBase.child) {
    findComponentsInFiber(fiberBase.child, componentName, results);
  }
  if (fiberBase.sibling) {
    findComponentsInFiber(fiberBase.sibling, componentName, results);
  }

  return results;
};
