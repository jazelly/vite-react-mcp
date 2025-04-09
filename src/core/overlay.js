import { __VITE_REACT_MCP_TOOLS__ } from '../shared/const';
import { target } from '../shared/const';
import { highlightComponent } from './tools/component_highlighter';
import { getComponentTree } from './tools/component_viewer';
import { getComponentStates } from './tools/component_state_viewer';

const init = () => {
  if (Object.hasOwn(target, __VITE_REACT_MCP_TOOLS__)) {
    return;
  }

  Object.defineProperty(target, __VITE_REACT_MCP_TOOLS__, {
    value: {
      highlightComponent: highlightComponent,
      getComponentTree: getComponentTree,
      getComponentStates: getComponentStates,
    },
    writable: false,
    configurable: true,
  });
};

init();

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
        console.debug('highlight-component ws handler', deserializedData);
        throw new Error('Invalid data sent from ViteDevServer');
      }
      target.__VITE_REACT_MCP_TOOLS__.highlightReactComponent(
        deserializedData.componentName,
      );
    });

    import.meta.hot.on('get-component-tree', (data) => {
      let deserializedData;
      try {
        deserializedData = JSON.parse(data);
      } catch (_error) {
        throw new Error(`Data is not deserializable: ${data}`);
      }

      const componentTreeRoot = target.__VITE_REACT_MCP_TOOLS__.getComponentTree(deserializedData);
      import.meta.hot.send('get-component-tree-response', JSON.stringify(componentTreeRoot));
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
        throw new Error('Invalid data sent from ViteDevServer: missing componentName');
      }

      const componentStatesResult = target.__VITE_REACT_MCP_TOOLS__.getComponentStates(
        deserializedData.componentName,
      );
      import.meta.hot.send('get-component-states-response', JSON.stringify(componentStatesResult));
    });
  }
};

setupMcpToolsHandler();
