export type BridgeRequestEvent =
  | 'highlight-component'
  | 'get-component-tree'
  | 'get-component-states'
  | 'get-unnecessary-rerenders'
  | 'set-selection-mode'
  | 'get-last-selection-context'
  | 'copy-last-selection-context'
  | 'get-html-elements'
  | 'get-react-source-code'
  | 'custom-tool';

export type BridgeMessage =
  | {
      type: 'bridge:request';
      id: string;
      event: BridgeRequestEvent;
      payload: unknown;
    }
  | {
      type: 'bridge:response';
      id: string;
      ok: boolean;
      payload?: unknown;
      error?: string;
    };

export const BRIDGE_WS_PATH = '/__agentic_react_bridge';

export const BRIDGE_GLOBAL_CONFIG_KEY = '__AGENTIC_REACT_BRIDGE_URL__';
