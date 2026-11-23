/** Benefit Atlas: page-scoped UI for the directory, finder, tracker and practitioner guide. */
(function () {
  'use strict';
  const { benefits, categories, source } = window.PSHCP_DATA;
  const { rankBenefits, computeIllustration, usageSummary, createUsageExport, createUsageCsv, readUsageFile, claimRoute, isOddCycleYear, formatCurrency } = window.PSHCP_LOGIC;
  const { topics, matchTopic, findTopic, sharedLimits } = window.PSHCP_GUIDE;
  const byId = new Map(benefits.map(benefit => [benefit.id, benefit]));
  const catById = new Map(categories.map(category => [category.id, category]));
  const number = new Intl.NumberFormat('en-CA');
  const escapeHTML = value => String(value).replace(/[&<>"']/g, match => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[match]));
  // Keep entered amounts within a magnitude where numbers can distinguish cents.
  const maxEstimateAmount = 9999999999999.99;
  const COVERAGE_KEY = 'pshcp-coverage-v1';
  const USAGE_KEY = 'pshcp-usage-v1';

  function readStorage(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Storage can be unavailable (private mode, file://); the page still works for this visit.
    }
  }

  const state = {
    search: '',
    category: 'all',
    coverage: readStorage(COVERAGE_KEY) === 'comprehensive' ? 'comprehensive' : 'supplementary',
    sort: 'featured',
    visible: 9
  };

  let usage = loadUsage();
  function loadUsage() {
    try {
      const parsed = JSON.parse(readStorage(USAGE_KEY) || '{}');
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
    writeStorage(USAGE_KEY, JSON.stringify(usage));
  }

  let openBenefit = () => {};
  let refreshDirectory = () => {};

  /** Shared benefit panel, present on the pages that open a benefit. */
  function initDialog() {
    const dialog = document.getElementById('benefit-dialog');
    const detail = document.getElementById('dialog-content');
    if (!dialog || !detail) return;
    let previousFocus = null;

    const links = item => item.pages.map(page => `<a href="${source.pdf}#page=${page}" target="_blank" rel="noopener noreferrer">Booklet page ${page} <span aria-hidden="true">↗</span></a>`).join('');
    const estimateFields = [
      { id: 'estimate-cost', label: 'Eligible expense amount' },
      { id: 'estimate-used', label: 'Eligible limit already used' }
    ];

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
    openBenefit = function (id, { updateAddress = true } = {}) {
      const item = byId.get(id);
      if (!item) return;
      // A direct link can refer to a benefit outside the active coverage filter.
      const outOfScope = !item.planTypes.includes(state.coverage);
      const route = claimRoute(item, state.coverage);
      detail.innerHTML = `<span class="detail-category">${escapeHTML(catById.get(item.category).label)}</span>
        <h2 id="dialog-title">${escapeHTML(item.title)}</h2>
        <p class="detail-intro" id="dialog-intro">${escapeHTML(item.notes)}</p>
        ${outOfScope ? '<p class="scope-warning">This benefit is not shown for your selected coverage type. Verify which PSHCP coverage you have.</p>' : ''}
        <div class="detail-facts"><div><small>Maximum eligible expense / limit</small><strong>${escapeHTML(item.limit)}</strong><span>${escapeHTML(item.period)}</span></div><div><small>Standard reimbursement rate</small><strong>${item.rate}%</strong><span>Of eligible expenses, subject to conditions</span></div></div>
        ${item.whatItIs ? `<section class="detail-provider"><h3>What this provider generally does</h3><p>${escapeHTML(item.whatItIs)}</p>${item.focus ? `<p><strong>Often focuses on:</strong> ${escapeHTML(item.focus)}</p>` : ''}<p class="detail-provider-note">General description, not medical advice. Scope of practice and protected titles vary by province or territory.</p></section>` : ''}
        ${beforeYouSpend(item)}
        ${estimateMarkup(item)}
        <section class="detail-sources"><h3>Check the original source</h3><p>Member booklet, November 2026, printed page${item.pages.length === 1 ? '' : 's'} ${item.pages.join(', ')}. Entries checked ${escapeHTML(source.updated)}. The Directive applies if the two documents differ.</p>${item.directiveRef ? `<p class="directive-ref">${escapeHTML(item.directiveRef)} also applies. Read the governing provision before relying on this summary.</p>` : ''}<div class="detail-links">${links(item)}<a href="${source.directive}" target="_blank" rel="noopener noreferrer">PSHCP Directive <span aria-hidden="true">↗</span></a></div></section>
        <div class="detail-actions"><a href="${route.url}" target="_blank" rel="noopener noreferrer" class="member-link">Verify coverage at ${escapeHTML(route.provider)} ↗</a>${Number.isFinite(item.eligibleExpenseCap) ? `<a class="track-button" href="usage.html?benefit=${encodeURIComponent(item.id)}">Track what I’ve used</a>` : ''}<button type="button" id="share-benefit" class="share-button">Copy benefit link</button></div>
        <p class="detail-footer-note">Information only. No live benefit balance or eligibility verification. Content updated ${escapeHTML(source.updated)}.</p>`;
      previousFocus = document.activeElement;
      if (!dialog.open) dialog.showModal();
      detail.scrollTop = 0;
      dialog.querySelector('.dialog-close').focus();
      dialog.dataset.benefitId = id;
      if (updateAddress) {
        const url = new URL(window.location.href);
        url.searchParams.set('benefit', id);
        history.replaceState(null, '', url);
      }
    };
    function closeBenefit() {
      dialog.close();
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
      const item = byId.get(dialog.dataset.benefitId);
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

    document.getElementById('close-dialog').addEventListener('click', closeBenefit);
    dialog.addEventListener('click', event => { if (event.target === dialog) closeBenefit(); });
    dialog.addEventListener('close', () => {
      // Escape is handled natively by <dialog>, but should clear the deep link too.
      const url = new URL(window.location.href);
      if (url.searchParams.has('benefit')) {
        url.searchParams.delete('benefit');
        history.replaceState(null, '', url);
      }
      if (previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
    });
    detail.addEventListener('input', event => {
      if (event.target.matches('#estimate-cost, #estimate-used')) updateEstimate();
    });
    detail.addEventListener('click', async event => {
      if (event.target.id !== 'share-benefit') return;
      const button = event.target;
      const url = new URL(window.location.href);
      url.searchParams.set('benefit', dialog.dataset.benefitId);
      try {
        await navigator.clipboard.writeText(url.toString());
        button.textContent = 'Link copied';
      } catch {
        button.textContent = 'Copy unavailable · use address bar';
      }
    });
  }

  /** Benefit directory: filters, ranking, progressive results and deep links. */
  function initDirectory() {
    const grid = document.getElementById('benefit-grid');
    if (!grid) return;
    const nodes = {
      search: document.getElementById('benefit-search'),
      filters: document.getElementById('category-list'),
      categorySelect: document.getElementById('category-select'),
      count: document.getElementById('result-count'),
      empty: document.getElementById('empty-state'),
      emptyTitle: document.getElementById('empty-title'),
      emptyMessage: document.getElementById('empty-message'),
      tryIssue: document.getElementById('try-issue'),
      load: document.getElementById('load-more'),
      reset: document.getElementById('reset-filters'),
      sort: document.getElementById('benefit-sort')
    };
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
      const matching = rankBenefits(benefits, state);
      const shown = matching.slice(0, state.visible);
      grid.innerHTML = shown.map(card).join('');
      nodes.count.textContent = `${number.format(matching.length)} matching benefit${matching.length === 1 ? '' : 's'}` + (matching.length > shown.length ? ` · Showing ${shown.length}` : '');
      nodes.empty.hidden = matching.length !== 0;
      const query = state.search.trim();
      nodes.emptyTitle.textContent = query ? `No match for “${query}”` : 'No matches found';
      nodes.emptyMessage.textContent = query
        ? 'Try a shorter word, browse all categories, or describe the concern in your own words in Search by issue.'
        : 'Try a different search or browse all categories.';
      nodes.tryIssue.hidden = !query;
      if (query) nodes.tryIssue.href = `finder.html?q=${encodeURIComponent(query)}`;
      nodes.load.hidden = matching.length <= state.visible;
      nodes.reset.hidden = !query && state.category === 'all';
    }
    refreshDirectory = render;
    function resetVisible() { state.visible = 9; render(); }
    function setSearch(term) {
      state.search = term;
      nodes.search.value = term;
      state.category = 'all';
      resetVisible();
    }
    function updateCoverageNote() {
      const note = document.getElementById('coverage-explainer');
      if (!note) return;
      note.textContent = state.coverage === 'supplementary'
        ? 'Supplementary Coverage generally applies when you have provincial or territorial health insurance.'
        : 'Comprehensive Coverage generally applies to eligible members outside Canada without provincial or territorial insurance.';
    }
    const coverageInputs = document.querySelectorAll('input[name="coverage"]');
    for (const input of coverageInputs) {
      input.checked = input.value === state.coverage;
      input.addEventListener('change', event => {
        if (!event.target.checked) return;
        state.coverage = event.target.value;
        writeStorage(COVERAGE_KEY, state.coverage);
        updateCoverageNote();
        resetVisible();
      });
    }
    updateCoverageNote();

    nodes.search.addEventListener('input', event => { state.search = event.target.value; resetVisible(); });
    nodes.search.addEventListener('keydown', event => {
      if (event.key !== 'Enter' || event.isComposing) return;
      event.preventDefault();
      document.querySelector('.directory-results')?.scrollIntoView({behavior:'smooth', block:'start'});
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
    nodes.sort.addEventListener('change', event => { state.sort = event.target.value; resetVisible(); });
    grid.addEventListener('click', event => {
      const selected = event.target.closest('[data-benefit]');
      if (selected) openBenefit(selected.dataset.benefit);
    });
    nodes.load.addEventListener('click', () => {
      const previous = state.visible;
      state.visible += 9;
      render();
      const buttons = grid.querySelectorAll('[data-benefit]');
      buttons[previous]?.focus({preventScroll:true});
    });
    function clearFilters() { setSearch(''); nodes.search.focus(); }
    nodes.reset.addEventListener('click', clearFilters);
    nodes.empty.addEventListener('click', event => {
      if (event.target.closest('#clear-filters')) clearFilters();
    });

    const query = new URLSearchParams(window.location.search).get('q');
    if (query) {
      state.search = query;
      nodes.search.value = query;
    }
    render();
  }

  /** Plain-language issue finder with a shareable ?q= parameter. */
  function initFinder() {
    const form = document.getElementById('finder-form');
    if (!form) return;
    const finder = {
      form,
      input: document.getElementById('issue-input'),
      topics: document.getElementById('finder-topics'),
      region: document.getElementById('finder-results'),
      content: document.getElementById('finder-results-content')
    };
    let selectedTopicId = null;

    function updateQuery(term) {
      const url = new URL(window.location.href);
      if (term) url.searchParams.set('q', term);
      else url.searchParams.delete('q');
      history.replaceState(null, '', url);
    }
    function renderFinderTopics() {
      finder.topics.innerHTML = topics.map(topic => `<button type="button" data-topic="${topic.id}" aria-pressed="${selectedTopicId === topic.id}">${escapeHTML(topic.label)}</button>`).join('');
    }
    function renderFinderResult(topic, { focus = true, scroll = true } = {}) {
      selectedTopicId = topic?.id ?? null;
      renderFinderTopics();
      finder.region.hidden = false;
      if (!topic) {
        finder.content.innerHTML = `<h2 id="finder-results-title" tabindex="-1">No matching topic</h2><p class="finder-no-match">Try a shorter description (such as “back pain,” “speech,” or “diabetes”), pick a topic above, or <a href="benefits.html">browse benefits</a>. This is not a medical symptom checker.</p>`;
      } else {
        const options = topic.benefits.map(([id,reason]) => {
          const item = byId.get(id);
          if (!item || !item.planTypes.includes(state.coverage)) return '';
          return `<article class="finder-result-card"><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(reason)}</p><div class="finder-limit">${escapeHTML(item.limit)} <small>${escapeHTML(item.period)} · maximum eligible expense / plan limit</small></div><button type="button" data-guide-benefit="${escapeHTML(id)}" aria-label="View details for ${escapeHTML(item.title)}">View details</button></article>`;
        }).filter(Boolean).join('');
        finder.content.innerHTML = `<div class="finder-results-head"><h2 id="finder-results-title" tabindex="-1">${escapeHTML(topic.label)}</h2><button type="button" class="finder-reset" id="reset-finder">Clear topic</button></div><p class="results-intro">${escapeHTML(topic.intro)} These are plan benefit categories, not approval or medical advice.</p><div class="finder-grid">${options}</div><div class="finder-note"><strong>${topic.notes.some(note => note.toLowerCase().includes('shared')) ? 'How the limits work' : 'What to check'}</strong>${topic.notes.map(note => `<p>${escapeHTML(note)}</p>`).join('')}</div>`;
      }
      if (focus) finder.region.querySelector('#finder-results-title')?.focus({preventScroll:true});
      if (scroll) finder.region.scrollIntoView({behavior:'smooth', block:'start'});
    }
    form.addEventListener('submit', event => {
      event.preventDefault();
      const term = finder.input.value.trim();
      updateQuery(term);
      renderFinderResult(matchTopic(term));
    });
    finder.topics.addEventListener('click', event => {
      const button = event.target.closest('[data-topic]');
      if (!button) return;
      const topic = findTopic(button.dataset.topic);
      if (!topic) return;
      finder.input.value = '';
      updateQuery('');
      renderFinderResult(topic);
    });
    finder.content.addEventListener('click', event => {
      const benefit = event.target.closest('[data-guide-benefit]');
      if (benefit) openBenefit(benefit.dataset.guideBenefit);
      if (event.target.closest('#reset-finder')) {
        selectedTopicId = null;
        finder.region.hidden = true;
        finder.input.value = '';
        updateQuery('');
        renderFinderTopics();
        finder.input.focus();
      }
    });
    renderFinderTopics();
    const query = new URLSearchParams(window.location.search).get('q');
    if (query) {
      finder.input.value = query;
      renderFinderResult(matchTopic(query), { focus: false, scroll: false });
    }
  }

  /** Local usage tracker with JSON and CSV portability. */
  function initUsage() {
    const form = document.getElementById('usage-form');
    if (!form) return;
    const nodes = {
      form,
      benefit: document.getElementById('usage-benefit'),
      amount: document.getElementById('usage-amount'),
      error: document.getElementById('usage-error'),
      board: document.getElementById('usage-board'),
      summary: document.getElementById('usage-summary'),
      clear: document.getElementById('usage-clear'),
      exportJson: document.getElementById('usage-export'),
      exportCsv: document.getElementById('usage-export-csv'),
      importFile: document.getElementById('usage-import'),
      file: document.getElementById('usage-file'),
      status: document.getElementById('usage-file-status')
    };
    const usageBenefits = benefits
      .filter(item => Number.isFinite(item.eligibleExpenseCap))
      .sort((a, b) => a.title.localeCompare(b.title, 'en-CA'));

    function setUsageStatus(message, isError = false) {
      nodes.status.textContent = message;
      nodes.status.classList.toggle('is-error', Boolean(isError));
    }
    function usageRow(item) {
      const summary = usageSummary(usage[item.id], item.eligibleExpenseCap, item.rate);
      if (!summary) return '';
      const over = summary.overBy > 0;
      const status = over
        ? `Over the limit by ${formatCurrency(summary.overBy)}. Only ${formatCurrency(summary.cap)} can count.`
        : `${summary.percent}% of the eligible limit used.`;
      return `<article class="usage-row${over ? ' is-over' : ''}">
        <div class="usage-row-head"><div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.limit)} · ${escapeHTML(item.period)}</p></div><button type="button" class="usage-remove" data-remove="${escapeHTML(item.id)}">Remove <span class="sr-only">${escapeHTML(item.title)} entries</span></button></div>
        <div class="usage-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${summary.percent}" aria-label="${escapeHTML(item.title)}: ${summary.percent}% of the eligible limit used"><span class="usage-fill${over ? ' is-over' : ''}" style="width:${summary.percent}%"></span></div>
        <p class="usage-status">${status}</p>
        <dl class="usage-figures"><div><dt>Used</dt><dd>${formatCurrency(summary.used)}</dd></div><div><dt>Remaining eligible</dt><dd>${formatCurrency(summary.remaining)}</dd></div><div><dt>Max payment left at ${item.rate}%</dt><dd>${formatCurrency(summary.availablePayout)}</dd></div></dl>
      </article>`;
    }
    function renderUsage() {
      const tracked = usageBenefits.filter(item => usage[item.id]);
      nodes.board.innerHTML = tracked.length
        ? tracked.map(usageRow).join('')
        : '<p class="usage-empty">Your tracked benefits will appear here with a progress bar, the remaining eligible amount, and what that remainder could still reimburse at the standard rate.</p>';
      nodes.summary.textContent = tracked.length
        ? `${tracked.length} benefit${tracked.length === 1 ? '' : 's'} tracked · ${formatCurrency(tracked.reduce((sum, item) => sum + usage[item.id], 0))} in eligible expenses recorded.`
        : 'No entries yet. Add a claim to start tracking.';
      nodes.clear.hidden = tracked.length === 0;
      nodes.exportJson.disabled = tracked.length === 0;
      nodes.exportCsv.disabled = tracked.length === 0;
      refreshDirectory();
    }
    function saveUsageFile(filename, type, content, message) {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.hidden = true;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setUsageStatus(message);
    }

    nodes.benefit.innerHTML = categories.filter(cat => cat.id !== 'all').map(cat => {
      const items = usageBenefits.filter(item => item.category === cat.id);
      if (!items.length) return '';
      return `<optgroup label="${escapeHTML(cat.label)}">${items.map(item => `<option value="${item.id}">${escapeHTML(item.title)} — ${escapeHTML(item.limit)}</option>`).join('')}</optgroup>`;
    }).join('');

    nodes.form.addEventListener('submit', event => {
      event.preventDefault();
      const id = nodes.benefit.value;
      const amount = nodes.amount.valueAsNumber;
      let message = '';
      if (!byId.has(id) || !Number.isFinite(byId.get(id)?.eligibleExpenseCap)) message = 'Choose a benefit with a dollar limit.';
      else if (!Number.isFinite(amount)) message = 'Enter the eligible amount as a number, such as 125.00.';
      else if (amount <= 0) message = 'Enter an amount greater than $0.';
      else if (amount > maxEstimateAmount) message = `Enter ${formatCurrency(maxEstimateAmount)} or less.`;
      nodes.error.textContent = message;
      nodes.error.hidden = !message;
      if (message) {
        nodes.amount.setAttribute('aria-invalid', 'true');
        nodes.amount.focus();
        return;
      }
      nodes.amount.removeAttribute('aria-invalid');
      usage[id] = Math.round(((usage[id] || 0) + amount) * 100) / 100;
      saveUsage();
      setUsageStatus('');
      nodes.amount.value = '';
      renderUsage();
      nodes.amount.focus();
    });
    nodes.board.addEventListener('click', event => {
      const remove = event.target.closest('[data-remove]');
      if (!remove) return;
      delete usage[remove.dataset.remove];
      saveUsage();
      setUsageStatus('');
      renderUsage();
      nodes.benefit.focus();
    });
    nodes.clear.addEventListener('click', () => {
      if (!window.confirm('Remove all tracked usage from this browser?')) return;
      usage = {};
      saveUsage();
      setUsageStatus('');
      renderUsage();
      nodes.benefit.focus();
    });
    nodes.exportJson.addEventListener('click', () => {
      if (!Object.keys(usage).length) return;
      const date = new Date().toISOString().slice(0, 10);
      saveUsageFile(
        `benefit-atlas-usage-${date}.json`,
        'application/json',
        JSON.stringify(createUsageExport(usage, usageBenefits), null, 2),
        'Saved a JSON backup to your downloads folder. Load file can restore it.'
      );
    });
    nodes.exportCsv.addEventListener('click', () => {
      if (!Object.keys(usage).length) return;
      const date = new Date().toISOString().slice(0, 10);
      saveUsageFile(
        `benefit-atlas-usage-${date}.csv`,
        'text/csv',
        createUsageCsv(usage, usageBenefits),
        'Saved a CSV spreadsheet to your downloads folder. It opens in Excel or Sheets.'
      );
    });
    nodes.importFile.addEventListener('click', () => nodes.file.click());
    nodes.file.addEventListener('change', async () => {
      const file = nodes.file.files?.[0];
      nodes.file.value = '';
      if (!file) return;
      if (file.size > 100 * 1024) {
        setUsageStatus('That file is too large to be a tracker backup (limit 100 KB).', true);
        return;
      }
      let text;
      try {
        text = await file.text();
      } catch {
        setUsageStatus('That file could not be read. Try saving it again from this page.', true);
        return;
      }
      const result = readUsageFile(text, usageBenefits, file.name);
      if (!result.ok) {
        setUsageStatus(result.message, true);
        return;
      }
      if (Object.keys(usage).length && !window.confirm('Replace your current tracked entries with the amounts from this file?')) {
        setUsageStatus('Load cancelled. Your existing entries were kept.');
        return;
      }
      usage = result.entries;
      saveUsage();
      renderUsage();
      const count = Object.keys(usage).length;
      const skipped = result.skipped
        ? ` ${result.skipped} entr${result.skipped === 1 ? 'y was' : 'ies were'} skipped because the benefit was unknown or the amount was invalid.`
        : '';
      setUsageStatus(`Loaded ${count} benefit${count === 1 ? '' : 's'} from file.${skipped}`);
      nodes.benefit.focus();
    });

    const requested = new URLSearchParams(window.location.search).get('benefit');
    if (requested && usageBenefits.some(item => item.id === requested)) nodes.benefit.value = requested;
    renderUsage();
  }

  /** Practitioner comparison table; rows open the shared benefit panel. */
  function initPractitioners() {
    const tbody = document.getElementById('practitioner-rows');
    if (!tbody) return;
    tbody.innerHTML = benefits.filter(item => item.whatItIs).map(item => `<tr>
      <th scope="row"><button type="button" class="practitioner-link" data-benefit="${escapeHTML(item.id)}">${escapeHTML(item.title)}</button></th>
      <td>${escapeHTML(item.whatItIs)}</td>
      <td>${escapeHTML(item.focus)}</td>
      <td><strong>${escapeHTML(item.limit)}</strong><small>${item.combined ? 'Shared' : 'Separate'} · ${escapeHTML(item.period)}</small></td>
    </tr>`).join('');
    tbody.addEventListener('click', event => {
      const selected = event.target.closest('[data-benefit]');
      if (selected) openBenefit(selected.dataset.benefit);
    });
  }

  function cardUsage(item) {
    if (!Number.isFinite(item.eligibleExpenseCap) || !usage[item.id]) return '';
    const summary = usageSummary(usage[item.id], item.eligibleExpenseCap, item.rate);
    return `<span class="card-usage"><span class="card-usage-track" aria-hidden="true"><span style="width:${summary.percent}%"></span></span><span>${summary.percent}% of limit used</span></span>`;
  }

  initDialog();
  initDirectory();
  initFinder();
  initUsage();
  initPractitioners();

  const requestedBenefit = new URLSearchParams(window.location.search).get('benefit');
  if (requestedBenefit && byId.has(requestedBenefit)) {
    if (document.getElementById('benefit-dialog')) {
      openBenefit(requestedBenefit, { updateAddress: false });
    } else if (!document.getElementById('usage-form')) {
      // Old links used /?benefit=…; keep them working after the page split.
      window.location.replace(`benefits.html?benefit=${encodeURIComponent(requestedBenefit)}`);
    }
  }

  document.addEventListener('keydown', event => {
    if (event.key !== '/' || event.altKey || event.metaKey || event.ctrlKey || document.querySelector('#benefit-dialog[open]')) return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable) return;
    const search = document.getElementById('benefit-search');
    if (!search) return;
    event.preventDefault();
    search.focus();
  });
})();
