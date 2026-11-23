const { test, expect } = require('./fixtures');

const searchInput = page => page.getByLabel('Search by service, item, or benefit');
const resultCards = page => page.locator('#benefit-grid').getByRole('button');

test.beforeEach(async ({ page }) => {
  // Each test starts from an empty browser store, including the usage tracker.
  await page.goto('/benefits.html');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test('home is a short entry point and links into focused pages', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'PSHCP benefit finder' })).toBeVisible();
  await expect(page.locator('#benefit-grid')).toHaveCount(0);
  await expect(page.locator('#usage-form')).toHaveCount(0);
  await expect(page.locator('#finder-form')).toHaveCount(0);

  await page.getByRole('navigation').getByRole('link', { name: 'Benefits' }).click();
  await expect(page).toHaveURL(/\/benefits\.html$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Browse benefits' })).toBeVisible();
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Benefits' })).toHaveAttribute('aria-current', 'page');
});

test('popular shortcuts open a benefit on the directory page', async ({ page }) => {
  await page.goto('/');
  await page.locator('.quick-searches').getByRole('link', { name: 'Glasses' }).click();

  await expect(page).toHaveURL(/benefits\.html\?benefit=glasses/);
  await expect(page.getByRole('dialog', { name: 'Glasses & contact lenses' })).toBeVisible();
});

test('old home deep links still reach the benefit panel', async ({ page }) => {
  await page.goto('/?benefit=massage');

  await expect(page).toHaveURL(/benefits\.html\?benefit=massage/);
  await expect(page.getByRole('dialog', { name: 'Massage therapy' })).toBeVisible();
});

test('search tolerates a typo and ranks the named benefit first', async ({ page }) => {
  await searchInput(page).fill('massge');

  await expect(resultCards(page).first()).toHaveAccessibleName('Massage therapy');
});

test('no-match search recovers through the issue finder', async ({ page }) => {
  await searchInput(page).fill('sore feet');

  await expect(page.getByRole('heading', { name: 'No match for “sore feet”' })).toBeVisible();
  const tryIssue = page.getByRole('link', { name: 'Try Search by issue' });
  await expect(tryIssue).toBeVisible();
  await tryIssue.click();

  await expect(page).toHaveURL(/finder\.html\?q=sore(?:\+|%20)feet/);
  const issueInput = page.getByLabel('Describe what you need help with');
  await expect(issueInput).toHaveValue('sore feet');

  const results = page.locator('#finder-results');
  await expect(results.getByRole('heading', { name: 'Foot pain or foot support' })).toBeVisible();
  await expect(results.getByRole('button', { name: /^View details for / })).toHaveCount(3);

  for (const title of ['Podiatry & chiropody', 'Custom orthotics', 'Orthopaedic shoes']) {
    await expect(results.getByRole('heading', { name: title })).toBeVisible();
  }
});

test('finder results are shareable through the q parameter', async ({ page }) => {
  await page.goto('/finder.html?q=back+pain');

  const results = page.locator('#finder-results');
  await expect(results.getByRole('heading', { name: 'Back, neck or muscle pain' })).toBeVisible();
  await expect(page.getByLabel('Describe what you need help with')).toHaveValue('back pain');
  await expect(results.getByRole('heading', { name: 'Physiotherapy' })).toBeVisible();
});

test('coverage switch adds and removes supplementary-only travel cover', async ({ page }) => {
  const travelEmergency = page.locator('#benefit-grid').getByRole('button', { name: 'Emergency care while travelling' });
  await expect(travelEmergency).toBeVisible();

  await page.getByRole('radio', { name: 'Comprehensive' }).check();
  await expect(page.locator('#benefit-grid').getByRole('button', { name: 'Emergency care while travelling' })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole('radio', { name: 'Comprehensive' })).toBeChecked();

  await page.getByRole('radio', { name: 'Supplementary' }).check();
  await expect(travelEmergency).toBeVisible();
});

