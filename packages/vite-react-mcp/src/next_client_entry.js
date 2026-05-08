import {
  __VITE_REACT_MCP_BRIDGE_URL__,
  __VITE_REACT_MCP_CONFIG__,
} from './shared/const.js';
import { BRIDGE_WS_PATH } from './shared/protocol.js';

if (typeof window !== 'undefined') {
  if (!window[__VITE_REACT_MCP_CONFIG__]) {
    window[__VITE_REACT_MCP_CONFIG__] = {
      sourceRoot: '/',
    };
  }

  if (!window[__VITE_REACT_MCP_BRIDGE_URL__]) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    window[__VITE_REACT_MCP_BRIDGE_URL__] =
      `${protocol}//${window.location.host}${BRIDGE_WS_PATH}`;
  }
}

import './overlay.js';
