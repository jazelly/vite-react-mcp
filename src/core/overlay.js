import { __VITE_REACT_MCP_TOOLS__ } from '../shared/const';
import { target } from '../shared/const';
import { highlightReactComponent } from './component-highlighter';

const init = () => {
  if (target.hasOwnProperty(__VITE_REACT_MCP_TOOLS__)) {
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
      target.__VITE_REACT_MCP_TOOLS__.highlightReactComponent(data);
    });
  }
};

setupMcpToolsHandler();