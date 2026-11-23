const { test, expect } = require('./fixtures');

const searchInput = page => page.getByLabel('Search by service, item, or benefit');
const resultCards = page => page.locator('#benefit-grid').getByRole('button');

test.beforeEach(async ({ page }) => {
  // Each test starts from an empty browser store, including the usage tracker.
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test('search tolerates a typo and ranks the named benefit first', async ({ page }) => {
  await searchInput(page).fill('massge');

  await expect(resultCards(page).first()).toHaveAccessibleName('Massage therapy');
});

test('no-match search recovers through the issue finder', async ({ page }) => {
  await searchInput(page).fill('sore feet');

  await expect(page.getByRole('heading', { name: 'No match for “sore feet”' })).toBeVisible();
  const tryIssue = page.getByRole('button', { name: 'Try Search by issue' });
  await expect(tryIssue).toBeVisible();
  await tryIssue.click();

  const issueInput = page.getByLabel('Describe what you need help with');
  await expect(issueInput).toBeVisible();
  await expect(issueInput).toHaveValue('sore feet');

  const results = page.locator('#finder-results');
  await expect(results.getByRole('heading', { name: 'Foot pain or foot support' })).toBeVisible();
  await expect(results.getByRole('button', { name: /^View details for / })).toHaveCount(3);

  for (const title of ['Podiatry & chiropody', 'Custom orthotics', 'Orthopaedic shoes']) {
    await expect(results.getByRole('heading', { name: title })).toBeVisible();
  }
});

test('coverage switch adds and removes supplementary-only travel cover', async ({ page }) => {
  const travelEmergency = page.getByRole('button', { name: 'Emergency care while travelling' });
  await expect(travelEmergency).toBeVisible();

  await page.getByRole('radio', { name: 'Comprehensive' }).check();
  await expect(page.getByRole('button', { name: 'Emergency care while travelling' })).toHaveCount(0);

  await page.getByRole('radio', { name: 'Supplementary' }).check();
  await expect(page.getByRole('button', { name: 'Emergency care while travelling' })).toBeVisible();
});

test('benefit dialog is modal, closes with Escape and restores focus', async ({ page }) => {
  const card = page.getByRole('button', { name: 'Massage therapy' });
  await card.focus();
  await card.press('Enter');

  const dialog = page.getByRole('dialog', { name: 'Massage therapy' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('open', '');
  expect(await page.evaluate(() => document.getElementById('benefit-dialog').matches(':modal'))).toBe(true);
  await expect(page).toHaveURL(/[?&]benefit=massage(?:&|$)/);

  await page.keyboard.press('Escape');

  await expect(dialog).toBeHidden();
  await expect(page).not.toHaveURL(/benefit=/);
  await expect(card).toBeFocused();
});

test('deep link opens the benefit with its shared-limit wording', async ({ page }) => {
  await page.goto('/?benefit=psychological');

  const dialog = page.getByRole('dialog', { name: 'Mental health & counselling' });
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/[?&]benefit=psychological(?:&|$)/);

  const sharedLimit = dialog
    .getByRole('definition')
    .filter({ hasText: /share ONE \$5,000 eligible-expense maximum/ });
  await expect(sharedLimit).toHaveCount(1);
  await expect(sharedLimit).toContainText('Shared limit.');
  await expect(sharedLimit).toContainText(
    /psychologists, psychotherapists, social workers and qualified counsellors share ONE \$5,000 eligible-expense maximum per calendar year/i
  );
});

test('usage tracker shows progress, persists on reload and clears', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Benefit', exact: true }).selectOption('physiotherapy');
  await page.getByLabel('Amount eligible ($)').fill('1250');
  await page.getByRole('button', { name: 'Add to my usage' }).click();

  const progressbar = page.getByRole('progressbar', {
    name: 'Physiotherapy: 83.3% of the eligible limit used'
  });
  await expect(progressbar).toBeVisible();
  await expect(progressbar).toHaveAttribute('aria-valuemin', '0');
  await expect(progressbar).toHaveAttribute('aria-valuemax', '100');
  await expect(progressbar).toHaveAttribute('aria-valuenow', '83.3');
  await expect(page.getByRole('definition').filter({ hasText: '$250.00' })).toHaveCount(1);

  await page.reload();

  await expect(page.getByRole('progressbar', {
    name: 'Physiotherapy: 83.3% of the eligible limit used'
  })).toBeVisible();
  await expect(page.getByRole('definition').filter({ hasText: '$250.00' })).toHaveCount(1);

  let confirmMessage = '';
  page.once('dialog', async dialog => {
    expect(dialog.type()).toBe('confirm');
    confirmMessage = dialog.message();
    await dialog.accept();
  });
  await page.getByRole('button', { name: 'Clear all my entries' }).click();
  expect(confirmMessage).toContain('Remove all tracked usage');

  await expect(page.getByRole('progressbar')).toHaveCount(0);
  await expect(page.getByText('No entries yet. Add a claim to start tracking.')).toBeVisible();
  await expect(page.getByText(/Your tracked benefits will appear here/)).toBeVisible();
});

test('claim routing table names the right administrator for travel and Comprehensive rules', async ({ page }) => {
  const table = page.locator('#claim-help').getByRole('table');
  await expect(table).toBeVisible();
  await expect(table.getByRole('row')).toHaveCount(6);

  await expect(table.getByRole('row', {
    name: /Supplementary.*Outside your province or territory.*Travel emergency.*MSH International/
  })).toBeVisible();
  await expect(table.getByRole('row', {
    name: /Comprehensive.*Outside Canada.*Any claim.*MSH International/
  })).toBeVisible();
  await expect(table.getByRole('row', {
    name: /Comprehensive.*In Canada, including a visit.*Any claim.*Canada Life/
  })).toBeVisible();
});

test('usage can be saved to a JSON file and loaded back', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Benefit', exact: true }).selectOption('massage');
  await page.getByLabel('Amount eligible ($)').fill('200');
  await page.getByRole('button', { name: 'Add to my usage' }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save to file' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^benefit-atlas-usage-\d{4}-\d{2}-\d{2}\.json$/);

  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8');
  const backup = JSON.parse(text);
  expect(backup.format).toBe('pshcp-usage');
  expect(backup.entries).toEqual([{ benefit: 'massage', title: 'Massage therapy', eligible: 200 }]);
  expect(Object.keys(backup).sort()).toEqual(['app', 'entries', 'exportedAt', 'format', 'note', 'version']);
  expect(JSON.stringify(backup.entries)).not.toMatch(/memberId|planNumber|certificate|plan number/i);

  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Clear all my entries' }).click();
  await expect(page.getByText('No entries yet. Add a claim to start tracking.')).toBeVisible();

  await page.locator('#usage-file').setInputFiles({
    name: 'usage.json',
    mimeType: 'application/json',
    buffer: Buffer.from(text)
  });
  await expect(page.getByRole('progressbar', {
    name: 'Massage therapy: 40% of the eligible limit used'
  })).toBeVisible();
  await expect(page.locator('#usage-file-status')).toHaveText('Loaded 1 benefit from file.');

  await page.locator('#usage-file').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('not json')
  });
  await expect(page.locator('#usage-file-status')).toHaveText('That file is not valid JSON.');
  await expect(page.getByRole('progressbar', {
    name: 'Massage therapy: 40% of the eligible limit used'
  })).toBeVisible();
});
