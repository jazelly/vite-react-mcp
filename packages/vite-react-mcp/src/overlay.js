import * as bippy from 'bippy';
import { highlightComponent } from './core/tools/component_highlighter.js';
import { getComponentStates } from './core/tools/component_state_viewer.js';
import { getComponentTree } from './core/tools/component_viewer.js';
import { buildSelectionContextForElement } from './core/tools/selection_context.js';
import { createElementSelector } from './core/tools/selection_selector.js';
import { createSelectionToolkit } from './core/tools/selection_toolkit.js';
import {
  collectUnnecessaryRender,
  queryWastedRender,
} from './core/tools/track_wasted_render.js';
import {
  __VITE_REACT_MCP_CONFIG__,
  __VITE_REACT_MCP_TOOLS__,
  __VITE_REACT_MCP__,
  target,
} from './shared/const.js';
import { BRIDGE_GLOBAL_CONFIG_KEY, BRIDGE_WS_PATH } from './shared/protocol.js';
import { fiberRoots, store } from './shared/store.js';

const customToolHandlers = new Map();

const registerCustomTool = (name, handler) => {
  customToolHandlers.set(name, handler);
};

const viteReactMcpConfig = target[__VITE_REACT_MCP_CONFIG__] || {};
const selectionToolkit = createSelectionToolkit({
  initialConfig: viteReactMcpConfig.toolkit,
});

const runtimeApi = {
  showToolkit: () => selectionToolkit.showToolkit(),
  hideToolkit: () => selectionToolkit.hideToolkit(),
  setToolkitConfig: (config) => selectionToolkit.setToolkitConfig(config),
  enterSelectionMode: () => selectionToolkit.enterSelectionMode(),
  exitSelectionMode: () => selectionToolkit.exitSelectionMode(),
  setSelectionMode: (enabled) => selectionToolkit.setSelectionMode(enabled),
  getLastSelectionContext: () => selectionToolkit.getLastSelectionContext(),
  copyLastSelectionContext: (format = 'text') =>
    selectionToolkit.copyLastSelectionContext(format),
};

const builtInTools = {
  highlightComponent,
  getComponentTree,
  getComponentStates,
  getUnnecessaryRenderedComponents: queryWastedRender,
  registerCustomTool,
};

if (!Object.hasOwn(target, __VITE_REACT_MCP_TOOLS__)) {
  Object.defineProperty(target, __VITE_REACT_MCP_TOOLS__, {
    value: builtInTools,
    writable: false,
    configurable: true,
  });
} else {
  Object.assign(target[__VITE_REACT_MCP_TOOLS__], builtInTools);
}

if (!Object.hasOwn(target, __VITE_REACT_MCP__)) {
  Object.defineProperty(target, __VITE_REACT_MCP__, {
    value: runtimeApi,
    writable: false,
    configurable: true,
  });
} else {
  Object.assign(target[__VITE_REACT_MCP__], runtimeApi);
}

bippy.instrument({
  name: 'vite-react-mcp',
  onCommitFiberRoot: (renderId, root) => {
    if (fiberRoots.has(renderId)) {
      fiberRoots.get(renderId).add(root);
    } else {
      fiberRoots.set(renderId, new Set([root]));
    }

    bippy.traverseRenderedFibers(root.current || root, (fiber, phase) => {
      if (phase === 'update') {
        collectUnnecessaryRender(fiber);
      }
    });

    store.currentCommitFrameId += 1;
  },
});

const normalizeQuery = (query) => query.trim().toLowerCase();

const getElementClassName = (element) => {
  if (typeof element.className === 'string') {
    return element.className;
  }
  return element.getAttribute?.('class') || '';
};

const getElementSearchText = (element) => {
  const parts = [];
  parts.push(element.tagName?.toLowerCase() || '');
  parts.push(element.id || '');
  parts.push(getElementClassName(element));
  parts.push(element.textContent || '');

  for (const attrName of ['name', 'aria-label', 'placeholder', 'title']) {
    const attrValue = element.getAttribute?.(attrName);
    if (attrValue) {
      parts.push(attrValue);
    }
  }

  return parts.join(' ').toLowerCase();
};

const getElementDepth = (element) => {
  let depth = 0;
  let current = element;
  while (current?.parentElement) {
    depth += 1;
    current = current.parentElement;
  }
  return depth;
};

const getElementMatchScore = (element, query) => {
  const id = normalizeQuery(element.id || '');
  if (id === query) return 0;

  for (const attrName of ['name', 'aria-label', 'placeholder', 'title']) {
    const attrValue = normalizeQuery(element.getAttribute?.(attrName) || '');
    if (attrValue === query) return 5;
  }

  if (id.includes(query)) return 10;

  for (const attrName of ['name', 'aria-label', 'placeholder', 'title']) {
    const attrValue = normalizeQuery(element.getAttribute?.(attrName) || '');
    if (attrValue.includes(query)) return 20;
  }

  const className = normalizeQuery(getElementClassName(element));
  if (className.includes(query)) return 30;

  const text = normalizeQuery(element.textContent || '');
  if (text.includes(query)) return 80;

  return 100;
};

