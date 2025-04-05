import { __VITE_REACT_MCP_TOOLS__ } from '../shared/const';
import { target } from '../shared/const';
import { highlightReactComponent } from './component-highlighter';

const init = () => {
  if (Object.hasOwn(target, __VITE_REACT_MCP_TOOLS__)) {
    return;
  }

  Object.defineProperty(target, __VITE_REACT_MCP_TOOLS__, {
    value: {
      highlightReactComponent: highlightReactComponent,
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
  }
};

setupMcpToolsHandler();
