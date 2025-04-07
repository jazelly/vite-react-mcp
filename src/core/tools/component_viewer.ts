import { Fiber, FiberRoot } from 'react-reconciler';
import { FiberRootsNotFoundError } from '../../shared/errors';
import { getFiberRoots, getDisplayNameForFiber } from '../../shared/util';

export interface ComponentTreeNode {
  name: string | null;
  children: ComponentTreeNode[];
}

/**
 * Given the component tree of current page
 * @param componentName
 */
export const getComponentTree = () => {
  // Get all fiber roots
  const roots = getFiberRoots();
  if (!roots || roots.length === 0) {
    throw new FiberRootsNotFoundError('No React fiber roots found');
  }

  const result: ComponentTreeNode = {
    name: 'base',
    children: [],
  };

  // dfs way to build the component tree
  const buildComponentTree = (
    fiber: FiberRoot | Fiber,
    currentResult: ComponentTreeNode,
  ) => {
    if (!fiber && !fiber?.current) return null;

    let fiberBase = fiber.current ?? fiber;
    if (!fiberBase) return;

    const componentName = getDisplayNameForFiber(fiberBase);

    const thisNodesChildrenResults = {
      name: componentName,
      children: [],
    };
    currentResult.children.push(thisNodesChildrenResults);
    while (fiberBase) {
      buildComponentTree(fiberBase.child, thisNodesChildrenResults);
      fiberBase = fiberBase.sibling;
    }
  };

  // Build tree for each root
  roots.map((root) => buildComponentTree(root, result));

  return result;
};