test('benefit dialog is modal, closes with Escape and restores focus', async ({ page }) => {
  const card = page.locator('#benefit-grid').getByRole('button', { name: 'Massage therapy' });
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
  await page.goto('/benefits.html?benefit=psychological');

  const dialog = page.getByRole('dialog', { name: 'Mental health & counselling' });
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/[?&]benefit=psychological(?:&|$)/);

  const sharedLimit = dialog
    .getByRole('definition')
    .filter({ hasText: /share ONE \$5,000 eligible-expense maximum/ });
  await expect(sharedLimit).toHaveCount(1);
  await expect(sharedLimit).toContainText('Shared limit.');
});

test('usage tracker shows progress, persists on reload and clears', async ({ page }) => {
  await page.goto('/usage.html');
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

test('tracking link opens the tracker with the benefit preselected', async ({ page }) => {
  await page.goto('/benefits.html?benefit=physiotherapy');
  await page.getByRole('link', { name: 'Track what I’ve used' }).click();

  await expect(page).toHaveURL(/usage\.html\?benefit=physiotherapy/);
  await expect(page.getByRole('combobox', { name: 'Benefit', exact: true })).toHaveValue('physiotherapy');
});

test('claim routing table names the right administrator for travel and Comprehensive rules', async ({ page }) => {
  await page.goto('/claims.html');
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

test('practitioner guide explains physiotherapy versus massage and opens details', async ({ page }) => {
  await page.goto('/practitioners.html');
  await expect(page.getByRole('heading', { level: 1, name: 'Which practitioner?' })).toBeVisible();
  await expect(page.getByRole('row')).toHaveCount(15);

  const physiotherapy = page.getByRole('row', { name: /Physiotherapy/ });
  const massage = page.getByRole('row', { name: /Massage therapy/ });
  await expect(physiotherapy).toContainText('$1,500');
  await expect(physiotherapy).toContainText('Separate');
  await expect(massage).toContainText('$500');
  await expect(physiotherapy).toContainText(/assess how your body moves/i);
  await expect(massage).toContainText(/muscles and soft tissues/i);

  await physiotherapy.getByRole('button', { name: 'Physiotherapy' }).click();
  const dialog = page.getByRole('dialog', { name: 'Physiotherapy' });
  await expect(dialog).toContainText('What this provider generally does');
  await expect(dialog).toContainText(/exercise, hands-on treatment and education/i);
  await expect(dialog).toContainText(/not medical advice/i);
});

test('usage can be saved to a JSON file and loaded back', async ({ page }) => {
  await page.goto('/usage.html');
  await page.getByRole('combobox', { name: 'Benefit', exact: true }).selectOption('massage');
  await page.getByLabel('Amount eligible ($)').fill('200');
  await page.getByRole('button', { name: 'Add to my usage' }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save backup (JSON)' }).click();
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

test('usage can be saved as CSV and loaded back', async ({ page }) => {
  await page.goto('/usage.html');
  await page.getByRole('combobox', { name: 'Benefit', exact: true }).selectOption('footcare');
  await page.getByLabel('Amount eligible ($)').fill('125');
  await page.getByRole('button', { name: 'Add to my usage' }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save spreadsheet (CSV)' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^benefit-atlas-usage-\d{4}-\d{2}-\d{2}\.csv$/);

  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8');
  expect(text).toContain('benefit,title,eligible');
  expect(text).toContain('footcare,Podiatry & chiropody,125.00');

  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Clear all my entries' }).click();
  await expect(page.getByText('No entries yet. Add a claim to start tracking.')).toBeVisible();

  await page.locator('#usage-file').setInputFiles({
    name: 'usage.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(text)
  });
  await expect(page.getByRole('progressbar', {
    name: 'Podiatry & chiropody: 25% of the eligible limit used'
  })).toBeVisible();
  await expect(page.locator('#usage-file-status')).toHaveText('Loaded 1 benefit from file.');
});
