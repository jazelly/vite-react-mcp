import { getFiberRoots } from "../../shared/util";

import { Fiber } from "react-reconciler";
import { findComponentsInFiber, getNearestFiberWithStateNode } from "../../shared/util";
import { ComponentTreeNode } from "../../types/internal";
import { MemoizedState } from "../../types/react";

export function getFibersByComponentName(componentName: string): Fiber[] {
  const result: Fiber[] = [];
  const roots = getFiberRoots();

  for (const root of roots) {
    const fibers = findComponentsInFiber(root, componentName);
    result.push(...fibers);
  }

  return result;
}

export function getDOMNodesByComponentName(componentName: string): HTMLElement[] {
  let foundNodes: HTMLElement[] = [];
  const roots = getFiberRoots();
  const fiberResults: { fiber: Fiber; domNode: HTMLElement }[] = [];

  for (const root of roots) {
    const fibers = findComponentsInFiber(root, componentName);
    for (const fiber of fibers) {
      const fiberWithStateNode = getNearestFiberWithStateNode(fiber);
      if (fiberWithStateNode?.stateNode) {
        fiberResults.push({ fiber, domNode: fiberWithStateNode.stateNode });
      }
    }
  }

  if (fiberResults.length > 0) {
    foundNodes = fiberResults.map((result) => result.domNode);
  }

  return foundNodes;
}

/**
* Generate an ASCII representation of a component tree
* with numerical suffixes for duplicate elements at the same level.
* Only adds numbering when there are duplicates.
* 
* @param tree The component tree to convert
* @returns A string containing the ASCII representation of the tree
*/
export function generateASCIIComponentTree(tree: ComponentTreeNode): string {
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