
import {
  __AGENTIC_REACT_BRIDGE_URL__,
  __AGENTIC_REACT_CONFIG__,
} from "../../../packages/agentic-react/dist/shared/const.js";
import { BRIDGE_WS_PATH } from "../../../packages/agentic-react/dist/shared/protocol.js";

if (typeof window !== 'undefined') {
  if (!window[__AGENTIC_REACT_CONFIG__]) {
    window[__AGENTIC_REACT_CONFIG__] = {
      sourceRoot: "/Users/jazelly/Desktop/github/my-proj/vite-react-mcp/playground/agentic-react-webpack-playground",
    };
  }

  if (!window[__AGENTIC_REACT_BRIDGE_URL__]) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    window[__AGENTIC_REACT_BRIDGE_URL__] =
      `${protocol}//${window.location.host}${BRIDGE_WS_PATH}`;
  }
}

void import("../../../packages/agentic-react/dist/overlay.js");


    const registerTool = (name, handler) => {
      const tryRegister = (attempt = 0) => {
        const registry = window.__AGENTIC_REACT_TOOLS__;
        if (registry?.registerCustomTool) {
          registry.registerCustomTool(name, handler);
          return;
        }
        if (attempt >= 40) {
          console.warn('[agentic-react] Custom tool registration timed out for', name);
          return;
        }
        setTimeout(() => tryRegister(attempt + 1), 50);
      };

      tryRegister();
    };

    
  
