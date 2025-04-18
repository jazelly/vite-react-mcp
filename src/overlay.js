import * as bippy from 'bippy';
import { __VITE_REACT_MCP_TOOLS__, target } from './shared/const.js';
import { fiberRoots, store } from './shared/store.js';
import { highlightComponent } from './core/tools/component_highlighter.js';
import { getComponentStates } from './core/tools/component_state_viewer.js';
import { getComponentTree } from './core/tools/component_viewer.js';
import {
  collectUnnecessaryRender,
  queryWastedRender,
} from './core/tools/track_wasted_render.js';

const init = () => {
  if (Object.hasOwn(target, __VITE_REACT_MCP_TOOLS__)) {
    return;
  }

  Object.defineProperty(target, __VITE_REACT_MCP_TOOLS__, {
    value: {
      highlightComponent: highlightComponent,
      getComponentTree: getComponentTree,
      getComponentStates: getComponentStates,
      getUnnecessaryRenderedComponents: queryWastedRender,
    },
    writable: false,
    configurable: true,
  });
};

init();

bippy.instrument({
  name: 'vite-react-mcp',
  // TODO: frameify onCommitFiberRoot
  // every onCommit should record an auto increment id
  // and time. We then can query, between [start, end]
  // what happened, in junction with states changes
  // ALL of these are to answer the question:
  // hey, this component was waste rendered, so what happened?
  onCommitFiberRoot: (_renderId, root) => {
    if (fiberRoots.has(_renderId)) {
      fiberRoots.get(_renderId).add(root);
    } else {
      fiberRoots.set(_renderId, new Set([root]));
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
  if (import.meta.hot) {
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
      console.log('get-component-tree-response', componentTreeRoot);
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
        console.debug('get-component-states ws handler', deserializedData);
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
            allComponents: !!deserializedData.allComponents,
            debugMode: !!deserializedData.debugMode,
          },
        );

      let response;

      try {
        response = JSON.stringify(wastedRenders);
      } catch (_error) {
        console.error('Error serializing wasted renders', _error);
        response = JSON.stringify({ error: _error.message });
      }

      import.meta.hot.send('get-unnecessary-rerenders-response', response);
    });
  }
};

setupMcpToolsHandler();
