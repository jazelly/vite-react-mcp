
import {
  __AGENTIC_REACT_BRIDGE_URL__,
  __AGENTIC_REACT_CONFIG__,
} from "../../../packages/core/dist/shared/const.js";
import { BRIDGE_WS_PATH } from "../../../packages/core/dist/shared/protocol.js";

if (typeof window !== 'undefined') {
  const existingAgenticReactConfig = window[__AGENTIC_REACT_CONFIG__] || {};
  window[__AGENTIC_REACT_CONFIG__] = {
    ...existingAgenticReactConfig,
    sourceRoot: existingAgenticReactConfig.sourceRoot || "/Users/jazelly/Desktop/github/my-proj/vite-react-mcp/playground/agentic-react-nx-module-federation-playground",
    toolkit: {
      ...(existingAgenticReactConfig.toolkit || {}),
      ...{"tuningModal":{"classNames":{"surface":"nx-shell-tuning-surface","panel":"nx-shell-tuning-panel","control":"nx-shell-tuning-control"},"tokens":{"panelRadius":"12px","controlRadius":"9px","primaryButtonBackground":"#4338ca","primaryButtonColor":"#ffffff","panelShadow":"0 24px 72px rgba(67, 56, 202, 0.22)"},"styles":{"surface":{"filter":"drop-shadow(0 18px 40px rgba(67, 56, 202, 0.15))"},"panel":{"border":"1px solid rgba(67, 56, 202, 0.24)"},"targetTag":{"background":"#eef2ff","color":"#4338ca"},"sectionTitle":{"color":"#4338ca"}}}},
    },
  };

  if (!window[__AGENTIC_REACT_BRIDGE_URL__]) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    window[__AGENTIC_REACT_BRIDGE_URL__] =
      `${protocol}//${window.location.host}${BRIDGE_WS_PATH}`;
  }
}

void import("../../../packages/core/dist/overlay.js");


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

    
  
