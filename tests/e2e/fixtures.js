const { test: base, expect } = require('@playwright/test');

/**
 * Fails every test that produces an uncaught page error or a console error.
 * The listener is installed before the first navigation, so load-time errors count.
 */
const test = base.extend({
  consoleErrors: [
    async ({ page }, use) => {
      const errors = [];
      page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
      page.on('console', message => {
        if (message.type() === 'error') errors.push(`console.error: ${message.text()}`);
      });

      await use(errors);

      expect(errors, 'uncaught page errors or console errors').toEqual([]);
    },
    { auto: true }
  ]
});

module.exports = { test, expect };
