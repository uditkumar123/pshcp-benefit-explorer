/** Benefit Atlas v2: straightforward browsing, keyboard-accessible details and local estimates. */
(function () {
  'use strict';
  const { benefits, categories, source } = window.PSHCP_DATA;
  const { rankBenefits, computeIllustration, usageSummary, claimRoute, isOddCycleYear, formatCurrency } = window.PSHCP_LOGIC;
  const { topics, matchTopic, findTopic, sharedLimits } = window.PSHCP_GUIDE;
  const state = { search: '', category: 'all', coverage: 'supplementary', sort: 'featured', visible: 9 };
  const byId = new Map(benefits.map(benefit => [benefit.id, benefit]));
  const catById = new Map(categories.map(category => [category.id, category]));
  const nodes = {
    search: document.getElementById('benefit-search'),
    filters: document.getElementById('category-list'),
    categorySelect: document.getElementById('category-select'),
    grid: document.getElementById('benefit-grid'),
    count: document.getElementById('result-count'),
    empty: document.getElementById('empty-state'),
    load: document.getElementById('load-more'),
    reset: document.getElementById('reset-filters'),
    dialog: document.getElementById('benefit-dialog'),
    detail: document.getElementById('dialog-content'),
    coverageNote: document.getElementById('coverage-explainer'),
    usageForm: document.getElementById('usage-form'),
    usageBenefit: document.getElementById('usage-benefit'),
    usageAmount: document.getElementById('usage-amount'),
    usageError: document.getElementById('usage-error'),
    usageBoard: document.getElementById('usage-board'),
    usageSummary: document.getElementById('usage-summary'),
    usageClear: document.getElementById('usage-clear')
  };
  let previousFocus = null;
  const number = new Intl.NumberFormat('en-CA');
  const escapeHTML = value => String(value).replace(/[&<>"']/g, match => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[match]));

  function getMatches() {
    return rankBenefits(benefits, state);
  }
  const categoryIcons = {
    all: 'M3 3h5v5H3z M12 3h5v5h-5z M3 12h5v5H3z M12 12h5v5h-5z',
    therapy: 'M2 10h4l2.5-5 3 10 2.5-5H18',
    vision: 'M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5Z M12 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
    drugs: 'M5 15a3.5 3.5 0 0 1 0-5l5-5a3.5 3.5 0 1 1 5 5l-5 5a3.5 3.5 0 0 1-5 0Z M7.5 7.5l5 5',
    equipment: 'M3 6h14v11H3z M7 6V3h6v3 M10 9v5 M7.5 11.5h5',
    travel: 'M3 6h14v10H3z M7 6V3h6v3 M6 8v6 M14 8v6',
    dental: 'M10 5c-3-3-7-1-7 3 0 3 1.5 8 3.5 8 1 0 1-5 3.5-5s2.5 5 3.5 5c2 0 3.5-5 3.5-8 0-4-4-6-7-3Z'
  };
  nodes.filters.innerHTML = categories.map(cat => `<button type="button" class="category-button" data-category="${cat.id}" aria-pressed="${state.category === cat.id}"><svg class="category-icon" viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${categoryIcons[cat.id] || categoryIcons.all}"/></svg>${escapeHTML(cat.label)}</button>`).join('');
  nodes.categorySelect.innerHTML = categories.map(cat => `<option value="${escapeHTML(cat.id)}">${escapeHTML(cat.label)}</option>`).join('');
  const categoryButtons = nodes.filters.querySelectorAll('[data-category]');

  function updateCategories() {
    if (nodes.categorySelect.value !== state.category) nodes.categorySelect.value = state.category;
    for (const button of categoryButtons) {
      const pressed = String(button.dataset.category === state.category);
      if (button.getAttribute('aria-pressed') !== pressed) button.setAttribute('aria-pressed', pressed);
    }
  }
  function card(item) {
    const category = catById.get(item.category);
    return `<article class="benefit-card"><div class="card-open">
      <span class="card-top"><span class="card-category">${escapeHTML(category.label)}</span><svg class="card-chevron" viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m8 5 5 5-5 5"/></svg></span>
      <h3 class="card-title"><button type="button" class="card-title-button" data-benefit="${escapeHTML(item.id)}">${escapeHTML(item.title)}</button></h3>
      <span class="card-limit"><strong>${escapeHTML(item.limit)}</strong><small>${escapeHTML(item.period)}</small></span>
      ${cardUsage(item)}
      <span class="card-description">${escapeHTML(item.notes)}</span>
      <span class="card-bottom"><span>${item.rate}% of eligible expenses</span></span>
    </div></article>`;
  }
  function render() {
    updateCategories();
    const matching = getMatches();
    const shown = matching.slice(0, state.visible);
    nodes.grid.innerHTML = shown.map(card).join('');
    nodes.count.textContent = `${number.format(matching.length)} matching benefit${matching.length === 1 ? '' : 's'}` + (matching.length > shown.length ? ` · Showing ${shown.length}` : '');
    nodes.empty.hidden = matching.length !== 0;
    const query = state.search.trim();
    document.getElementById('empty-title').textContent = query ? `No match for “${query}”` : 'No matches found';
    document.getElementById('empty-message').textContent = query
      ? 'Try a shorter word, browse all categories, or describe the concern in your own words in Search by issue.'
      : 'Try a different search or browse all categories.';
    document.getElementById('try-issue').hidden = !query;
    nodes.load.hidden = matching.length <= state.visible;
    nodes.reset.hidden = !query && state.category === 'all';
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
  const estimateFields = [
    { id: 'estimate-cost', label: 'Eligible expense amount' },
    { id: 'estimate-used', label: 'Eligible limit already used' }
  ];
  // Keep entered amounts within a magnitude where numbers can distinguish cents.
  const maxEstimateAmount = 9999999999999.99;

  function estimateMarkup(item) {
    if (!Number.isFinite(item.eligibleExpenseCap) || item.noEstimate || item.rate !== 80) {
      return `<div class="estimate-unavailable"><strong>Estimate not available</strong><p>This benefit has additional rules, limits or eligibility conditions that this tool cannot estimate reliably. Review your actual coverage with Canada Life before spending.</p><a href="${source.member}" target="_blank" rel="noopener noreferrer">Check with Canada Life <span aria-hidden="true">↗</span></a></div>`;
    }
    const defaultPrice = Math.min(100, item.eligibleExpenseCap);
    const example = computeIllustration({ price: defaultPrice, alreadyUsed: 0, eligibleExpenseCap: item.eligibleExpenseCap, rate: item.rate });
    return `<section class="estimate-section" aria-labelledby="estimate-title">
      <div class="estimate-heading"><h3 id="estimate-title">Reimbursement estimate</h3><p>Enter an eligible expense and how much of the eligible expense limit you’ve already used. This is not linked to your claim history.</p></div>
      <div class="estimate-inputs">${estimateFields.map(({id, label}, index) => `<div><label for="${id}">${label} ($)</label><input id="${id}" type="number" min="0" max="${maxEstimateAmount}" step="0.01" inputmode="decimal" required value="${index === 0 ? defaultPrice : 0}"><small id="${id}-error" class="estimate-error" hidden></small></div>`).join('')}</div>
      <div class="estimate-result" id="estimate-result" aria-live="polite" aria-atomic="true"><span>Illustrative PSHCP payment</span><strong id="estimate-payout">${formatCurrency(example.planPays)}</strong><small id="estimate-out-of-pocket">You would pay ${formatCurrency(example.memberPays)} of this expense.</small></div>
      <p class="estimate-disclaimer">Assumes the entered amount is eligible and within reasonable and customary charges, with no other payer and no additional restrictions. Shared limits, prior claims, and coordination of benefits may change the amount.</p>
    </section>`;
  }
  function claimRouteMarkup(item) {
    const route = claimRoute(item, state.coverage);
    return `<strong>${escapeHTML(route.provider)}</strong>. ${escapeHTML(route.detail)} <a href="${route.url}" target="_blank" rel="noopener noreferrer">Open the ${escapeHTML(route.provider)} portal <span aria-hidden="true">↗</span></a>`;
  }
  function beforeYouSpend(item) {
    const shared = item.combined ? sharedLimits[item.combined] : null;
    const cycle = ['glasses', 'eye-exam'].includes(item.id) ? isOddCycleYear() : null;
    const scope = shared
      ? `<strong>Shared limit.</strong> ${escapeHTML(shared)} Claims from every included provider type count against the same pool.`
      : `<strong>Separate limit.</strong> Other listed benefits have their own limits, so spending on this one does not use them up.${['chiropractor', 'osteopathy'].includes(item.id) ? ' Eligible X-rays count toward the same annual practitioner limit as treatment, not a separate allowance.' : ''}`;
    const resets = cycle
      ? `${escapeHTML(item.period)}. The current period is ${cycle.firstYear}–${cycle.lastYear}, not a rolling 24 months.`
      : escapeHTML(item.period);
    return `<section class="detail-before" aria-labelledby="before-title">
      <h3 id="before-title">Before you spend</h3>
      <dl class="before-list">
        <div><dt>How the limit works</dt><dd>${scope}</dd></div>
        <div><dt>When it resets</dt><dd>${resets}</dd></div>
        <div><dt>What you need</dt><dd>${escapeHTML(item.docs)}</dd></div>
        <div><dt>Where the claim goes</dt><dd>${claimRouteMarkup(item)}</dd></div>
      </dl>
      <p class="before-note">The amount shown is a maximum eligible expense, not a guaranteed payment.${item.rate === 80 ? ' At 80%, a $100 eligible expense would normally reimburse up to $80.' : ''}</p>
    </section>`;
  }
  function openBenefit(id, { updateAddress = true } = {}) {
    const item = byId.get(id);
    if (!item) return;
    // A direct link can refer to a benefit outside the active coverage filter.
    const outOfScope = !item.planTypes.includes(state.coverage);
    const route = claimRoute(item, state.coverage);
    nodes.detail.innerHTML = `<span class="detail-category">${escapeHTML(catById.get(item.category).label)}</span>
      <h2 id="dialog-title">${escapeHTML(item.title)}</h2>
      <p class="detail-intro" id="dialog-intro">${escapeHTML(item.notes)}</p>
      ${outOfScope ? '<p class="scope-warning">This benefit is not shown for your selected coverage type. Verify which PSHCP coverage you have.</p>' : ''}
      <div class="detail-facts"><div><small>Maximum eligible expense / limit</small><strong>${escapeHTML(item.limit)}</strong><span>${escapeHTML(item.period)}</span></div><div><small>Standard reimbursement rate</small><strong>${item.rate}%</strong><span>Of eligible expenses, subject to conditions</span></div></div>
      ${beforeYouSpend(item)}
      ${estimateMarkup(item)}
      <section class="detail-sources"><h3>Check the original source</h3><p>Member booklet, November 2026, printed page${item.pages.length === 1 ? '' : 's'} ${item.pages.join(', ')}. Entries checked ${escapeHTML(source.updated)}. The Directive applies if the two documents differ.</p>${item.directiveRef ? `<p class="directive-ref">${escapeHTML(item.directiveRef)} also applies. Read the governing provision before relying on this summary.</p>` : ''}<div class="detail-links">${links(item)}<a href="${source.directive}" target="_blank" rel="noopener noreferrer">PSHCP Directive <span aria-hidden="true">↗</span></a></div></section>
      <div class="detail-actions"><a href="${route.url}" target="_blank" rel="noopener noreferrer" class="member-link">Verify coverage at ${escapeHTML(route.provider)} ↗</a>${Number.isFinite(item.eligibleExpenseCap) ? `<button type="button" class="track-button" data-track="${escapeHTML(item.id)}">Track what I’ve used</button>` : ''}<button type="button" id="share-benefit" class="share-button">Copy benefit link</button></div>
      <p class="detail-footer-note">Information only. No live benefit balance or eligibility verification. Content updated ${escapeHTML(source.updated)}.</p>`;
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
  function estimateInputError(input) {
    const { badInput, valueMissing, rangeUnderflow, rangeOverflow, stepMismatch } = input.validity;
    if (badInput) return 'Enter a number, such as 25.50.';
    if (valueMissing) return 'Enter an amount. Use 0 if none.';
    if (!Number.isFinite(input.valueAsNumber) || rangeOverflow) return `Enter ${formatCurrency(maxEstimateAmount)} or less.`;
    if (rangeUnderflow) return 'Enter an amount of $0 or more.';
    if (stepMismatch) return 'Enter an amount in dollars and cents, such as 25.50.';
    return '';
  }
  function updateEstimate() {
    const item = byId.get(nodes.dialog.dataset.benefitId);
    const payout = document.getElementById('estimate-payout');
    if (!item || !payout) return;

    const errors = [];
    const [price, alreadyUsed] = estimateFields.map(({id, label}) => {
      const input = document.getElementById(id);
      const error = document.getElementById(`${id}-error`);
      const message = estimateInputError(input);
      if (message) errors.push(`${label}: ${message}`);
      if (message !== error.textContent) {
        error.textContent = message;
        error.hidden = !message;
        if (message) {
          input.setAttribute('aria-invalid', 'true');
          input.setAttribute('aria-describedby', error.id);
        } else {
          input.removeAttribute('aria-invalid');
          input.removeAttribute('aria-describedby');
        }
      }
      return input.valueAsNumber;
    });

    const result = errors.length ? null : computeIllustration({price, alreadyUsed, eligibleExpenseCap:item.eligibleExpenseCap, rate:item.rate});
    const status = document.getElementById('estimate-out-of-pocket');
    const payoutText = result ? formatCurrency(result.planPays) : '—';
    const statusText = result ? `You would pay ${formatCurrency(result.memberPays)} of this expense.` : errors.join(' ');
    if (payout.textContent !== payoutText) payout.textContent = payoutText;
    if (status.textContent !== statusText) status.textContent = statusText;
  }

  const finder = {
    form: document.getElementById('finder-form'),
    input: document.getElementById('issue-input'),
    topics: document.getElementById('finder-topics'),
    region: document.getElementById('finder-results'),
    content: document.getElementById('finder-results-content')
  };
  let selectedTopicId = null;
  function renderFinderTopics() {
    finder.topics.innerHTML = topics.map(topic => `<button type="button" data-topic="${topic.id}" aria-pressed="${selectedTopicId === topic.id}">${escapeHTML(topic.label)}</button>`).join('');
  }
  function renderFinderResult(topic) {
    selectedTopicId = topic?.id ?? null;
    renderFinderTopics();
    finder.region.hidden = false;
    if (!topic) {
      finder.content.innerHTML = `<h3 id="finder-results-title" tabindex="-1">No matching topic</h3><p class="finder-no-match">Try a shorter description (such as “back pain,” “speech,” or “diabetes”), pick a topic above, or <a href="#explore">browse benefits</a>. This is not a medical symptom checker.</p>`;
    } else {
      const options = topic.benefits.map(([id,reason]) => {
        const item = byId.get(id);
        if (!item || !item.planTypes.includes(state.coverage)) return '';
        return `<article class="finder-result-card"><h4>${escapeHTML(item.title)}</h4><p>${escapeHTML(reason)}</p><div class="finder-limit">${escapeHTML(item.limit)} <small>${escapeHTML(item.period)} · maximum eligible expense / plan limit</small></div><button type="button" data-guide-benefit="${escapeHTML(id)}" aria-label="View details for ${escapeHTML(item.title)}">View details</button></article>`;
      }).filter(Boolean).join('');
      finder.content.innerHTML = `<div class="finder-results-head"><h3 id="finder-results-title" tabindex="-1">${escapeHTML(topic.label)}</h3><button type="button" class="finder-reset" id="reset-finder">Clear topic</button></div><p class="results-intro">${escapeHTML(topic.intro)} These are plan benefit categories, not approval or medical advice.</p><div class="finder-grid">${options}</div><div class="finder-note"><strong>${topic.notes.some(note=>note.toLowerCase().includes('shared')) ? 'How the limits work' : 'What to check'}</strong>${topic.notes.map(note => `<p>${escapeHTML(note)}</p>`).join('')}</div>`;
    }
    finder.region.querySelector('#finder-results-title')?.focus({preventScroll:true});
    finder.region.scrollIntoView({behavior:'smooth',block:'start'});
  }
  finder.form.addEventListener('submit', event => {
    event.preventDefault();
    renderFinderResult(matchTopic(finder.input.value));
  });
  finder.topics.addEventListener('click', event => {
    const button = event.target.closest('[data-topic]');
    if (!button) return;
    const topic = findTopic(button.dataset.topic);
    if (!topic) return;
    finder.input.value = '';
    renderFinderResult(topic);
  });
  finder.content.addEventListener('click', event => {
    const benefit = event.target.closest('[data-guide-benefit]');
    if (benefit) openBenefit(benefit.dataset.guideBenefit);
    if (event.target.closest('#reset-finder')) {
      selectedTopicId = null;
      finder.region.hidden = true;
      finder.input.value = '';
      renderFinderTopics();
      finder.input.focus();
    }
  });
  renderFinderTopics();

  const USAGE_KEY = 'pshcp-usage-v1';
  const usageBenefits = benefits
    .filter(item => Number.isFinite(item.eligibleExpenseCap))
    .sort((a, b) => a.title.localeCompare(b.title, 'en-CA'));
  let usage = loadUsage();

  function loadUsage() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(USAGE_KEY) || '{}');
      const entries = {};
      for (const [id, value] of Object.entries(parsed)) {
        if (byId.has(id) && Number.isFinite(value) && value > 0 && value <= maxEstimateAmount) entries[id] = value;
      }
      return entries;
    } catch {
      return {};
    }
  }
  function saveUsage() {
    try {
      window.localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
    } catch {
      // Storage can be unavailable (private mode, file://); tracking still works for this visit.
    }
  }
  function cardUsage(item) {
    if (!Number.isFinite(item.eligibleExpenseCap) || !usage[item.id]) return '';
    const summary = usageSummary(usage[item.id], item.eligibleExpenseCap, item.rate);
    return `<span class="card-usage"><span class="card-usage-track" aria-hidden="true"><span style="width:${summary.percent}%"></span></span><span>${summary.percent}% of limit used</span></span>`;
  }
  function usageRow(item) {
    const summary = usageSummary(usage[item.id], item.eligibleExpenseCap, item.rate);
    if (!summary) return '';
    const over = summary.overBy > 0;
    const status = over
      ? `Over the limit by ${formatCurrency(summary.overBy)}. Only ${formatCurrency(summary.cap)} can count.`
      : `${summary.percent}% of the eligible limit used.`;
    return `<article class="usage-row${over ? ' is-over' : ''}">
      <div class="usage-row-head"><div><h4>${escapeHTML(item.title)}</h4><p>${escapeHTML(item.limit)} · ${escapeHTML(item.period)}</p></div><button type="button" class="usage-remove" data-remove="${escapeHTML(item.id)}">Remove <span class="sr-only">${escapeHTML(item.title)} entries</span></button></div>
      <div class="usage-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${summary.percent}" aria-label="${escapeHTML(item.title)}: ${summary.percent}% of the eligible limit used"><span class="usage-fill${over ? ' is-over' : ''}" style="width:${summary.percent}%"></span></div>
      <p class="usage-status">${status}</p>
      <dl class="usage-figures"><div><dt>Used</dt><dd>${formatCurrency(summary.used)}</dd></div><div><dt>Remaining eligible</dt><dd>${formatCurrency(summary.remaining)}</dd></div><div><dt>Max payment left at ${item.rate}%</dt><dd>${formatCurrency(summary.availablePayout)}</dd></div></dl>
    </article>`;
  }
  function renderUsage() {
    const tracked = usageBenefits.filter(item => usage[item.id]);
    nodes.usageBoard.innerHTML = tracked.length
      ? tracked.map(usageRow).join('')
      : '<p class="usage-empty">Your tracked benefits will appear here with a progress bar, the remaining eligible amount, and what that remainder could still reimburse at the standard rate.</p>';
    nodes.usageSummary.textContent = tracked.length
      ? `${tracked.length} benefit${tracked.length === 1 ? '' : 's'} tracked · ${formatCurrency(tracked.reduce((sum, item) => sum + usage[item.id], 0))} in eligible expenses recorded.`
      : 'No entries yet. Add a claim to start tracking.';
    nodes.usageClear.hidden = tracked.length === 0;
    render();
  }
  function focusUsage(id) {
    if (usageBenefits.some(item => item.id === id)) nodes.usageBenefit.value = id;
    document.getElementById('usage').scrollIntoView({behavior:'smooth', block:'start'});
    nodes.usageAmount.focus({preventScroll:true});
  }
  nodes.usageBenefit.innerHTML = categories.filter(cat => cat.id !== 'all').map(cat => {
    const items = usageBenefits.filter(item => item.category === cat.id);
    if (!items.length) return '';
    return `<optgroup label="${escapeHTML(cat.label)}">${items.map(item => `<option value="${item.id}">${escapeHTML(item.title)} — ${escapeHTML(item.limit)}</option>`).join('')}</optgroup>`;
  }).join('');
  nodes.usageForm.addEventListener('submit', event => {
    event.preventDefault();
    const id = nodes.usageBenefit.value;
    const amount = nodes.usageAmount.valueAsNumber;
    let message = '';
    if (!byId.has(id) || !Number.isFinite(byId.get(id)?.eligibleExpenseCap)) message = 'Choose a benefit with a dollar limit.';
    else if (!Number.isFinite(amount)) message = 'Enter the eligible amount as a number, such as 125.00.';
    else if (amount <= 0) message = 'Enter an amount greater than $0.';
    else if (amount > maxEstimateAmount) message = `Enter ${formatCurrency(maxEstimateAmount)} or less.`;
    nodes.usageError.textContent = message;
    nodes.usageError.hidden = !message;
    if (message) {
      nodes.usageAmount.setAttribute('aria-invalid', 'true');
      nodes.usageAmount.focus();
      return;
    }
    nodes.usageAmount.removeAttribute('aria-invalid');
    usage[id] = Math.round(((usage[id] || 0) + amount) * 100) / 100;
    saveUsage();
    nodes.usageAmount.value = '';
    renderUsage();
    nodes.usageAmount.focus();
  });
  nodes.usageBoard.addEventListener('click', event => {
    const remove = event.target.closest('[data-remove]');
    if (!remove) return;
    delete usage[remove.dataset.remove];
    saveUsage();
    renderUsage();
    nodes.usageBenefit.focus();
  });
  nodes.usageClear.addEventListener('click', () => {
    if (!window.confirm('Remove all tracked usage from this browser?')) return;
    usage = {};
    saveUsage();
    renderUsage();
    nodes.usageBenefit.focus();
  });
  nodes.search.addEventListener('input', e => {state.search = e.target.value; resetVisible();});
  nodes.search.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.isComposing) return;
    document.getElementById('explore-title').focus({preventScroll:true});
    document.getElementById('explore').scrollIntoView();
  });
  nodes.filters.addEventListener('click', event => {
    const selected = event.target.closest('[data-category]');
    if (!selected) return;
    state.category = selected.dataset.category;
    resetVisible();
  });
  nodes.categorySelect.addEventListener('change', event => {
    state.category = event.target.value;
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
  function sendToFinder() {
    const term = state.search.trim();
    if (!term) return;
    finder.input.value = term;
    const topic = matchTopic(term);
    if (topic) {
      renderFinderResult(topic);
    } else {
      finder.region.hidden = true;
      document.getElementById('help-finder').scrollIntoView({behavior:'smooth', block:'start'});
      finder.input.focus({preventScroll:true});
    }
  }
  nodes.reset.addEventListener('click', clearFilters);
  nodes.empty.addEventListener('click', event => {
    if (event.target.closest('#clear-filters')) clearFilters();
    if (event.target.closest('#try-issue')) sendToFinder();
  });
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
    if (nodes.dialog.dataset.trackTarget) {
      const id = nodes.dialog.dataset.trackTarget;
      delete nodes.dialog.dataset.trackTarget;
      focusUsage(id);
    }
  });
  nodes.detail.addEventListener('input', event => {
    if (event.target.matches('#estimate-cost, #estimate-used')) updateEstimate();
  });
  nodes.detail.addEventListener('click', async event => {
    const track = event.target.closest('[data-track]');
    if (track) {
      nodes.dialog.dataset.trackTarget = track.dataset.track;
      closeBenefit();
      return;
    }
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
  renderUsage();
  const requestedId = new URLSearchParams(window.location.search).get('benefit');
  if (requestedId && byId.has(requestedId)) openBenefit(requestedId, {updateAddress:false});
})();
