import { getAllFiberRoots } from '../../shared/util';

import { Fiber, FiberRoot } from 'react-reconciler';
import {
  findComponentsInFiber,
  getNearestFiberWithStateNode,
} from '../../shared/util';
import { ComponentTreeNode } from '../../types/internal';
import { MemoizedState } from '../../types/react';

export function getFibersByComponentName(componentName: string): Fiber[] {
  const result: Fiber[] = [];
  const roots = getAllFiberRoots();

  for (const root of roots) {
    const fibers = findComponentsInFiber(root, componentName);
    result.push(...fibers);
  }

  return result;
}

export function getDOMNodesByComponentName(
  componentName: string,
): HTMLElement[] {
  let foundNodes: HTMLElement[] = [];
  const roots = getAllFiberRoots();
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
    prefix: string = '',
    isLast: boolean = true,
    siblings: ComponentTreeNode[] = [],
    siblingIndex: number = 0,
  ): void {
    // Check if this name has duplicates among siblings
    const hasDuplicates =
      siblings.filter((sibling) => sibling.name === node.name).length > 1;

    // Calculate current occurrence number
    let currentOccurrence = 1;
    if (hasDuplicates) {
      currentOccurrence = siblings
        .slice(0, siblingIndex + 1)
        .filter((sibling) => sibling.name === node.name).length;
    }

    // Create display name - only add suffix if there are duplicates
    let displayName = node.name;
    if (hasDuplicates) {
      displayName = `${node.name} #${currentOccurrence}`;
    }

    // Add the current node to result
    const connector = isLast ? '└── ' : '├── ';
    result.push(`${prefix}${connector}${displayName}`);

    // Prepare prefix for children
    const childPrefix = prefix + (isLast ? '    ' : '│   ');

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
    buildTreeLines(child, '', isLastChild, tree.children, index);
  });

  return result.join('\n');
}

export const flashStateNode = (
  stateNode: HTMLElement | null,
  duration: number = 4000,
  color: string = '#9b59b6', // Purple color
) => {
  if (!(stateNode instanceof HTMLElement)) {
    return;
  }

  const styleId = `flash-style-${Date.now()}`;
  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  const highlightThickness = '3px'; // Increased thickness

  const keyframesRule = `
    @keyframes flash-pulse-${styleId} {
      0% {
        background-color: rgba(155, 89, 182, 0.2) !important; /* Slightly darker base */
        box-shadow: 0 0 0 ${highlightThickness} ${color}60; /* Less transparent shadow */
      }
      50% {
        background-color: rgba(155, 89, 182, 0.5) !important; /* More intense background */
        box-shadow: 0 0 0 calc(${highlightThickness} + 1px) ${color}; /* Thicker, solid shadow */
      }
      100% {
        background-color: rgba(155, 89, 182, 0.2) !important; /* Back to base */
        box-shadow: 0 0 0 ${highlightThickness} ${color}60; /* Back to less transparent shadow */
      }
    }
  `;

  styleElement.textContent = `
    ${keyframesRule}
    .flash-element-${styleId} {
      background-color: rgba(155, 89, 182, 0.2) !important; /* Base purple */
      outline: ${highlightThickness} solid ${color} !important;
      outline-offset: -1px !important;
      position: relative !important; /* Ensure position is relative for potential absolute children if any */
      z-index: 9998 !important; /* Lower than highlighter */
      animation: flash-pulse-${styleId} 0.8s infinite !important; /* Faster animation */
      transition: outline 0.1s ease-in-out, background-color 0.1s ease-in-out; /* Smooth transitions */
    }
  `;

  document.head.appendChild(styleElement);

  // Store the original position if it's static
  const originalPosition = window.getComputedStyle(stateNode).position;
  const needsPositionReset = originalPosition === 'static';
  if (needsPositionReset) {
    stateNode.style.position = 'relative';
  }

  // Apply the flash class
  stateNode.classList.add(`flash-element-${styleId}`);

  // Set timeout to remove the flash effect
  setTimeout(() => {
    // Remove style element
    const style = document.getElementById(styleId);
    if (style) {
      style.remove();
    }

    // Remove flash class
    stateNode.classList.remove(`flash-element-${styleId}`);

    // Restore original position if we changed it
    if (needsPositionReset) {
      stateNode.style.position = ''; // Reset to default (or its original value before 'relative')
    }
  }, duration);
};
