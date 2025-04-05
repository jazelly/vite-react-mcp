import type { Fiber } from 'react-reconciler';
import { target } from '../../shared/const';
import {
  findComponentsInFiber,
  getFiberNodes,
  getNearestFiberWithStateNode,
} from '../../shared/util';

export const highlightReactComponent = (
  componentName: string,
  options: {
    debugMode?: boolean;
  } = {},
) => {
  const highlightColor = '#ff5757';
  const highlightThickness = '2px';
  const highlightDuration = 3000;

  const { debugMode = false } = options;

  // Apply highlighting to DOM nodes
  const highlightNodes = (nodes) => {
    if (nodes.length === 0) {
      if (debugMode) {
        console.warn(`No DOM nodes found for component "${componentName}"`);
      }
      return [];
    }

    // Create a unique style class for this highlight session
    const styleId = `highlight-style-${Date.now()}`;
    const styleElement = document.createElement('style');
    styleElement.id = styleId;

    const keyframesRule = `
      @keyframes highlight-pulse-${styleId} {
        0% { 
          background-color: rgba(0, 255, 0, 0.1) !important;
          box-shadow: 0 0 0 ${highlightThickness} ${highlightColor}80; 
        }
        50% { 
          background-color: rgba(0, 255, 0, 0.3) !important;
          box-shadow: 0 0 0 ${highlightThickness} ${highlightColor}; 
        }
        100% { 
          background-color: rgba(0, 255, 0, 0.1) !important;
          box-shadow: 0 0 0 ${highlightThickness} ${highlightColor}80; 
        }
      }
    `;

    styleElement.textContent = `
      ${keyframesRule}
      .highlight-component-${styleId} {
        background-color: rgba(0, 255, 0, 0.2) !important;
        outline: ${highlightThickness} solid ${highlightColor} !important;
        outline-offset: -1px !important;
        position: relative !important;
        z-index: 9999 !important;
        animation: highlight-pulse-${styleId} 1s infinite !important;
      }
      
      .highlight-tooltip-${styleId} {
        position: absolute !important;
        top: -28px !important;
        left: 0 !important;
        background-color: #333 !important;
        color: white !important;
        padding: 4px 8px !important;
        font-size: 12px !important;
        border-radius: 4px !important;
        pointer-events: none !important;
        z-index: 10000 !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        white-space: nowrap !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
      }
    `;

    document.head.appendChild(styleElement);

    // Apply highlight to each node and add tooltip
    const highlightedNodes = nodes.map((node, index) => {
      // Add the highlight class
      node.classList.add(`highlight-component-${styleId}`);

      // Create a tooltip element
      const tooltip = document.createElement('div');
      tooltip.className = `highlight-tooltip-${styleId}`;
      tooltip.style.cssText = `
        position: absolute;
        top: -28px;
        left: 0;
        background-color: #333;
        color: white;
        padding: 4px 8px;
        font-size: 12px;
        border-radius: 4px;
        pointer-events: none;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      `;
      tooltip.textContent = `${componentName} #${index + 1}`;

      // Store the original position
      const originalPosition = target.getComputedStyle(node).position;
      if (originalPosition === 'static') {
        node.style.position = 'relative';
      }

      // Add tooltip to node
      node.appendChild(tooltip);

      return {
        node,
        styleId,
        tooltip,
        originalPosition,
      };
    });

    if (debugMode) {
      console.debug(
        `[DEBUG] Highlighted ${highlightedNodes.length} instances of "${componentName}":`,
        nodes,
      );

      // Log component props if we have fiber nodes
      highlightedNodes.forEach((item, idx) => {
        if (item.fiber) {
          console.debug(
            `${componentName} #${idx + 1} props:`,
            item.fiber.memoizedProps,
          );
        }
      });
    }

    // Set timeout to remove highlights
    setTimeout(() => {
      // Remove style element
      if (document.getElementById(styleId)) {
        document.getElementById(styleId).remove();
      }

      // Remove highlight class and tooltip from each node
      for (const { node, tooltip, originalPosition } of highlightedNodes) {
        // Remove highlight class
        node.classList.remove(`highlight-component-${styleId}`);

        // Remove tooltip
        if (tooltip && tooltip.parentNode === node) {
          node.removeChild(tooltip);
        }

        // Restore original position if we changed it
        if (originalPosition === 'static') {
          node.style.position = '';
        }
      }

      if (debugMode && highlightedNodes.length > 0) {
        console.debug(
          `Removed highlights from ${highlightedNodes.length} "${componentName}" instances`,
        );
      }
    }, highlightDuration);

    return highlightedNodes;
  };

  let foundNodes = [];
  const roots = getFiberNodes();
  if (debugMode) {
    console.debug('[DEBUG] roots:', roots);
  }
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

  return highlightNodes(foundNodes);
};
