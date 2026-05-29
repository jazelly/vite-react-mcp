import { expect, test } from '@playwright/test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const MCP_SERVER_URL = 'http://127.0.0.1:51423/sse';

const createMcpClient = async () => {
  const client = new Client({
    name: 'agentic-react-e2e',
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

const getToolText = (result) => {
  const textContent = result.content.find((content) => content.type === 'text');
  if (!textContent || typeof textContent.text !== 'string') {
    return '';
  }
  return textContent.text;
};

const selectProfileEmailField = async (page) => {
  await page.goto('/profile/1');
  await page.getByRole('button', { name: 'Edit Profile', exact: true }).click();

  await page.waitForFunction(() => window.__AGENTIC_REACT__);
  await page.evaluate(() => window.__AGENTIC_REACT__.setSelectionMode(true));
  await page.locator('#profile-field-email').click();

  const didCapture = await page.evaluate(() =>
    Boolean(window.__AGENTIC_REACT__?.getLastSelectionContext()),
  );
  if (!didCapture) {
    await page.evaluate(() => window.__AGENTIC_REACT__.setSelectionMode(true));
    await page.locator('#profile-field-email').click();
  }
};

const getToolkitRoot = (page) =>
  page.locator('[data-agentic-react-toolkit="true"]');

const openToolkitPanel = async (page) => {
  const toolkitRoot = getToolkitRoot(page);
  await toolkitRoot.waitFor();
  const selectButton = toolkitRoot.getByRole('button', {
    name: 'Select',
    exact: true,
  });
  if (await selectButton.isVisible()) {
    return;
  }

  const launcherButton = toolkitRoot.locator(
    'button[aria-label*="Agentic React toolkit"]',
  );

  await launcherButton.first().click({ force: true });

  if (!(await selectButton.isVisible())) {
    await launcherButton.first().click({ force: true });
  }

  await expect(selectButton).toBeVisible();
};

const captureWithToolkitUi = async (page, selector) => {
  const toolkitRoot = getToolkitRoot(page);
  await openToolkitPanel(page);
  await toolkitRoot.getByRole('button', { name: 'Select', exact: true }).click();
  await page.locator(selector).click();
  await expect(
    toolkitRoot.getByText('Captured', { exact: false }),
  ).toBeVisible();
};

test('copying without a selection returns a no-selection response', async ({
  page,
}) => {
  await page.goto('/profile/1');
  await page.waitForFunction(() => window.__AGENTIC_REACT__);

  const copyResult = await page.evaluate(() =>
    window.__AGENTIC_REACT__.copyLastSelectionContext('json'),
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
      window.__AGENTIC_REACT__?.getLastSelectionContext();
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
    window.__AGENTIC_REACT__?.getLastSelectionContext(),
  );

  const copyResult = await page.evaluate(() =>
    window.__AGENTIC_REACT__.copyLastSelectionContext('json'),
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
  await page.waitForFunction(() => window.__AGENTIC_REACT__);

  await page.evaluate(() => window.__AGENTIC_REACT__.enterSelectionMode());
  await page.locator('label', { hasText: 'Email' }).first().click();

  const context = await page.waitForFunction(() =>
    window.__AGENTIC_REACT__?.getLastSelectionContext(),
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
    window.__AGENTIC_REACT__?.getLastSelectionContext(),
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
    window.__AGENTIC_REACT__.copyLastSelectionContext('json'),
  );

  expect(copyResult.success).toBe(true);
  expect(requestedAbsoluteSrcFallback).toBe(false);
});

test('MCP tools return no-selection and selected-context responses', async ({
  page,
}) => {
  await page.goto('/profile/1');
  await page.waitForFunction(() => window.__AGENTIC_REACT__);

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
      window.__AGENTIC_REACT__?.getLastSelectionContext(),
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
  await page.waitForFunction(() => window.__AGENTIC_REACT__);

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
  await page.waitForFunction(() => window.__AGENTIC_REACT__);

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

test('toolkit bottom-right UI can capture reusable component source context across parents', async ({
  page,
}) => {
  await page.goto('/profile/1');
  await page.waitForFunction(() => window.__AGENTIC_REACT__);

  const toolkitRoot = getToolkitRoot(page);
  const toolkitPosition = await toolkitRoot.evaluate((element) => {
    const styles = window.getComputedStyle(element);
    return {
      position: styles.position,
      right: styles.right,
      bottom: styles.bottom,
    };
  });
  expect(toolkitPosition.position).toBe('fixed');
  expect(toolkitPosition.right).toBe('20px');
  expect(toolkitPosition.bottom).toBe('20px');

  const { client, transport } = await createMcpClient();
  try {
    await captureWithToolkitUi(page, '#profile-display-email-value');
    await toolkitRoot.getByRole('button', { name: 'Copy', exact: true }).click();

    const profileFieldContextRaw = await client.callTool({
      name: 'get-last-selection-context',
      arguments: {
        includeSourceSnippets: true,
        contextLines: 4,
        maxFiles: 4,
      },
    });
    const profileFieldContext = parseToolResponse(profileFieldContextRaw);
    expect(profileFieldContext.success).toBe(true);
    expect(profileFieldContext.context.selector).toBe('#profile-display-email-value');
    expect(profileFieldContext.context.resolvedSources).toContainEqual(
      expect.objectContaining({
        filePath: expect.stringContaining('src/components/Common/LabeledValue.jsx'),
      }),
    );
    expect(profileFieldContext.context.resolvedSources).toContainEqual(
      expect.objectContaining({
        filePath: expect.stringContaining('src/components/UserProfile/ProfileField.jsx'),
      }),
    );

    await captureWithToolkitUi(page, '#profile-header-occupation-value');
    const profileHeaderContextRaw = await client.callTool({
      name: 'get-last-selection-context',
      arguments: {
        includeSourceSnippets: true,
        contextLines: 4,
        maxFiles: 4,
      },
    });
    const profileHeaderContext = parseToolResponse(profileHeaderContextRaw);
    expect(profileHeaderContext.success).toBe(true);
    expect(profileHeaderContext.context.selector).toBe(
      '#profile-header-occupation-value',
    );
    expect(profileHeaderContext.context.resolvedSources).toContainEqual(
      expect.objectContaining({
        filePath: expect.stringContaining('src/components/Common/LabeledValue.jsx'),
      }),
    );
    expect(profileHeaderContext.context.resolvedSources).toContainEqual(
      expect.objectContaining({
        filePath: expect.stringContaining('src/components/UserProfile/ProfileHeader.jsx'),
      }),
    );
  } finally {
    await transport.close();
  }
});

test('MCP built-in tooling endpoints all return expected outcomes', async ({
  page,
}) => {
  await page.goto('/profile/1');
  await page.waitForFunction(() => window.__AGENTIC_REACT__);

  const { client, transport } = await createMcpClient();
  try {
    const highlightRaw = await client.callTool({
      name: 'highlight-component',
      arguments: { componentName: 'ProfileField' },
    });
    const highlightText = getToolText(highlightRaw);
    expect(highlightText).toContain('highlighted');

    const treeRaw = await client.callTool({
      name: 'get-component-tree',
      arguments: { allComponents: false },
    });
    const treeText = getToolText(treeRaw);
    const tree = JSON.parse(treeText);
    expect(tree).toBeTruthy();
    expect(JSON.stringify(tree)).toContain('UserProfile');

    const statesRaw = await client.callTool({
      name: 'get-component-states',
      arguments: { componentName: 'ProfileField' },
    });
    const statesText = getToolText(statesRaw);
    const states = JSON.parse(statesText);
    expect(states).toBeTruthy();
    expect(Object.keys(states).length).toBeGreaterThan(0);

    const rerendersRaw = await client.callTool({
      name: 'get-unnecessary-rerenders',
      arguments: { timeframe: 60, allComponents: true },
    });
    const rerendersText = getToolText(rerendersRaw);
    const rerenders = JSON.parse(rerendersText);
    expect(Array.isArray(rerenders)).toBe(true);

    await selectProfileEmailField(page);
    const copiedRaw = await client.callTool({
      name: 'copy-last-selection-context',
      arguments: { format: 'json' },
    });
    const copied = parseToolResponse(copiedRaw);
    expect(typeof copied.success).toBe('boolean');
    expect(typeof copied.copied).toBe('boolean');
    expect(copied.format).toBe('json');
    expect(copied.context).toBeTruthy();
    if (!copied.success) {
      expect(copied.error).toContain('Failed to copy context');
    }
  } finally {
    await transport.close();
  }
});

test('MCP custom tools execute inside the browser runtime', async ({ page }) => {
  await page.goto('/profile/1');
  await page.waitForFunction(() => window.__AGENTIC_REACT__);

  const { client, transport } = await createMcpClient();
  try {
    const customToolRaw = await client.callTool({
      name: 'log1',
      arguments: { message: 'browser-runtime-check' },
    });
    const customToolResult = parseToolResponse(customToolRaw);

    expect(customToolResult.success).toBe(true);
    expect(customToolResult.runtime).toBe('browser');
    expect(customToolResult.message).toBe(
      'Log1 received: browser-runtime-check',
    );

    const browserCalls = await page.evaluate(
      () => window.__AGENTIC_REACT_CUSTOM_TOOL_CALLS__ || [],
    );
    expect(browserCalls).toContain('browser-runtime-check');
  } finally {
    await transport.close();
  }
});