const findHtmlElements = (queries, maxMatches = 10) => {
  const normalizedQueries = (queries || [])
    .map((query) => normalizeQuery(String(query || '')))
    .filter(Boolean);

  if (normalizedQueries.length === 0) {
    return [];
  }

  const matches = [];
  const seenElements = new Set();

  for (const query of normalizedQueries) {
    const allElements = document.querySelectorAll('*');
    for (const element of allElements) {
      if (seenElements.has(element)) {
        continue;
      }

      const searchText = getElementSearchText(element);
      if (!searchText.includes(query)) {
        continue;
      }

      seenElements.add(element);
      matches.push({
        query,
        element,
        score: getElementMatchScore(element, query),
        depth: getElementDepth(element),
        selector: createElementSelector(element),
        domPreview: (
          element.outerHTML || `<${element.tagName.toLowerCase()}>`
        ).slice(0, 800),
      });
    }
  }

  return matches
    .sort((left, right) => {
      if (left.score !== right.score) {
        return left.score - right.score;
      }
      return right.depth - left.depth;
    })
    .slice(0, maxMatches);
};

const handleBridgeRequest = async (event, payload) => {
  switch (event) {
    case 'highlight-component': {
      if (typeof payload?.componentName !== 'string') {
        throw new Error('Invalid args: missing componentName');
      }
      let response = 'Action failed';
      try {
        const components = target.__VITE_REACT_MCP_TOOLS__.highlightComponent(
          payload.componentName,
        );
        if (components.length > 0) {
          response = `Found and highlighted ${components.length} components`;
        }
      } catch (error) {
        response = `Error: ${error?.message || 'Unknown error'}`;
      }
      return response;
    }

    case 'get-component-tree': {
      return JSON.stringify(
        target.__VITE_REACT_MCP_TOOLS__.getComponentTree(payload || {}),
      );
    }

    case 'get-component-states': {
      if (typeof payload?.componentName !== 'string') {
        throw new Error('Invalid args: missing componentName');
      }
      return JSON.stringify(
        target.__VITE_REACT_MCP_TOOLS__.getComponentStates(
          payload.componentName,
        ),
      );
    }

    case 'get-unnecessary-rerenders': {
      const wastedRenders =
        target.__VITE_REACT_MCP_TOOLS__.getUnnecessaryRenderedComponents(
          payload?.timeframe,
          {
            allComponents: Boolean(payload?.allComponents),
            debugMode: Boolean(payload?.debugMode),
          },
        );
      return JSON.stringify(wastedRenders);
    }

    case 'set-selection-mode': {
      if (typeof payload?.enabled !== 'boolean') {
        throw new Error('Invalid args: missing enabled');
      }
      target.__VITE_REACT_MCP__.setSelectionMode(payload.enabled);
      return { success: true, enabled: payload.enabled };
    }

    case 'get-last-selection-context': {
      return {
        context: target.__VITE_REACT_MCP__.getLastSelectionContext(),
      };
    }

    case 'copy-last-selection-context': {
      const format = payload?.format === 'json' ? 'json' : 'text';
      return await target.__VITE_REACT_MCP__.copyLastSelectionContext(format);
    }

    case 'get-html-elements': {
      const maxMatches =
        typeof payload?.maxMatches === 'number' ? payload.maxMatches : 10;
      const matches = findHtmlElements(payload?.queries || [], maxMatches).map(
        (match) => ({
          query: match.query,
          selector: match.selector,
          domPreview: match.domPreview,
        }),
      );

      return {
        success: true,
        count: matches.length,
        matches,
      };
    }

    case 'get-react-source-code': {
      const maxMatches =
        typeof payload?.maxMatches === 'number' ? payload.maxMatches : 5;
      const matches = findHtmlElements(payload?.queries || [], maxMatches);

      if (matches.length === 0) {
        return {
          success: false,
          reason: 'No element matched the provided search strings',
          matches: [],
          context: null,
        };
      }

      const chosenMatch = matches[0];
      const context = await buildSelectionContextForElement(
        chosenMatch.element,
      );

      return {
        success: true,
        matches: matches.map((match) => ({
          query: match.query,
          selector: match.selector,
          domPreview: match.domPreview,
        })),
        chosenMatch: {
          query: chosenMatch.query,
          selector: chosenMatch.selector,
        },
        context,
      };
    }

    default:
      throw new Error(`Unsupported bridge event: ${event}`);
  }
};

const getBridgeUrl = () => {
  const configuredUrl = target[BRIDGE_GLOBAL_CONFIG_KEY];
  if (typeof configuredUrl === 'string' && configuredUrl.length > 0) {
    return configuredUrl;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${BRIDGE_WS_PATH}`;
};

const connectBridge = () => {
  let socket;

  const establishConnection = () => {
    try {
      socket = new WebSocket(getBridgeUrl());
    } catch (_error) {
      setTimeout(establishConnection, 1000);
      return;
    }

    socket.addEventListener('message', async (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch (_error) {
        return;
      }

      if (message?.type !== 'bridge:request') {
        return;
      }

      try {
        const payload = await handleBridgeRequest(
          message.event,
          message.payload,
        );
        socket.send(
          JSON.stringify({
            type: 'bridge:response',
            id: message.id,
            ok: true,
            payload,
          }),
        );
      } catch (error) {
        socket.send(
          JSON.stringify({
            type: 'bridge:response',
            id: message.id,
            ok: false,
            error: error?.message || 'Bridge request failed',
          }),
        );
      }
    });

    socket.addEventListener('close', () => {
      setTimeout(establishConnection, 1000);
    });

    socket.addEventListener('error', () => {
      try {
        socket.close();
      } catch (_error) {
        // noop
      }
    });
  };

  establishConnection();
};

connectBridge();
