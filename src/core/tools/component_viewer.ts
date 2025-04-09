import { Fiber, FiberRoot } from 'react-reconciler';
import { FiberRootsNotFoundError } from '../../shared/errors';
import { getFiberRoots, getDisplayNameForFiber } from '../../shared/util';
import { ComponentTreeNode } from '../../types/internal';

/**
 * Recursively build a component tree with name from a fiber tree
 * @param fiber The fiber tree to convert
 * @param prevResult The previous result of the component tree
 * @returns The component tree
 */
const buildComponentTree = (
  fiber: FiberRoot | Fiber,
  prevResult: ComponentTreeNode,
) => {
  if (!fiber && !fiber?.current) return null;
  let fiberBase = fiber.current ?? fiber;
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
const trimComponentTree = (oldTreeNode: ComponentTreeNode, trimTreeNode: ComponentTreeNode, { matchId }: { matchId: string }) => {
  let nextAttachNode = trimTreeNode;
  if (oldTreeNode.name === 'createRoot()' || oldTreeNode.name?.includes(matchId)) {
    nextAttachNode = {
      name: oldTreeNode.name,
      children: [],
    };
    trimTreeNode.children.push(nextAttachNode);
  }

  for (const child of oldTreeNode.children) {
    trimComponentTree(child, nextAttachNode, { matchId });
  }
}

/**
 * Given the component tree of current page
 * @param matchId An identifier to filter the component tree. Only components' name containing this id will be included
 */
export const getComponentTree = (options?: { matchId?: string, debugMode?: boolean }): string => {
  if (!options) {
    options = {
      matchId: '',
      debugMode: false,
    };
  }
  
  // Get all fiber roots
  const roots = getFiberRoots();
  if (!roots || roots.length === 0) {
    throw new FiberRootsNotFoundError('No React fiber roots found');
  }

  const result: ComponentTreeNode = {
    name: '__BASE__',
    children: [],
  };
  roots.forEach((root) => buildComponentTree(root, result));

  const trimmedResult = {
    name: '__BASE__',
    children: [],
  }

  // clean up matchId
  // heuristic here is if matchId does not contain any English letter, then it is a match all
  if (!/[a-zA-Z]/.test(options.matchId)) {
    options.matchId = '';
  }
  result.children.forEach((child) => trimComponentTree(child, trimmedResult, { matchId: options.matchId }));

  // there will always a be a root node under __BASE__
  const finalResult = trimmedResult.children[0];
  if (finalResult.name === 'createRoot()') {
    finalResult.name = 'root';
  }

  return finalResult;
};
