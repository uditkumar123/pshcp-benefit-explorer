/* No accounts, cookies, analytics, third-party scripts, or data uploads. */
(function () {
  'use strict';
  const { benefits, categories, source } = window.PSHCP_DATA;
  const { filterBenefits, computeIllustration, isOddCycleYear, formatCurrency } = window.PSHCP_LOGIC;
  const state = { search: '', category: 'all', coverage: 'supplementary', sort: 'featured' };
  const grid = document.getElementById('benefit-grid');
  const count = document.getElementById('result-count');
  const searchInput = document.getElementById('benefit-search');
  const filters = document.getElementById('category-list');
  const emptyState = document.getElementById('empty-state');
  const number = new Intl.NumberFormat('en-CA');
  const knownCategory = Object.fromEntries(categories.map(c => [c.id,c]));

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function renderCategories() {
    filters.innerHTML = categories.map(cat => {
      const selected = cat.id === state.category;
      return `<button type="button" class="category-button" data-category="${cat.id}" aria-pressed="${selected}"><span class="cat-icon" aria-hidden="true">${cat.icon}</span>${escapeHTML(cat.label)}</button>`;
    }).join('');
  }
  function maybeCycleNote(item) {
    if (!['glasses','eye-exam'].includes(item.id)) return '';
    const cycle = isOddCycleYear();
    return `<p><strong>Current two-calendar-year period:</strong> ${cycle.firstYear}–${cycle.lastYear}. This is not a rolling 24-month period.</p>`;
  }
  function renderEstimator(item) {
    if (!Number.isFinite(item.eligibleExpenseCap) || item.noEstimate || item.rate !== 80) return '';
    return `<div class="estimate-box" data-estimator="${item.id}">
      <h4>Try an illustrative reimbursement</h4>
      <div class="estimate-row">
        <label>Eligible expense (CAD)<input type="number" inputmode="decimal" min="0" step="0.01" value="100" data-field="price" aria-label="Eligible expense for ${escapeHTML(item.title)} in Canadian dollars"></label>
        <label>Cap already used (CAD)<input type="number" inputmode="decimal" min="0" step="0.01" value="0" data-field="used" aria-label="Amount of eligible expense cap already used for ${escapeHTML(item.title)}"></label>
      </div>
      <div class="estimate-output"><span>Illustrative plan payment</span><strong aria-live="polite" data-result="${item.id}">${formatCurrency(80)}</strong></div>
      <p class="estimate-caveat">Assumes the full entered expense is eligible, within reasonable & customary charges, with no other payer. Not a claim quote or live balance.</p>
    </div>`;
  }
  function renderCard(item) {
    const cat = knownCategory[item.category];
    const pageLinks = item.pages.map(p => `<a href="${source.pdf}#page=${p}" target="_blank" rel="noopener noreferrer" class="details-source">Member booklet · printed page ${p} <span aria-hidden="true">↗</span></a>`).join('');
    const badge = item.featured ? '<span class="card-badge">POPULAR</span>' : `<span class="card-icon" aria-hidden="true">${cat.icon}</span>`;
    return `<article class="benefit-card" id="benefit-${item.id}" aria-labelledby="title-${item.id}">
      <div class="card-top"><span class="card-category">${escapeHTML(cat.label)}</span>${badge}</div>
      <h3 class="card-title" id="title-${item.id}">${escapeHTML(item.title)}</h3>
      <div class="card-keyline"><span class="card-limit ${item.limit.length > 9 ? 'smaller' : ''}">${escapeHTML(item.limit)}</span><span class="card-rate">${item.rate}% rate</span></div>
      <p class="card-period">${escapeHTML(item.period)}</p>
      <p class="card-summary">${escapeHTML(item.notes)}</p>
      <details class="card-details"><summary>Details, conditions & source</summary><div class="details-content">
        <div class="details-head">BEFORE YOU SPEND</div><p>${escapeHTML(item.docs)}</p>${maybeCycleNote(item)}
        ${item.combined ? '<p><strong>Shared cap:</strong> All covered services named above draw on the same eligible expense limit.</p>' : ''}
        ${renderEstimator(item)}
        <div class="details-head">VERIFY IN THE BOOKLET</div><div class="source-links">${pageLinks}</div>
      </div></details>
    </article>`;
  }
  function sortItems(items) {
    const copy = items.slice();
    if (state.sort === 'az') return copy.sort((a,b) => a.title.localeCompare(b.title, 'en-CA'));
    if (state.sort === 'amount') return copy.sort((a,b) => (b.eligibleExpenseCap || 0) - (a.eligibleExpenseCap || 0) || a.title.localeCompare(b.title, 'en-CA'));
    return copy.sort((a,b) => Number(b.featured) - Number(a.featured));
  }
  function render() {
    renderCategories();
    const filtered = sortItems(filterBenefits(benefits, state));
    grid.innerHTML = filtered.map(renderCard).join('');
    count.textContent = `${number.format(filtered.length)} benefit${filtered.length === 1 ? '' : 's'} found`;
    emptyState.hidden = filtered.length !== 0;
  }
  function setSearch(term) {
    state.search = term;
    searchInput.value = term;
    render();
  }
  searchInput.addEventListener('input', e => { state.search = e.target.value; render(); });
  filters.addEventListener('click', e => {
    const button = e.target.closest('[data-category]');
    if (!button) return;
    state.category = button.dataset.category;
    render();
  });
  document.querySelectorAll('input[name="coverage"]').forEach(input => input.addEventListener('change', e => {
    if (!e.target.checked) return;
    state.coverage = e.target.value;
    document.getElementById('coverage-explainer').textContent = state.coverage === 'supplementary'
      ? 'Supplementary Coverage is normally for members insured under a provincial or territorial health plan.'
      : 'Comprehensive Coverage generally applies to eligible members abroad without provincial or territorial insurance. Some provisions differ for pensioners.';
    render();
  }));
  document.getElementById('benefit-sort').addEventListener('change', e => {state.sort = e.target.value;render();});
  document.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => {
    setSearch(button.dataset.query);
    document.getElementById('explore').scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    searchInput.focus({preventScroll:true});
  }));
  document.getElementById('clear-filters').addEventListener('click', () => {state.category='all';setSearch('');searchInput.focus();});
  grid.addEventListener('input', event => {
    const box = event.target.closest('[data-estimator]');
    if (!box) return;
    const item = benefits.find(b => b.id === box.dataset.estimator);
    if (!item) return;
    const price = box.querySelector('[data-field="price"]').valueAsNumber;
    const used = box.querySelector('[data-field="used"]').valueAsNumber;
    const result = computeIllustration({price,alreadyUsed:used,eligibleExpenseCap:item.eligibleExpenseCap,rate:item.rate});
    box.querySelector('[data-result]').textContent = result ? formatCurrency(result.planPays) : 'Enter valid amounts';
  });
  document.addEventListener('keydown', event => {
    if (event.key !== '/' || event.altKey || event.metaKey || event.ctrlKey) return;
    const tag = document.activeElement.tagName;
    if (['INPUT','TEXTAREA','SELECT'].includes(tag) || document.activeElement.isContentEditable) return;
    event.preventDefault();searchInput.focus();
  });
  render();
})();
