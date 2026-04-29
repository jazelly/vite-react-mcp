import { expect, test } from '@playwright/test';

const selectProfileEmailField = async (page) => {
  await page.goto('/profile/1');
  await page.getByRole('button', { name: 'Edit Profile', exact: true }).click();

  await page.waitForFunction(() => window.__VITE_REACT_MCP__);
  await page.evaluate(() => window.__VITE_REACT_MCP__.enterSelectionMode());

  await page.locator('#profile-field-email').click();
};

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
});
