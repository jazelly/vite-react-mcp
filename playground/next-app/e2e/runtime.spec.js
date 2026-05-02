import { expect, test } from '@playwright/test';

const installMockBridge = async (page) => {
  await page.addInitScript(() => {
    const nativeWebSocket = window.WebSocket;
    const sockets = [];

    class MockBridgeSocket {
      constructor(url) {
        this.url = String(url);
        this.readyState = 1;
        this.CONNECTING = 0;
        this.OPEN = 1;
        this.CLOSING = 2;
        this.CLOSED = 3;
        this.onopen = null;
        this.onclose = null;
        this.onerror = null;
        this.onmessage = null;
        this._listeners = new Map();
        this.sentMessages = [];
        sockets.push(this);

        setTimeout(() => {
          this._emit('open', {});
        }, 0);
      }

      addEventListener(type, listener) {
        if (!this._listeners.has(type)) {
          this._listeners.set(type, []);
        }
        this._listeners.get(type).push(listener);
      }

      removeEventListener(type, listener) {
        const listeners = this._listeners.get(type) || [];
        this._listeners.set(
          type,
          listeners.filter((candidate) => candidate !== listener),
        );
      }

      send(data) {
        this.sentMessages.push(String(data));
      }

      close() {
        this.readyState = 3;
        this._emit('close', {});
      }

      dispatchBridgeRequest(message) {
        this._emit('message', { data: JSON.stringify(message) });
      }

      _emit(type, event) {
        const handler = this[`on${type}`];
        if (typeof handler === 'function') {
          handler(event);
        }
        const listeners = this._listeners.get(type) || [];
        for (const listener of listeners) {
          listener(event);
        }
      }
    }

    class BridgeAwareWebSocket {
      static CONNECTING = nativeWebSocket.CONNECTING ?? 0;
      static OPEN = nativeWebSocket.OPEN ?? 1;
      static CLOSING = nativeWebSocket.CLOSING ?? 2;
      static CLOSED = nativeWebSocket.CLOSED ?? 3;

      constructor(url, protocols) {
        const resolvedUrl = String(url);
        if (resolvedUrl.includes('/__vite_react_mcp_bridge')) {
          return new MockBridgeSocket(resolvedUrl);
        }

        if (protocols === undefined) {
          return new nativeWebSocket(url);
        }
        return new nativeWebSocket(url, protocols);
      }
    }

    window.__VITE_REACT_MCP_TEST_BRIDGE__ = { sockets };
    window.WebSocket = BridgeAwareWebSocket;
  });
};

const sendBridgeRequest = async (page, event, payload) => {
  return await page.evaluate(
    async ({ eventName, eventPayload }) => {
      const bridge = window.__VITE_REACT_MCP_TEST_BRIDGE__;
      const socket =
        bridge?.sockets?.find((candidate) =>
          String(candidate?.url || '').includes('/__vite_react_mcp_bridge'),
        ) || null;
      if (!socket) {
        throw new Error('No mock bridge socket was created');
      }

      const requestId = `req-${Math.random().toString(36).slice(2)}`;
      return await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`Timed out waiting for bridge response: ${eventName}`));
        }, 4000);

        const originalSend = socket.send.bind(socket);
        socket.send = (rawData) => {
          originalSend(rawData);
          try {
            const response = JSON.parse(String(rawData));
            if (response?.id === requestId && response?.type === 'bridge:response') {
              clearTimeout(timeoutId);
              socket.send = originalSend;
              resolve(response);
            }
          } catch (_error) {
            // ignore malformed outbound messages
          }
        };

        socket.dispatchBridgeRequest({
          type: 'bridge:request',
          id: requestId,
          event: eventName,
          payload: eventPayload,
        });
      });
    },
    { eventName: event, eventPayload: payload },
  );
};

test.beforeEach(async ({ page }) => {
  await installMockBridge(page);
});

test('next playground injects runtime globals and bridge connection', async ({
  page,
}) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__VITE_REACT_MCP__);

  const runtimeShape = await page.evaluate(() => {
    const socketUrls = (window.__VITE_REACT_MCP_TEST_BRIDGE__?.sockets || []).map(
      (socket) => socket?.url || '',
    );
    return {
      hasRuntime: Boolean(window.__VITE_REACT_MCP__),
      hasTools: Boolean(window.__VITE_REACT_MCP_TOOLS__),
      hasSelectionMode: typeof window.__VITE_REACT_MCP__?.setSelectionMode,
      hasGetContext: typeof window.__VITE_REACT_MCP__?.getLastSelectionContext,
      hasCopyContext: typeof window.__VITE_REACT_MCP__?.copyLastSelectionContext,
      hasGetComponentTree: typeof window.__VITE_REACT_MCP_TOOLS__?.getComponentTree,
      socketUrls,
    };
  });

  expect(runtimeShape.hasRuntime).toBe(true);
  expect(runtimeShape.hasTools).toBe(true);
  expect(runtimeShape.hasSelectionMode).toBe('function');
  expect(runtimeShape.hasGetContext).toBe('function');
  expect(runtimeShape.hasCopyContext).toBe('function');
  expect(runtimeShape.hasGetComponentTree).toBe('function');
  expect(runtimeShape.socketUrls.length).toBeGreaterThan(0);
  expect(
    runtimeShape.socketUrls.some((url) =>
      url.includes('/__vite_react_mcp_bridge'),
    ),
  ).toBe(true);
});

test('next playground bridge handles get-html-elements request', async ({
  page,
}) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__VITE_REACT_MCP__);

  const bridgeResponse = await sendBridgeRequest(page, 'get-html-elements', {
    queries: ['next-copy-target'],
    maxMatches: 3,
  });

  expect(bridgeResponse.ok).toBe(true);
  expect(bridgeResponse.payload.success).toBe(true);
  expect(bridgeResponse.payload.count).toBeGreaterThan(0);
  expect(bridgeResponse.payload.matches[0].selector).toBe('#next-copy-target');
});

test('next playground bridge handles get-react-source-code success and no-match responses', async ({
  page,
}) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__VITE_REACT_MCP__);

  const successResponse = await sendBridgeRequest(page, 'get-react-source-code', {
    queries: ['next-copy-target'],
    maxMatches: 3,
  });

  expect(successResponse.ok).toBe(true);
  expect(successResponse.payload.success).toBe(true);
  expect(successResponse.payload.chosenMatch.selector).toBe('#next-copy-target');
  expect(successResponse.payload.matches.length).toBeGreaterThan(0);
  expect(successResponse.payload.context).toBeTruthy();
  expect(successResponse.payload.context.selector).toBeTruthy();

  const noMatchResponse = await sendBridgeRequest(page, 'get-react-source-code', {
    queries: ['text-not-present-in-next-playground'],
  });

  expect(noMatchResponse.ok).toBe(true);
  expect(noMatchResponse.payload.success).toBe(false);
  expect(noMatchResponse.payload.reason).toContain('No element matched');
  expect(noMatchResponse.payload.context).toBeNull();
});
