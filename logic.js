/** Pure business logic separated from the UI for inspectable tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PSHCP_LOGIC = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function normalize(value) {
    return String(value || '').toLocaleLowerCase('en-CA').normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  }

  /** Bounded Levenshtein distance, used only to forgive small typos. */
  function editDistance(a, b) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > 2) return 3;
    let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let row = 1; row <= a.length; row += 1) {
      const current = [row];
      for (let column = 1; column <= b.length; column += 1) {
        const cost = a[row - 1] === b[column - 1] ? 0 : 1;
        current[column] = Math.min(previous[column] + 1, current[column - 1] + 1, previous[column - 1] + cost);
      }
      previous = current;
    }
    return previous[b.length];
  }

  const words = value => normalize(value).split(/[^a-z0-9]+/).filter(Boolean);
  const textCache = new WeakMap();

  /** Normalized, word-level view of a benefit so every keystroke does not re-split it. */
  function searchText(item) {
    if (!textCache.has(item)) {
      const title = normalize(item.title);
      const aliases = normalize(item.searchable);
      const rest = normalize([item.limit, item.period, item.notes, item.docs].join(' '));
      textCache.set(item, {
        title, aliases, rest,
        titleWords: words(title),
        aliasWords: words(aliases),
        restWords: words(rest)
      });
    }
    return textCache.get(item);
  }

  /** 0 means "no match". Higher scores mean a more direct name or alias match. */
  function tokenScore(token, item) {
    const text = searchText(item);
    if (text.title === token) return 200;
    if (text.titleWords.includes(token)) return 120;
    if (text.title.includes(token)) return 90;
    if (text.aliasWords.includes(token)) return 70;
    if (text.aliases.includes(token)) return 55;
    if (text.restWords.includes(token)) return 30;

    const allowance = token.length >= 8 ? 2 : token.length >= 5 ? 1 : 0;
    if (!allowance) return 0;
    for (const candidate of [...text.titleWords, ...text.aliasWords]) {
      if (candidate.length < 4 || Math.abs(candidate.length - token.length) > allowance) continue;
      const distance = editDistance(token, candidate);
      if (distance <= allowance) return distance === 1 ? 45 : 38;
    }
    return 0;
  }

  function scoreBenefit(item, tokens) {
    let total = 0;
    for (const token of tokens) {
      const score = tokenScore(token, item);
      if (!score) return 0;
      total += score;
    }
    return total;
  }

  const searchTokens = search => normalize(search).trim().split(/\s+/).filter(Boolean);

  function filterBenefits(data, { search = '', category = 'all', coverage = 'supplementary' } = {}) {
    const tokens = searchTokens(search);
    return data.filter(item => {
      if (category !== 'all' && item.category !== category) return false;
      if (!item.planTypes.includes(coverage)) return false;
      return tokens.every(token => tokenScore(token, item) > 0);
    });
  }

  /**
   * Ordered results: best name/alias match first, then popular, then A–Z.
   * Choosing A–Z still wins when the visitor asks for it.
   */
  function rankBenefits(data, { search = '', category = 'all', coverage = 'supplementary', sort = 'featured' } = {}) {
    const tokens = searchTokens(search);
    const scored = filterBenefits(data, { search, category, coverage }).map(item => ({
      item,
      score: tokens.length ? scoreBenefit(item, tokens) : 0
    }));
    const byTitle = (a, b) => a.item.title.localeCompare(b.item.title, 'en-CA');
    scored.sort((a, b) => {
      if (sort === 'az') return byTitle(a, b);
      if (b.score !== a.score) return b.score - a.score;
      return Number(b.item.featured) - Number(a.item.featured) || byTitle(a, b);
    });
    return scored.map(entry => entry.item);
  }

  function computeIllustration({ price, alreadyUsed = 0, eligibleExpenseCap, rate = 80 }) {
    if (![price, alreadyUsed, eligibleExpenseCap, rate].every(v => Number.isFinite(v))) return null;
    if (price < 0 || alreadyUsed < 0 || eligibleExpenseCap < 0 || rate < 0 || rate > 100) return null;
    const remainingEligible = Math.max(0, eligibleExpenseCap - alreadyUsed);
    const claimEligible = Math.min(price, remainingEligible);
    const planPays = Math.round(claimEligible * rate) / 100;
    const memberPays = Math.round((price - planPays) * 100) / 100;
    return { remainingEligible, claimEligible, planPays, memberPays };
  }

  const claimDestinations = {
    'canada-life': {
      key: 'canada-life',
      provider: 'Canada Life',
      url: 'https://www.canadalife.com/pshcp',
      detail: 'Non-emergency claims, including expenses incurred in Canada and, for Supplementary Coverage, non-emergency expenses incurred outside Canada.'
    },
    'msh-emergency': {
      key: 'msh-emergency',
      provider: 'MSH International',
      url: 'https://pshcp-msh.ca/',
      detail: 'Emergency travel assistance claims for Supplementary Coverage. For urgent help, call MSH’s 24-hour line before or while receiving care.'
    },
    'msh-comprehensive': {
      key: 'msh-comprehensive',
      provider: 'MSH International',
      url: 'https://pshcp-msh.ca/',
      detail: 'Claims for expenses incurred outside Canada under Comprehensive Coverage. Expenses incurred while visiting Canada go to Canada Life instead.'
    }
  };

  /** Which administrator receives a claim, given the benefit and the selected coverage. */
  function claimRoute(item, coverage = 'supplementary') {
    const key = item.submit
      || (item.planTypes.length === 1 && item.planTypes[0] === 'comprehensive' ? 'msh-comprehensive' : 'canada-life');
    return { ...claimDestinations[key], coverage };
  }

  function usageSummary(used, eligibleExpenseCap, rate = 80) {
    if (![used, eligibleExpenseCap, rate].every(Number.isFinite) || used < 0 || eligibleExpenseCap <= 0) return null;
    const remaining = Math.max(0, eligibleExpenseCap - used);
    const overBy = Math.max(0, used - eligibleExpenseCap);
    const percent = Math.min(100, Math.round((used / eligibleExpenseCap) * 1000) / 10);
    const availablePayout = Math.round(remaining * rate) / 100;
    return { used, cap: eligibleExpenseCap, remaining, overBy, percent, availablePayout };
  }

  const USAGE_FORMAT = 'pshcp-usage';
  const USAGE_VERSION = 1;
  const MAX_USAGE_AMOUNT = 9999999999999.99;

  const usageKey = value => normalize(value).replace(/[^a-z0-9]+/g, ' ').trim();

  /** Resolve either a benefit id or a readable title, so hand-edited CSV files still work. */
  function usageLookup(items) {
    const byId = new Map();
    const byTitle = new Map();
    for (const item of items) {
      byId.set(item.id, item);
      byTitle.set(usageKey(item.title), item);
    }
    return { byId, byTitle };
  }
  function resolveUsageBenefit(value, lookup) {
    const key = String(value ?? '').trim();
    return lookup.byId.get(key) || lookup.byTitle.get(usageKey(key)) || null;
  }
  function addUsageEntry(entries, item, value) {
    entries[item.id] = Math.round(((entries[item.id] || 0) + value) * 100) / 100;
  }
  function usageEntries(usage, lookup) {
    return Object.entries(usage)
      .filter(([id, value]) => lookup.byId.has(id) && Number.isFinite(value) && value > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, value]) => ({ benefit: id, title: lookup.byId.get(id).title, eligible: Math.round(value * 100) / 100 }));
  }

  /** Portable, human-readable JSON backup. Contains benefit ids and amounts only. */
  function createUsageExport(usage, items, date = new Date()) {
    return {
      app: 'Benefit Atlas',
      format: USAGE_FORMAT,
      version: USAGE_VERSION,
      exportedAt: date.toISOString(),
      note: 'Your own eligible-expense notes for the PSHCP usage tracker. Not an official PSHCP balance. No plan, member or claim identifiers are included.',
      entries: usageEntries(usage, usageLookup(items))
    };
  }

  function csvField(value) {
    const text = String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  /** Spreadsheet-friendly export: benefit id, readable title, eligible amount. */
  function createUsageCsv(usage, items) {
    const rows = [['benefit', 'title', 'eligible']];
    for (const entry of usageEntries(usage, usageLookup(items))) {
      rows.push([entry.benefit, entry.title, entry.eligible.toFixed(2)]);
    }
    return `${rows.map(row => row.map(csvField).join(',')).join('\r\n')}\r\n`;
  }

  /** Small RFC 4180-style parser: quotes, escaped quotes, CRLF and a BOM are supported. */
  function parseCsv(text) {
    const input = String(text).replace(/^\uFEFF/, '');
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    for (let index = 0; index < input.length; index += 1) {
      const char = input[index];
      if (quoted) {
        if (char === '"' && input[index + 1] === '"') {
          field += '"';
          index += 1;
        } else if (char === '"') {
          quoted = false;
        } else {
          field += char;
        }
      } else if (char === '"') {
        quoted = true;
      } else if (char === ',') {
        row.push(field);
        field = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && input[index + 1] === '\n') index += 1;
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += char;
      }
    }
    if (field.length || row.length) {
      row.push(field);
      rows.push(row);
    }
    return rows.filter(cells => cells.some(cell => cell.trim() !== ''));
  }

  function readUsageCsv(text, items) {
    const lookup = usageLookup(items);
    const rows = parseCsv(text);
    if (!rows.length) return { ok: false, entries: {}, skipped: 0, message: 'That file is empty.' };
    const header = rows[0].map(cell => normalize(cell).trim());
    const idColumn = header.findIndex(cell => ['benefit', 'benefit id', 'id'].includes(cell));
    const amountColumn = header.findIndex(cell => ['eligible', 'eligible amount', 'amount', 'amount eligible'].includes(cell));
    if (idColumn === -1 || amountColumn === -1) {
      return { ok: false, entries: {}, skipped: 0, message: 'The CSV needs a “benefit” column and an “eligible” amount column.' };
    }
    const entries = {};
    let skipped = 0;
    for (const row of rows.slice(1)) {
      const item = resolveUsageBenefit(row[idColumn], lookup);
      const value = Number(String(row[amountColumn] ?? '').replace(/[$,\s]/g, ''));
      if (!item || !Number.isFinite(value) || value <= 0 || value > MAX_USAGE_AMOUNT) {
        skipped += 1;
        continue;
      }
      addUsageEntry(entries, item, value);
    }
    if (!Object.keys(entries).length) {
      return { ok: false, entries: {}, skipped, message: 'No usable benefit amounts were found in that file.' };
    }
    return { ok: true, entries, skipped, message: '' };
  }

  /** Strictly validates a JSON backup; never trusts titles or other display fields. */
  function readUsageExport(text, items) {
    const lookup = usageLookup(items);
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return { ok: false, entries: {}, skipped: 0, message: 'That file is not valid JSON.' };
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { ok: false, entries: {}, skipped: 0, message: 'Choose a Benefit Atlas usage file.' };
    }
    if (data.format !== USAGE_FORMAT) {
      return { ok: false, entries: {}, skipped: 0, message: 'This file was not created by the Benefit Atlas usage tracker.' };
    }
    if (!Array.isArray(data.entries)) {
      return { ok: false, entries: {}, skipped: 0, message: 'The file does not contain any usage entries.' };
    }
    const entries = {};
    let skipped = 0;
    for (const entry of data.entries) {
      const item = resolveUsageBenefit(entry?.benefit, lookup);
      const value = entry ? Number(entry.eligible) : Number.NaN;
      if (!item || !Number.isFinite(value) || value <= 0 || value > MAX_USAGE_AMOUNT) {
        skipped += 1;
        continue;
      }
      addUsageEntry(entries, item, value);
    }
    if (!Object.keys(entries).length) {
      return { ok: false, entries: {}, skipped, message: 'No usable benefit amounts were found in that file.' };
    }
    return { ok: true, entries, skipped, message: '' };
  }

  /** Detect JSON or CSV from the file extension, then the content, so one Load button accepts both. */
  function readUsageFile(text, items, filename = '') {
    const trimmed = String(text).replace(/^\uFEFF/, '').trimStart();
    if (!trimmed) return { ok: false, entries: {}, skipped: 0, message: 'That file is empty.' };
    const name = String(filename).toLowerCase();
    if (name.endsWith('.json')) return readUsageExport(text, items);
    if (name.endsWith('.csv')) return readUsageCsv(text, items);
    return trimmed.startsWith('{') || trimmed.startsWith('[')
      ? readUsageExport(text, items)
      : readUsageCsv(text, items);
  }

  function isOddCycleYear(date = new Date()) {
    const year = date.getFullYear();
    return { firstYear: year % 2 ? year : year - 1, lastYear: year % 2 ? year + 1 : year };
  }

  function formatCurrency(number) {
    return new Intl.NumberFormat('en-CA', {style:'currency', currency:'CAD', maximumFractionDigits:2}).format(number);
  }

  return { normalize, editDistance, filterBenefits, rankBenefits, computeIllustration, usageSummary, createUsageExport, createUsageCsv, parseCsv, readUsageExport, readUsageCsv, readUsageFile, claimRoute, claimDestinations, isOddCycleYear, formatCurrency };
});
