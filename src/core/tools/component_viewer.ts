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

/**
 * Generate an ASCII representation of a component tree
 * with numerical suffixes for duplicate elements at the same level.
 * Only adds numbering when there are duplicates.
 * 
 * @param tree The component tree to convert
 * @returns A string containing the ASCII representation of the tree
 */
function generateASCIIComponentTree(tree: ComponentTreeNode): string {
  const result: string[] = [];
  
  /**
   * Helper function to recursively build the ASCII tree
   * @param node Current node to process
   * @param prefix Current line prefix for proper indentation
   * @param isLast Whether this node is the last child of its parent
   * @param siblings All siblings at this level (including the current node)
   * @param siblingIndex Index of the current node in siblings array
   */
  function buildTreeLines(
    node: ComponentTreeNode, 
    prefix: string = "", 
    isLast: boolean = true,
    siblings: ComponentTreeNode[] = [],
    siblingIndex: number = 0
  ): void {
    // Check if this name has duplicates among siblings
    const hasDuplicates = siblings.filter(sibling => sibling.name === node.name).length > 1;
    
    // Calculate current occurrence number
    let currentOccurrence = 1;
    if (hasDuplicates) {
      currentOccurrence = siblings
        .slice(0, siblingIndex + 1)
        .filter(sibling => sibling.name === node.name)
        .length;
    }
    
    // Create display name - only add suffix if there are duplicates
    let displayName = node.name;
    if (hasDuplicates) {
      displayName = `${node.name} #${currentOccurrence}`;
    }
    
    // Add the current node to result
    const connector = isLast ? "└── " : "├── ";
    result.push(`${prefix}${connector}${displayName}`);
    
    // Prepare prefix for children
    const childPrefix = prefix + (isLast ? "    " : "│   ");
    
    // Process children
    const childCount = node.children.length;
    node.children.forEach((child, index) => {
      const isLastChild = index === childCount - 1;
      buildTreeLines(child, childPrefix, isLastChild, node.children, index);
    });
  }
  
  // Start with the root node
  result.push(tree.name);
  
  // Process root's children
  const childCount = tree.children.length;
  tree.children.forEach((child, index) => {
    const isLastChild = index === childCount - 1;
    buildTreeLines(child, "", isLastChild, tree.children, index);
  });
  
  return result.join("\n");
}
