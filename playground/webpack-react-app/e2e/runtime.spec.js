import { expect, test } from '@playwright/test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const MCP_SERVER_URL = 'http://127.0.0.1:51425/sse';

const createMcpClient = async () => {
  const client = new Client({
    name: 'webpack-playground-mcp-e2e',
    version: '0.0.0',
  });
  const transport = new SSEClientTransport(new URL(MCP_SERVER_URL));
  await client.connect(transport);
  return { client, transport };
};

const parseToolResponse = (result) => {
  const textContent = result.content.find((content) => content.type === 'text');
  if (!textContent || typeof textContent.text !== 'string') {
    return null;
  }
  return JSON.parse(textContent.text);
};

test('webpack playground injects runtime globals', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__VITE_REACT_MCP__);

  const runtimeShape = await page.evaluate(() => ({
    hasRuntime: Boolean(window.__VITE_REACT_MCP__),
    hasTools: Boolean(window.__VITE_REACT_MCP_TOOLS__),
    hasSelectionMode: typeof window.__VITE_REACT_MCP__?.setSelectionMode,
    hasGetContext: typeof window.__VITE_REACT_MCP__?.getLastSelectionContext,
    hasCopyContext: typeof window.__VITE_REACT_MCP__?.copyLastSelectionContext,
  }));

  expect(runtimeShape.hasRuntime).toBe(true);
  expect(runtimeShape.hasTools).toBe(true);
  expect(runtimeShape.hasSelectionMode).toBe('function');
  expect(runtimeShape.hasGetContext).toBe('function');
  expect(runtimeShape.hasCopyContext).toBe('function');
});

test('webpack playground MCP tools return expected outcomes', async ({
  page,
}) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__VITE_REACT_MCP__);

  const { client, transport } = await createMcpClient();
  try {
    const htmlMatchesRaw = await client.callTool({
      name: 'get-html-elements',
      arguments: {
        queries: ['html'],
        maxMatches: 3,
      },
    });
    const htmlMatches = parseToolResponse(htmlMatchesRaw);
    expect(htmlMatches.success).toBe(true);
    expect(htmlMatches.count).toBeGreaterThan(0);
    expect(htmlMatches.matches[0].selector).toBeTruthy();

    const reactSourceRaw = await client.callTool({
      name: 'get-react-source-code',
      arguments: {
        queries: ['html'],
        maxMatches: 3,
        includeSourceSnippets: true,
      },
    });
    const reactSource = parseToolResponse(reactSourceRaw);
    expect(reactSource.success).toBe(true);
    expect(reactSource.chosenMatch.selector).toBeTruthy();
    expect(reactSource.context).toBeTruthy();

    const noMatchRaw = await client.callTool({
      name: 'get-react-source-code',
      arguments: {
        queries: ['text-not-present-in-webpack-playground'],
      },
    });
    const noMatch = parseToolResponse(noMatchRaw);
    expect(noMatch.success).toBe(false);
    expect(noMatch.reason).toContain('No element matched');
    expect(noMatch.context).toBeNull();

    const enableSelectionRaw = await client.callTool({
      name: 'set-selection-mode',
      arguments: { enabled: true },
    });
    const enableSelection = parseToolResponse(enableSelectionRaw);
    expect(enableSelection.success).toBe(true);
    expect(enableSelection.enabled).toBe(true);

    const contextRaw = await client.callTool({
      name: 'get-last-selection-context',
      arguments: {
        includeSourceSnippets: true,
        contextLines: 3,
        maxFiles: 3,
      },
    });
    const context = parseToolResponse(contextRaw);
    expect(context.success).toBe(false);
    expect(context.context).toBeNull();

    const copyRaw = await client.callTool({
      name: 'copy-last-selection-context',
      arguments: { format: 'json' },
    });
    const copyResponse = parseToolResponse(copyRaw);
    expect(copyResponse.success).toBe(false);
    expect(copyResponse.copied).toBe(false);
    expect(copyResponse.error).toContain('No selection context found');
  } finally {
    await transport.close();
  }
});
