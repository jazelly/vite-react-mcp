/* global __AGENTIC_REACT_DEFAULT_BRIDGE_URL__ */

import {
  __AGENTIC_REACT_BRIDGE_URL__,
  __AGENTIC_REACT_CONFIG__,
} from './shared/const.js';
import { BRIDGE_WS_PATH } from './shared/protocol.js';

if (typeof window !== 'undefined') {
  if (!window[__AGENTIC_REACT_CONFIG__]) {
    window[__AGENTIC_REACT_CONFIG__] = {
      sourceRoot: '/',
    };
  }

  if (!window[__AGENTIC_REACT_BRIDGE_URL__]) {
    const defaultBridgeUrl =
      typeof __AGENTIC_REACT_DEFAULT_BRIDGE_URL__ === 'string'
        ? __AGENTIC_REACT_DEFAULT_BRIDGE_URL__
        : '';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    window[__AGENTIC_REACT_BRIDGE_URL__] =
      defaultBridgeUrl ||
      `${protocol}//${window.location.host}${BRIDGE_WS_PATH}`;
  }
}

import './overlay.js';
