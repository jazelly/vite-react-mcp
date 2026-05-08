import { randomUUID } from 'node:crypto';
import { type WebSocket, WebSocketServer } from 'ws';
import {
  BRIDGE_WS_PATH,
  type BridgeMessage,
  type BridgeRequestEvent,
} from '../shared/protocol.js';

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeoutId: NodeJS.Timeout;
}

const DEFAULT_TIMEOUT_MS = 10000;

const isBridgeMessage = (value: unknown): value is BridgeMessage => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const message = value as { type?: unknown };
  return (
    message.type === 'bridge:request' || message.type === 'bridge:response'
  );
};

export class RuntimeBridgeServer {
  private wsServer: WebSocketServer | null = null;
  private activeSocket: WebSocket | null = null;
  private readonly pendingRequests = new Map<string, PendingRequest>();

  attach(httpServer: any) {
    this.wsServer = new WebSocketServer({ noServer: true });

    httpServer.on('upgrade', (request, socket, head) => {
      const requestUrl = request.url || '';
      const pathname = requestUrl.split('?')[0];

      if (pathname !== BRIDGE_WS_PATH || !this.wsServer) {
        return;
      }

      this.wsServer.handleUpgrade(request, socket, head, (websocket) => {
        this.wsServer?.emit('connection', websocket, request);
      });
    });

    this.wsServer.on('connection', (websocket) => {
      if (
        this.activeSocket &&
        this.activeSocket.readyState === this.activeSocket.OPEN
      ) {
        this.activeSocket.close();
      }

      this.activeSocket = websocket;

      websocket.on('message', (messageBuffer) => {
        try {
          const parsedMessage = JSON.parse(messageBuffer.toString()) as unknown;

          if (!isBridgeMessage(parsedMessage)) {
            return;
          }

          if (parsedMessage.type !== 'bridge:response') {
            return;
          }

          const pendingRequest = this.pendingRequests.get(parsedMessage.id);
          if (!pendingRequest) {
            return;
          }

          this.pendingRequests.delete(parsedMessage.id);
          clearTimeout(pendingRequest.timeoutId);

          if (parsedMessage.ok) {
            pendingRequest.resolve(parsedMessage.payload);
            return;
          }

          pendingRequest.reject(
            new Error(parsedMessage.error || 'Bridge response failed'),
          );
        } catch (_error) {
          // ignore malformed response
        }
      });

      websocket.on('close', () => {
        if (this.activeSocket === websocket) {
          this.activeSocket = null;
        }

        for (const [requestId, pendingRequest] of this.pendingRequests) {
          clearTimeout(pendingRequest.timeoutId);
          pendingRequest.reject(
            new Error('Bridge connection closed before receiving response'),
          );
          this.pendingRequests.delete(requestId);
        }
      });
    });
  }

  async request(
    event: BridgeRequestEvent,
    payload: unknown,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<unknown> {
    if (
      !this.activeSocket ||
      this.activeSocket.readyState !== this.activeSocket.OPEN
    ) {
      throw new Error('No active runtime bridge connection');
    }

    const requestId = randomUUID();

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Bridge request timed out for ${event}`));
      }, timeoutMs);

      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeoutId,
      });

      const message: BridgeMessage = {
        type: 'bridge:request',
        id: requestId,
        event,
        payload,
      };

      this.activeSocket?.send(JSON.stringify(message));
    });
  }
}
