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

  /** Portable, human-readable backup. Contains benefit ids and amounts only. */
  function createUsageExport(usage, items, date = new Date()) {
    const byId = new Map(items.map(item => [item.id, item]));
    const entries = Object.entries(usage)
      .filter(([id, value]) => byId.has(id) && Number.isFinite(value) && value > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, value]) => ({ benefit: id, title: byId.get(id).title, eligible: Math.round(value * 100) / 100 }));
    return {
      app: 'Benefit Atlas',
      format: USAGE_FORMAT,
      version: USAGE_VERSION,
      exportedAt: date.toISOString(),
      note: 'Your own eligible-expense notes for the PSHCP usage tracker. Not an official PSHCP balance. No plan, member or claim identifiers are included.',
      entries
    };
  }

  /** Strictly validates an imported file; never trusts titles or other display fields. */
  function readUsageExport(text, items) {
    const byId = new Map(items.map(item => [item.id, item]));
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
      const id = entry && typeof entry.benefit === 'string' ? entry.benefit : '';
      const value = entry ? Number(entry.eligible) : Number.NaN;
      if (!byId.has(id) || !Number.isFinite(value) || value <= 0 || value > MAX_USAGE_AMOUNT) {
        skipped += 1;
        continue;
      }
      entries[id] = Math.round(((entries[id] || 0) + value) * 100) / 100;
    }
    if (!Object.keys(entries).length) {
      return { ok: false, entries: {}, skipped, message: 'No usable benefit amounts were found in that file.' };
    }
    return { ok: true, entries, skipped, message: '' };
  }

  function isOddCycleYear(date = new Date()) {
    const year = date.getFullYear();
    return { firstYear: year % 2 ? year : year - 1, lastYear: year % 2 ? year + 1 : year };
  }

  function formatCurrency(number) {
    return new Intl.NumberFormat('en-CA', {style:'currency', currency:'CAD', maximumFractionDigits:2}).format(number);
  }

  return { normalize, editDistance, filterBenefits, rankBenefits, computeIllustration, usageSummary, createUsageExport, readUsageExport, claimRoute, claimDestinations, isOddCycleYear, formatCurrency };
});
