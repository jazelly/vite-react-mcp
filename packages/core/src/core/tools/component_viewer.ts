import type { Fiber } from 'bippy';
import { FiberRootsNotFoundError } from '../../shared/errors.js';
import { getAllFiberRoots, getDisplayNameForFiber } from '../../shared/util.js';
import type { ComponentTreeNode } from '../../types/internal.js';
import { isProjectOwnedFiber } from './source_ownership.js';

interface ComponentTreeNodeWithOwnership extends ComponentTreeNode {
  isProjectOwned: boolean;
  children: ComponentTreeNodeWithOwnership[];
}

/**
 * Recursively build a component tree with name from a fiber tree
 * @param fiber The fiber tree to convert
 * @param prevResult The previous result of the component tree
 * @returns The component tree
 */
const buildComponentTree = async (
  fiber: Fiber,
  prevResult: ComponentTreeNodeWithOwnership,
) => {
  let fiberBase = fiber;
  while (fiberBase) {
    const componentName = getDisplayNameForFiber(fiberBase);
    const nodeResult = {
      name: componentName,
      children: [],
      isProjectOwned: await isProjectOwnedFiber(fiberBase),
    };
    prevResult.children.push(nodeResult);
    await buildComponentTree(fiberBase.child, nodeResult);
    fiberBase = fiberBase.sibling;
  }
};

/**
 * Recursively trim the component tree to only include the components of self defined
 * @param oldTreeNode The old tree node to trim
 * @param trimTreeNode The tree node to trim to
 */
const trimComponentTree = (
  oldTreeNode: ComponentTreeNodeWithOwnership,
  trimTreeNode: ComponentTreeNodeWithOwnership,
) => {
  let nextAttachNode = trimTreeNode;
  if (oldTreeNode.name === 'createRoot()' || oldTreeNode.isProjectOwned) {
    nextAttachNode = {
      name: oldTreeNode.name,
      children: [],
      isProjectOwned: oldTreeNode.isProjectOwned,
    };
    trimTreeNode.children.push(nextAttachNode);
  }

  for (const child of oldTreeNode.children) {
    trimComponentTree(child, nextAttachNode);
  }
};

const stripOwnership = (
  node: ComponentTreeNodeWithOwnership,
): ComponentTreeNode => ({
  name: node.name,
  children: node.children.map(stripOwnership),
});

/**
 * Given the component tree of current page
 * @param matchId An identifier to filter the component tree. Only components' name containing this id will be included
 */
export const getComponentTree = async ({
  allComponents = false,
  debugMode = false,
}: {
  allComponents?: boolean;
  debugMode?: boolean;
} = {}): Promise<ComponentTreeNode> => {
  // Get all fiber roots
  const roots = getAllFiberRoots();
  if (!roots || roots.length === 0) {
    throw new FiberRootsNotFoundError('No React fiber roots found');
  }

  if (debugMode) {
    console.debug('getComponentTree - roots', roots);
  }

  const result: ComponentTreeNodeWithOwnership = {
    name: '__BASE__',
    children: [],
    isProjectOwned: false,
  };
  for (const root of roots) {
    await buildComponentTree(root.current, result);
  }

  if (debugMode) {
    console.debug('getComponentTree - full result', result);
  }

  const trimmedResult = {
    name: '__BASE__',
    children: [],
    isProjectOwned: false,
  };

  if (debugMode) {
    console.debug('getComponentTree - ComponentTreeNode result', result);
  }

  let finalResult = result;
  if (!allComponents) {
    for (const child of result.children) {
      trimComponentTree(child, trimmedResult);
    }
    if (debugMode) {
      console.debug('getComponentTree - trimmed result', trimmedResult);
    }
    finalResult = trimmedResult.children[0] ?? trimmedResult;
  }

  // there will always a be a root node under __BASE__
  if (finalResult.name === 'createRoot()') {
    finalResult.name = 'root';
  }

  return stripOwnership(finalResult);
};
