import { expect, test } from '@playwright/test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const MCP_SERVER_URL = 'http://127.0.0.1:51423/sse';

const createMcpClient = async () => {
  const client = new Client({
    name: 'vite-react-mcp-e2e',
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

const selectProfileEmailField = async (page) => {
  await page.goto('/profile/1');
  await page.getByRole('button', { name: 'Edit Profile', exact: true }).click();

  await page.waitForFunction(() => window.__VITE_REACT_MCP__);
  await page.evaluate(() => window.__VITE_REACT_MCP__.enterSelectionMode());

  await page.locator('#profile-field-email').click();
};

test('copying without a selection returns a no-selection response', async ({
  page,
}) => {
  await page.goto('/profile/1');
  await page.waitForFunction(() => window.__VITE_REACT_MCP__);

  const copyResult = await page.evaluate(() =>
    window.__VITE_REACT_MCP__.copyLastSelectionContext('json'),
  );

  expect(copyResult.success).toBe(false);
  expect(copyResult.error).toBe('No selection context found');
});

test('selecting a profile field captures its React source context', async ({
  page,
}) => {
  await selectProfileEmailField(page);

  const context = await page.waitForFunction(() => {
    const selectionContext =
      window.__VITE_REACT_MCP__?.getLastSelectionContext();
    if (!selectionContext) return null;
    return selectionContext;
  });
  const selectionContext = await context.jsonValue();

  expect(selectionContext.componentName).toBe('ProfileField');
  expect(selectionContext.selector).toBe('#profile-field-email');
  expect(selectionContext.resolvedSources).toContainEqual(
    expect.objectContaining({
      filePath: expect.stringContaining(
        'src/components/UserProfile/ProfileField.jsx',
      ),
    }),
  );
});

test('copying the selected context includes a playground source snippet', async ({
  page,
}) => {
  await selectProfileEmailField(page);
  await page.waitForFunction(() =>
    window.__VITE_REACT_MCP__?.getLastSelectionContext(),
  );

  const copyResult = await page.evaluate(() =>
    window.__VITE_REACT_MCP__.copyLastSelectionContext('json'),
  );

  expect(copyResult.success).toBe(true);
  expect(copyResult.context.sourceSnippets).toContainEqual(
    expect.objectContaining({
      filePath: expect.stringContaining(
        'src/components/UserProfile/ProfileField.jsx',
      ),
      snippet: expect.stringContaining('profile-field-${name}'),
    }),
  );
  expect(copyResult.context.sourcePreview).toContain('profile-field-${name}');
  expect(copyResult.context.sourcePreview).toContain(
    'in ProfileField (at src/components/UserProfile/ProfileField.jsx',
  );
  expect(copyResult.context.sourcePreview).toContain(
    'src/components/UserProfile/ProfileContent.jsx',
  );
  expect(copyResult.context.sourcePreview).not.toContain('node_modules');
});

test('selecting an element without an id still returns a usable fallback selector', async ({
  page,
}) => {
  await page.goto('/profile/1');
  await page.getByRole('button', { name: 'Edit Profile', exact: true }).click();
  await page.waitForFunction(() => window.__VITE_REACT_MCP__);

  await page.evaluate(() => window.__VITE_REACT_MCP__.enterSelectionMode());
  await page.locator('label', { hasText: 'Email' }).first().click();

  const context = await page.waitForFunction(() =>
    window.__VITE_REACT_MCP__?.getLastSelectionContext(),
  );
  const selectionContext = await context.jsonValue();

  expect(selectionContext.componentName).toBe('ProfileField');
  expect(selectionContext.selector).toBeTruthy();

  const selectorMatchesSelection = await page.evaluate((selector) => {
    if (!selector) return false;
    return document.querySelector(selector) !== null;
  }, selectionContext.selector);

  expect(selectorMatchesSelection).toBe(true);
});

test('copying root-relative source context does not request filesystem /src fallback', async ({
  page,
}) => {
  let requestedAbsoluteSrcFallback = false;

  await selectProfileEmailField(page);
  await page.waitForFunction(() =>
    window.__VITE_REACT_MCP__?.getLastSelectionContext(),
  );
  await page.route('**/src/components/UserProfile/ProfileField.jsx**', (route) =>
    route.fulfill({ status: 404, body: '' }),
  );
  await page.route(
    '**/@fs/src/components/UserProfile/ProfileField.jsx**',
    (route) => {
      requestedAbsoluteSrcFallback = true;
      return route.fulfill({ status: 404, body: '' });
    },
  );

  const copyResult = await page.evaluate(() =>
    window.__VITE_REACT_MCP__.copyLastSelectionContext('json'),
  );

  expect(copyResult.success).toBe(true);
  expect(requestedAbsoluteSrcFallback).toBe(false);
});

test('MCP tools return no-selection and selected-context responses', async ({
  page,
}) => {
  await page.goto('/profile/1');
  await page.waitForFunction(() => window.__VITE_REACT_MCP__);

  const { client, transport } = await createMcpClient();
  try {
    const noSelectionRaw = await client.callTool({
      name: 'get-last-selection-context',
      arguments: {
        includeSourceSnippets: true,
      },
    });
    const noSelection = parseToolResponse(noSelectionRaw);
    expect(noSelection.success).toBe(false);
    expect(noSelection.context).toBeNull();
    expect(noSelection.message).toContain('No selection context');

    await selectProfileEmailField(page);
    await page.waitForFunction(() =>
      window.__VITE_REACT_MCP__?.getLastSelectionContext(),
    );

    const selectedContextRaw = await client.callTool({
      name: 'get-last-selection-context',
      arguments: {
        includeSourceSnippets: true,
        contextLines: 3,
        maxFiles: 2,
      },
    });
    const selectedContext = parseToolResponse(selectedContextRaw);
    expect(selectedContext.success).toBe(true);
    expect(selectedContext.context.componentName).toBe('ProfileField');
    expect(selectedContext.context.sourceSnippets.length).toBeGreaterThan(0);
    expect(selectedContext.summary).toContain('ProfileField');
  } finally {
    await transport.close();
  }
});

test('MCP get-html-elements and get-react-source-code return deterministic matches and source context', async ({
  page,
}) => {
  await page.goto('/profile/1');
  await page.getByRole('button', { name: 'Edit Profile', exact: true }).click();
  await page.waitForFunction(() => window.__VITE_REACT_MCP__);

  const { client, transport } = await createMcpClient();
  try {
    const htmlMatchesRaw = await client.callTool({
      name: 'get-html-elements',
      arguments: {
        queries: ['profile-field-email'],
        maxMatches: 3,
      },
    });
    const htmlMatches = parseToolResponse(htmlMatchesRaw);

    expect(htmlMatches.success).toBe(true);
    expect(htmlMatches.count).toBeGreaterThan(0);
    expect(htmlMatches.matches[0].selector).toBe('#profile-field-email');

    const reactSourceRaw = await client.callTool({
      name: 'get-react-source-code',
      arguments: {
        queries: ['profile-field-email'],
        maxMatches: 3,
        includeSourceSnippets: true,
        contextLines: 4,
        maxFiles: 3,
      },
    });
    const reactSource = parseToolResponse(reactSourceRaw);

    expect(reactSource.success).toBe(true);
    expect(reactSource.chosenMatch.selector).toBe('#profile-field-email');
    expect(reactSource.context.componentName).toBe('ProfileField');
    expect(reactSource.context.sourceSnippets).toContainEqual(
      expect.objectContaining({
        filePath: expect.stringContaining(
          'src/components/UserProfile/ProfileField.jsx',
        ),
      }),
    );
    expect(reactSource.summary).toContain('ProfileField');
  } finally {
    await transport.close();
  }
});

test('MCP get-react-source-code returns no-match payload when queries miss all elements', async ({
  page,
}) => {
  await page.goto('/profile/1');
  await page.waitForFunction(() => window.__VITE_REACT_MCP__);

  const { client, transport } = await createMcpClient();
  try {
    const missRaw = await client.callTool({
      name: 'get-react-source-code',
      arguments: {
        queries: ['this-does-not-exist-anywhere'],
      },
    });
    const miss = parseToolResponse(missRaw);
    expect(miss.success).toBe(false);
    expect(miss.reason).toContain('No element matched');
    expect(miss.context).toBeNull();
  } finally {
    await transport.close();
  }
});
