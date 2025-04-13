import type { WastedRenderFiberInfo } from './types/internal';

declare global {
  interface Window {
    __REACT_COMPONENTS__: string[];
    __VITE_REACT_MCP_TOOLS__: {
      highlightReactComponent: (
        componentName: string,
        options: { debugMode?: boolean },
      ) => void;
      getComponentTree: (options: {
        selfOnly: boolean;
        debugMode?: boolean;
      }) => any;
      getComponentStates: (options: { debugMode?: boolean }) => any;
      getUnnecessaryRenderedComponents: (options: {
        debugMode?: boolean;
      }) => WastedRenderFiberInfo[];
    };
  }
}
