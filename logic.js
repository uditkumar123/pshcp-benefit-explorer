/** Pure business logic separated from the UI for inspectable tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PSHCP_LOGIC = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function normalize(value) {
    return String(value || '').toLocaleLowerCase('en-CA').normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  }
  function filterBenefits(data, { search = '', category = 'all', coverage = 'supplementary' } = {}) {
    const tokens = normalize(search).trim().split(/\s+/).filter(Boolean);
    return data.filter(item => {
      if (category !== 'all' && item.category !== category) return false;
      if (!item.planTypes.includes(coverage)) return false;
      const haystack = normalize([item.title,item.limit,item.period,item.notes,item.searchable,item.docs].join(' '));
      return tokens.every(token => haystack.includes(token));
    });
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
  function isOddCycleYear(date = new Date()) {
    const year = date.getFullYear();
    return { firstYear: year % 2 ? year : year - 1, lastYear: year % 2 ? year + 1 : year };
  }
  function formatCurrency(number) {
    return new Intl.NumberFormat('en-CA', {style:'currency', currency:'CAD', maximumFractionDigits:2}).format(number);
  }
  return { normalize, filterBenefits, computeIllustration, isOddCycleYear, formatCurrency };
});
