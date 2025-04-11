import { Fiber, FiberRoot } from 'react-reconciler';
import { FiberRootsNotFoundError } from '../../shared/errors';
import { getAllFiberRoots, getDisplayNameForFiber } from '../../shared/util';
import { ComponentTreeNode } from '../../types/internal';
import { store } from '../../shared/store';

/**
 * Recursively build a component tree with name from a fiber tree
 * @param fiber The fiber tree to convert
 * @param prevResult The previous result of the component tree
 * @returns The component tree
 */
const buildComponentTree = (fiber: Fiber, prevResult: ComponentTreeNode) => {
  let fiberBase = fiber;
  while (fiberBase) {
    const componentName = getDisplayNameForFiber(fiberBase);
    const nodeResult = {
      name: componentName,
      children: [],
    };
    prevResult.children.push(nodeResult);
    buildComponentTree(fiberBase.child, nodeResult);
    fiberBase = fiberBase.sibling;
  }
};

/**
 * Recursively trim the component tree to only include the components that match the matchId
 * @param oldTreeNode The old tree node to trim
 * @param trimTreeNode The tree node to trim to
 * @param options The options for the trim
 */
const trimComponentTree = (
  oldTreeNode: ComponentTreeNode,
  trimTreeNode: ComponentTreeNode,
  { selfOnly }: { selfOnly: boolean; debugMode?: boolean },
) => {
  let nextAttachNode = trimTreeNode;
  if (
    !selfOnly ||
    oldTreeNode.name === 'createRoot()' ||
    window.__REACT_COMPONENTS__.includes(oldTreeNode.name)
  ) {
    nextAttachNode = {
      name: oldTreeNode.name,
      children: [],
    };
    trimTreeNode.children.push(nextAttachNode);
  }

  for (const child of oldTreeNode.children) {
    trimComponentTree(child, nextAttachNode, { selfOnly });
  }
};

/**
 * Given the component tree of current page
 * @param matchId An identifier to filter the component tree. Only components' name containing this id will be included
 */
export const getComponentTree = (options?: {
  selfOnly: boolean;
  debugMode?: boolean;
}): string => {
  if (!options) {
    options = {
      selfOnly: false,
      debugMode: false,
    };
  }

  // Get all fiber roots
  const roots = getAllFiberRoots();
  if (!roots || roots.length === 0) {
    throw new FiberRootsNotFoundError('No React fiber roots found');
  }

  if (options.debugMode) {
    console.debug('getComponentTree - roots', roots);
  }

  const result: ComponentTreeNode = {
    name: '__BASE__',
    children: [],
  };
  roots.forEach((root) => buildComponentTree(root.current, result));

  const trimmedResult = {
    name: '__BASE__',
    children: [],
  };

  if (options.debugMode) {
    console.debug('getComponentTree - ComponentTreeNode result', result);
  }

  result.children.forEach((child) =>
    trimComponentTree(child, trimmedResult, options),
  );

  // there will always a be a root node under __BASE__
  const finalResult = trimmedResult.children[0];
  if (finalResult.name === 'createRoot()') {
    finalResult.name = 'root';
  }

  return finalResult;
};
