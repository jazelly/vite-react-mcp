import * as bippy from 'bippy';
import { highlightComponent } from './core/tools/component_highlighter.js';
import { getComponentStates } from './core/tools/component_state_viewer.js';
import { getComponentTree } from './core/tools/component_viewer.js';
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
import { fiberRoots, store } from './shared/store.js';

const customToolHandlers = new Map();

const registerCustomTool = (name, handler) => {
  customToolHandlers.set(name, handler);

  if (import.meta.hot) {
    import.meta.hot.on(`custom-tool-${name}`, async (data) => {
      try {
        const deserializedData = JSON.parse(data);
        const result = await handler(deserializedData);
        import.meta.hot.send(
          `custom-tool-${name}-response`,
          JSON.stringify(result),
        );
      } catch (error) {
        import.meta.hot.send(
          `custom-tool-${name}-response`,
          JSON.stringify({ error: error?.message || 'Custom tool failed' }),
        );
      }
    });
  }
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

const setupMcpToolsHandler = () => {
  if (!import.meta.hot) {
    return;
  }

  import.meta.hot.on('highlight-component', (data) => {
    let deserializedData;
    try {
      deserializedData = JSON.parse(data);
    } catch (_error) {
      throw new Error(`Data is not deserializable: ${data}`);
    }

    if (typeof deserializedData?.componentName !== 'string') {
      throw new Error('Invalid args sent from ViteDevServer');
    }

    let response = 'Action failed';
    try {
      const components = target.__VITE_REACT_MCP_TOOLS__.highlightComponent(
        deserializedData.componentName,
      );
      if (components.length > 0) {
        response = `Found and highlighted ${components.length} components`;
      }
    } catch (_error) {
      response = `Error: ${_error.message}`;
    }

    import.meta.hot.send('highlight-component-response', response);
  });

  import.meta.hot.on('get-component-tree', (data) => {
    let deserializedData;
    try {
      deserializedData = JSON.parse(data);
    } catch (_error) {
      throw new Error(`Args is not deserializable: ${data}`);
    }

    const componentTreeRoot =
      target.__VITE_REACT_MCP_TOOLS__.getComponentTree(deserializedData);
    import.meta.hot.send(
      'get-component-tree-response',
      JSON.stringify(componentTreeRoot),
    );
  });

  import.meta.hot.on('get-component-states', (data) => {
    let deserializedData;
    try {
      deserializedData = JSON.parse(data);
    } catch (_error) {
      throw new Error(`Data is not deserializable: ${data}`);
    }
    if (typeof deserializedData?.componentName !== 'string') {
      throw new Error(
        'Invalid data sent from ViteDevServer: missing componentName',
      );
    }

    const componentStatesResult =
      target.__VITE_REACT_MCP_TOOLS__.getComponentStates(
        deserializedData.componentName,
      );
    import.meta.hot.send(
      'get-component-states-response',
      JSON.stringify(componentStatesResult),
    );
  });

  import.meta.hot.on('get-unnecessary-rerenders', (data) => {
    let deserializedData;
    try {
      deserializedData = JSON.parse(data);
    } catch (_error) {
      throw new Error(`Data is not deserializable: ${data}`);
    }

    const wastedRenders =
      target.__VITE_REACT_MCP_TOOLS__.getUnnecessaryRenderedComponents(
        deserializedData.timeframe,
        {
          allComponents: Boolean(deserializedData.allComponents),
          debugMode: Boolean(deserializedData.debugMode),
        },
      );

    let response;

    try {
      response = JSON.stringify(wastedRenders);
    } catch (_error) {
      response = JSON.stringify({ error: _error.message });
    }

    import.meta.hot.send('get-unnecessary-rerenders-response', response);
  });

  import.meta.hot.on('set-selection-mode', (data) => {
    let deserializedData;
    try {
      deserializedData = JSON.parse(data);
    } catch (_error) {
      throw new Error(`Data is not deserializable: ${data}`);
    }

    if (typeof deserializedData?.enabled !== 'boolean') {
      throw new Error('Invalid args sent from ViteDevServer: missing enabled');
    }

    target.__VITE_REACT_MCP__.setSelectionMode(deserializedData.enabled);
    import.meta.hot.send(
      'set-selection-mode-response',
      JSON.stringify({ success: true, enabled: deserializedData.enabled }),
    );
  });

  import.meta.hot.on('get-last-selection-context', (data) => {
    let deserializedData;
    try {
      deserializedData = JSON.parse(data);
    } catch (_error) {
      throw new Error(`Data is not deserializable: ${data}`);
    }

    const context = target.__VITE_REACT_MCP__.getLastSelectionContext();
    import.meta.hot.send(
      'get-last-selection-context-response',
      JSON.stringify({
        context,
        includeSourceSnippets: Boolean(deserializedData?.includeSourceSnippets),
      }),
    );
  });

  import.meta.hot.on('copy-last-selection-context', async (data) => {
    let deserializedData;
    try {
      deserializedData = JSON.parse(data);
    } catch (_error) {
      throw new Error(`Data is not deserializable: ${data}`);
    }

    const format = deserializedData?.format === 'json' ? 'json' : 'text';
    const response =
      await target.__VITE_REACT_MCP__.copyLastSelectionContext(format);

    import.meta.hot.send(
      'copy-last-selection-context-response',
      JSON.stringify(response),
    );
  });
};

setupMcpToolsHandler();
