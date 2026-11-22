/** Benefit Atlas v2: straightforward browsing, keyboard-accessible details and local estimates. */
(function () {
  'use strict';
  const { benefits, categories, source } = window.PSHCP_DATA;
  const { filterBenefits, computeIllustration, isOddCycleYear, formatCurrency } = window.PSHCP_LOGIC;
  const state = { search: '', category: 'all', coverage: 'supplementary', sort: 'featured', visible: 9 };
  const byId = new Map(benefits.map(benefit => [benefit.id, benefit]));
  const catById = new Map(categories.map(category => [category.id, category]));
  const nodes = {
    search: document.getElementById('benefit-search'),
    filters: document.getElementById('category-list'),
    grid: document.getElementById('benefit-grid'),
    count: document.getElementById('result-count'),
    empty: document.getElementById('empty-state'),
    load: document.getElementById('load-more'),
    reset: document.getElementById('reset-filters'),
    dialog: document.getElementById('benefit-dialog'),
    detail: document.getElementById('dialog-content'),
    coverageNote: document.getElementById('coverage-explainer')
  };
  let previousFocus = null;
  const number = new Intl.NumberFormat('en-CA');
  const escapeHTML = value => String(value).replace(/[&<>"']/g, match => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[match]));

  function getMatches() {
    const filtered = filterBenefits(benefits, state).slice();
    if (state.sort === 'az') return filtered.sort((a, b) => a.title.localeCompare(b.title, 'en-CA'));
    return filtered.sort((a, b) => Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title, 'en-CA'));
  }
  function renderCategories() {
    nodes.filters.innerHTML = categories.map(cat => `<button type="button" class="category-button" data-category="${cat.id}" aria-pressed="${state.category === cat.id}"><span aria-hidden="true">${cat.icon}</span>${escapeHTML(cat.label)}</button>`).join('');
  }
  function card(item) {
    const category = catById.get(item.category);
    return `<article class="benefit-card"><button type="button" class="card-open" data-benefit="${item.id}" aria-label="View details for ${escapeHTML(item.title)}">
      <span class="card-top"><span class="card-category">${escapeHTML(category.label)}</span><span class="card-arrow" aria-hidden="true">↗</span></span>
      <span class="card-title">${escapeHTML(item.title)}</span>
      <span class="card-limit"><strong>${escapeHTML(item.limit)}</strong><small>${escapeHTML(item.period)}</small></span>
      <span class="card-description">${escapeHTML(item.notes)}</span>
      <span class="card-bottom"><span>${item.rate}% of eligible expenses</span><span>View details <span aria-hidden="true">→</span></span></span>
    </button></article>`;
  }
  function render() {
    renderCategories();
    const matching = getMatches();
    const shown = matching.slice(0, state.visible);
    nodes.grid.innerHTML = shown.map(card).join('');
    nodes.count.textContent = `${number.format(matching.length)} matching benefit${matching.length === 1 ? '' : 's'}` + (matching.length > shown.length ? ` · Showing ${shown.length}` : '');
    nodes.empty.hidden = matching.length !== 0;
    nodes.load.hidden = matching.length <= state.visible;
    nodes.reset.hidden = !state.search.trim() && state.category === 'all';
  }
  function resetVisible() { state.visible = 9; render(); }
  function setSearch(term) {
    state.search = term;
    nodes.search.value = term;
    state.category = 'all';
    resetVisible();
  }
  function links(item) {
    return item.pages.map(page => `<a href="${source.pdf}#page=${page}" target="_blank" rel="noopener noreferrer">Booklet page ${page} <span aria-hidden="true">↗</span></a>`).join('');
  }
  function estimateMarkup(item) {
    if (!Number.isFinite(item.eligibleExpenseCap) || item.noEstimate || item.rate !== 80) {
      return `<div class="estimate-unavailable"><strong>Want to know what your plan will pay?</strong><p>This benefit has additional rules, limits or eligibility conditions that this tool cannot estimate reliably. Review your actual coverage with Canada Life before spending.</p><a href="${source.member}" target="_blank" rel="noopener noreferrer">Check with Canada Life ↗</a></div>`;
    }
    const defaultPrice = Math.min(100, item.eligibleExpenseCap);
    const example = computeIllustration({ price: defaultPrice, alreadyUsed: 0, eligibleExpenseCap: item.eligibleExpenseCap, rate: item.rate });
    return `<section class="estimate-section" aria-labelledby="estimate-title">
      <div class="estimate-heading"><span class="section-kicker">OPTIONAL CALCULATOR</span><h3 id="estimate-title">Estimate a reimbursement</h3><p>Enter an eligible amount and any of this benefit's eligible expense limit already used. This is not linked to your claim history.</p></div>
      <div class="estimate-inputs"><label for="estimate-cost">Eligible expense amount ($)<input id="estimate-cost" type="number" min="0" step="0.01" inputmode="decimal" value="${defaultPrice}"></label><label for="estimate-used">Eligible limit already used ($)<input id="estimate-used" type="number" min="0" step="0.01" inputmode="decimal" value="0"></label></div>
      <div class="estimate-result" id="estimate-result" aria-live="polite" aria-atomic="true"><span>Illustrative PSHCP payment</span><strong id="estimate-payout">${formatCurrency(example.planPays)}</strong><small id="estimate-out-of-pocket">You would pay ${formatCurrency(example.memberPays)} of this expense.</small></div>
      <p class="estimate-disclaimer">Assumes the entered amount is eligible and within reasonable and customary charges, with no other payer and no additional restrictions. Shared limits, prior claims, and coordination of benefits may change the amount.</p>
    </section>`;
  }
  function openBenefit(id, { updateAddress = true } = {}) {
    const item = byId.get(id);
    if (!item) return;
    // A direct link can refer to a benefit outside the active coverage filter.
    const outOfScope = !item.planTypes.includes(state.coverage);
    const cycle = ['glasses', 'eye-exam'].includes(item.id) ? isOddCycleYear() : null;
    nodes.detail.innerHTML = `<span class="detail-category">${escapeHTML(catById.get(item.category).label)}</span>
      <h2 id="dialog-title">${escapeHTML(item.title)}</h2>
      <p class="detail-intro" id="dialog-intro">${escapeHTML(item.notes)}</p>
      ${outOfScope ? '<p class="scope-warning">This benefit is not shown for your selected coverage type. Verify which PSHCP coverage you have.</p>' : ''}
      <div class="detail-facts"><div><small>Maximum eligible expense / limit</small><strong>${escapeHTML(item.limit)}</strong><span>${escapeHTML(item.period)}</span></div><div><small>Standard reimbursement rate</small><strong>${item.rate}%</strong><span>Of eligible expenses, subject to conditions</span></div></div>
      <section class="detail-section"><h3>What to check before spending</h3><p>${escapeHTML(item.docs)}</p>${item.combined ? '<p><strong>Shared limit:</strong> Several eligible services draw from this same maximum. Check the total already used.</p>' : ''}${cycle ? `<p><strong>Current two-calendar-year period:</strong> ${cycle.firstYear}–${cycle.lastYear}, not a rolling 24 months.</p>` : ''}</section>
      ${estimateMarkup(item)}
      <section class="detail-sources"><h3>Check the original source</h3><p>Member booklet, November 2026. The Directive applies if the two documents differ.</p><div class="detail-links">${links(item)}</div></section>
      <div class="detail-actions"><a href="${source.member}" target="_blank" rel="noopener noreferrer" class="member-link">Check my coverage at Canada Life ↗</a><button type="button" id="share-benefit" class="share-button">Copy benefit link</button></div>
      <p class="detail-footer-note">Information only. No live benefit balance or eligibility verification.</p>`;
    previousFocus = document.activeElement;
    if (!nodes.dialog.open) nodes.dialog.showModal();
    nodes.dialog.querySelector('.dialog-scroll').scrollTop = 0;
    nodes.dialog.querySelector('.dialog-close').focus();
    nodes.dialog.dataset.benefitId = id;
    if (updateAddress) {
      const url = new URL(window.location.href);
      url.searchParams.set('benefit', id);
      history.replaceState(null, '', url);
    }
  }
  function closeBenefit() {
    nodes.dialog.close();
    const url = new URL(window.location.href);
    url.searchParams.delete('benefit');
    history.replaceState(null, '', url);
  }
  function updateEstimate() {
    const item = byId.get(nodes.dialog.dataset.benefitId);
    if (!item || !document.getElementById('estimate-payout')) return;
    const price = document.getElementById('estimate-cost').valueAsNumber;
    const alreadyUsed = document.getElementById('estimate-used').valueAsNumber;
    const result = computeIllustration({price, alreadyUsed, eligibleExpenseCap:item.eligibleExpenseCap, rate:item.rate});
    document.getElementById('estimate-payout').textContent = result ? formatCurrency(result.planPays) : '—';
    document.getElementById('estimate-out-of-pocket').textContent = result ? `You would pay ${formatCurrency(result.memberPays)} of this expense.` : 'Enter valid, non-negative amounts.';
  }

  nodes.search.addEventListener('input', e => {state.search = e.target.value; resetVisible();});
  nodes.search.addEventListener('keydown', event => {
    if (event.key === 'Enter') document.getElementById('explore').scrollIntoView({behavior:'smooth'});
  });
  nodes.filters.addEventListener('click', event => {
    const selected = event.target.closest('[data-category]');
    if (!selected) return;
    state.category = selected.dataset.category;
    resetVisible();
  });
  document.querySelectorAll('input[name="coverage"]').forEach(input => input.addEventListener('change', event => {
    if (!event.target.checked) return;
    state.coverage = event.target.value;
    nodes.coverageNote.textContent = state.coverage === 'supplementary'
      ? 'Supplementary Coverage generally applies when you have provincial or territorial health insurance.'
      : 'Comprehensive Coverage generally applies to eligible members outside Canada without provincial or territorial insurance.';
    resetVisible();
  }));
  document.getElementById('benefit-sort').addEventListener('change', event => { state.sort = event.target.value; resetVisible(); });
  nodes.grid.addEventListener('click', event => {
    const selected = event.target.closest('[data-benefit]');
    if (selected) openBenefit(selected.dataset.benefit);
  });
  document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => openBenefit(button.dataset.open)));
  nodes.load.addEventListener('click', () => {
    const previous = state.visible;
    state.visible += 9;
    render();
    const buttons = nodes.grid.querySelectorAll('[data-benefit]');
    buttons[previous]?.focus({preventScroll:true});
  });
  function clearFilters() { setSearch(''); nodes.search.focus(); }
  nodes.reset.addEventListener('click', clearFilters);
  document.getElementById('clear-filters').addEventListener('click', clearFilters);
  document.getElementById('close-dialog').addEventListener('click', closeBenefit);
  nodes.dialog.addEventListener('click', event => { if (event.target === nodes.dialog) closeBenefit(); });
  nodes.dialog.addEventListener('close', () => {
    // Escape is handled natively by <dialog>, but should clear the deep link too.
    if (new URL(window.location.href).searchParams.has('benefit')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('benefit');
      history.replaceState(null, '', url);
    }
    if (previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
  });
  nodes.detail.addEventListener('input', event => {
    if (event.target.matches('#estimate-cost, #estimate-used')) updateEstimate();
  });
  nodes.detail.addEventListener('click', async event => {
    if (event.target.id !== 'share-benefit') return;
    const button = event.target;
    const url = new URL(window.location.href);
    url.searchParams.set('benefit', nodes.dialog.dataset.benefitId);
    try {
      await navigator.clipboard.writeText(url.toString());
      button.textContent = 'Link copied';
    } catch {
      button.textContent = 'Copy unavailable · use address bar';
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key !== '/' || event.altKey || event.metaKey || event.ctrlKey || nodes.dialog.open) return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable) return;
    event.preventDefault();
    nodes.search.focus();
  });
  render();
  const requestedId = new URLSearchParams(window.location.search).get('benefit');
  if (requestedId && byId.has(requestedId)) openBenefit(requestedId, {updateAddress:false});
})();