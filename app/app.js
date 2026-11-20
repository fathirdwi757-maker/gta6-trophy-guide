// Leonida Ledger - trophy guide and tracker for Grand Theft Auto VI (PS5).
// Loads the official trophy data from data/trophies.json, renders the tracker,
// the platinum roadmap and the missables view, and keeps the player's earned
// state in localStorage. No network calls beyond this app's own files.

const STORAGE_KEY = 'leonida-ledger-v1';

const els = {
  list: document.getElementById('trophy-list'),
  missableList: document.getElementById('missable-list'),
  roadmapStages: document.getElementById('roadmap-stages'),
  resultLine: document.getElementById('result-line'),
  emptyNote: document.getElementById('empty-note'),
  detail: document.getElementById('detail'),
  detailEmpty: document.getElementById('detail-empty'),
  search: document.getElementById('search'),
  tier: document.getElementById('filter-tier'),
  kind: document.getElementById('filter-kind'),
  status: document.getElementById('filter-status'),
  missableOnly: document.getElementById('filter-missable'),
  spoilers: document.getElementById('toggle-spoilers'),
  toolbar: document.getElementById('toolbar'),
  views: {
    tracker: document.getElementById('view-tracker'),
    roadmap: document.getElementById('view-roadmap'),
    missables: document.getElementById('view-missables'),
  },
  tabs: [...document.querySelectorAll('.tab')],
  progressCount: document.getElementById('progress-count'),
  progressFill: document.getElementById('progress-fill'),
  progressBar: document.getElementById('progress-bar'),
  missableBadge: document.getElementById('missable-badge'),
};

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));
const tierTotals = {};
for (const t of trophies) tierTotals[t.grade] = (tierTotals[t.grade] ?? 0) + 1;

// ---------- state ----------

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (raw && Array.isArray(raw.earned)) {
      return { earned: new Set(raw.earned.filter((id) => byId.has(id))), spoilers: !!raw.spoilers };
    }
  } catch { /* a corrupt save falls back to a fresh one */ }
  return { earned: new Set(), spoilers: false };
}

const state = loadState();
let selectedId = null;
let currentView = 'tracker';

// Screenshot / deep-link parameters: ?view=roadmap&trophy=37&earned=2,3,4&spoilers=1
const params = new URLSearchParams(location.search);
if (params.has('earned')) {
  state.earned = new Set(params.get('earned').split(',').map(Number).filter((id) => byId.has(id)));
}
if (params.has('spoilers')) state.spoilers = params.get('spoilers') === '1';
if (params.has('trophy')) {
  const id = Number(params.get('trophy'));
  if (byId.has(id)) selectedId = id;
}
if (params.has('view') && els.views[params.get('view')]) currentView = params.get('view');

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ earned: [...state.earned], spoilers: state.spoilers }));
}

// ---------- small DOM helper ----------

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function isSpoiled(t) {
  return state.spoilers && t.kind === 'story' && !state.earned.has(t.id);
}

function displayName(t) {
  return isSpoiled(t) ? 'Hidden story trophy' : t.name;
}

function displayDesc(t) {
  return isSpoiled(t) ? 'Name and description hidden by the spoiler setting until earned.' : t.description;
}

function formatCount(n) {
  return n >= 10000 ? '$' + n.toLocaleString('en-US') : String(n);
}

// ---------- progress header ----------

function renderProgress() {
  const total = trophies.length;
  const done = state.earned.size;
  els.progressCount.textContent = `${done} of ${total}`;
  els.progressFill.style.width = `${(done / total) * 100}%`;
  els.progressBar.setAttribute('aria-valuenow', String(done));
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const got = trophies.filter((t) => t.grade === grade && state.earned.has(t.id)).length;
    document.getElementById(`count-${grade}`).textContent = `${got}/${tierTotals[grade]}`;
  }
  const missablesLeft = trophies.filter((t) => t.missable && !state.earned.has(t.id)).length;
  els.missableBadge.textContent = String(missablesLeft);
}

// ---------- trophy cards ----------

function tagRow(t) {
  const row = el('div', 'card-tags');
  row.append(el('span', `tag tag-tier-${t.grade}`, t.tier));
  row.append(el('span', 'tag', t.category));
  row.append(el('span', 'tag tag-stage', `Stage ${t.stage}`));
  if (t.missable) row.append(el('span', 'tag tag-missable', 'Missable'));
  if (t.hidden) row.append(el('span', 'tag tag-hidden', 'Hidden on PSN'));
  return row;
}

function trophyCard(t, { showNote = false } = {}) {
  const earned = state.earned.has(t.id);
  const card = el('div', `trophy-card tier-${t.grade}${earned ? ' is-earned' : ''}${t.id === selectedId ? ' is-selected' : ''}`);
  card.dataset.id = String(t.id);

  const check = el('button', 'card-check', earned ? '✓' : '');
  check.type = 'button';
  check.title = earned ? `Mark ${t.name} as not earned` : `Mark ${t.name} as earned`;
  check.setAttribute('aria-label', check.title);
  check.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleEarned(t.id);
  });

  const main = el('div', 'card-main');
  main.append(el('h3', `card-name${isSpoiled(t) ? ' spoiler-name' : ''}`, displayName(t)));
  main.append(el('p', 'card-desc', displayDesc(t)));
  main.append(tagRow(t));
  if (showNote && t.missableNote) {
    const note = el('p', 'card-desc', t.missableNote);
    note.style.color = 'var(--danger)';
    main.append(note);
  }

  card.append(check, main);
  if (t.count) card.append(el('span', 'card-count', formatCount(t.count)));
  card.addEventListener('click', () => selectTrophy(t.id, true));

  const li = el('li');
  li.append(card);
  return li;
}

// ---------- tracker view ----------

function matchesFilters(t) {
  const q = els.search.value.trim().toLowerCase();
  if (q) {
    const haystack = [t.name, t.description, t.category, t.guide, ...(t.steps ?? [])].join(' ').toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (els.tier.value !== 'all' && t.grade !== els.tier.value) return false;
  if (els.kind.value !== 'all' && t.kind !== els.kind.value) return false;
  if (els.status.value === 'earned' && !state.earned.has(t.id)) return false;
  if (els.status.value === 'unearned' && state.earned.has(t.id)) return false;
  if (els.missableOnly.checked && !t.missable) return false;
  return true;
}

function renderList() {
  const shown = trophies.filter(matchesFilters);
  els.list.replaceChildren(...shown.map((t) => trophyCard(t)));
  els.emptyNote.hidden = shown.length > 0;
  els.resultLine.textContent = `Showing ${shown.length} of ${trophies.length} trophies · ${state.earned.size} earned overall · progress saves automatically in this browser.`;
}

function renderMissables() {
  const missables = trophies.filter((t) => t.missable);
  els.missableList.replaceChildren(...missables.map((t) => trophyCard(t, { showNote: true })));
}

// ---------- roadmap view ----------

function renderRoadmap() {
  els.roadmapStages.replaceChildren();
  for (const stage of doc.roadmap) {
    const card = el('section', 'stage-card');
    const head = el('div', 'stage-head');
    head.append(el('span', 'stage-num', `Stage ${stage.n}`));
    head.append(el('h3', '', stage.title));
    head.append(el('span', 'stage-hours', stage.hours));
    const doneCount = stage.trophyIds.filter((id) => state.earned.has(id)).length;
    head.append(el('span', 'stage-progress', `${doneCount}/${stage.trophyIds.length} earned`));
    card.append(head);
    card.append(el('p', '', stage.summary));
    const chips = el('div', 'stage-trophies');
    for (const id of stage.trophyIds) {
      const t = byId.get(id);
      if (!t) continue;
      const chip = el('button', `stage-chip${state.earned.has(id) ? ' done' : ''}`, displayName(t));
      chip.type = 'button';
      chip.addEventListener('click', () => {
        setView('tracker');
        selectTrophy(id, true);
        document.getElementById('detail-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      chips.append(chip);
    }
    card.append(chips);
    els.roadmapStages.append(card);
  }
}

// ---------- detail panel ----------

function selectTrophy(id, focusDetail = false) {
  selectedId = id;
  renderDetail();
  renderList();
  renderMissables();
  if (focusDetail && window.innerWidth <= 920) {
    document.getElementById('detail-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderDetail() {
  const t = byId.get(selectedId);
  if (!t) {
    els.detail.hidden = true;
    els.detailEmpty.hidden = false;
    return;
  }
  els.detailEmpty.hidden = true;
  els.detail.hidden = false;
  const spoiled = isSpoiled(t);
  const d = els.detail;
  d.replaceChildren();

  d.append(el('h2', spoiled ? 'spoiler-name' : '', displayName(t)));
  d.append(el('p', 'detail-desc', `“${displayDesc(t)}”`));
  d.append(tagRow(t));

  const earnLabel = el('label', 'detail-earn');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = state.earned.has(t.id);
  box.addEventListener('change', () => toggleEarned(t.id));
  earnLabel.append(box, el('span', '', box.checked ? 'Earned - nice work.' : 'Mark as earned'));
  d.append(earnLabel);

  if (t.missable && t.missableNote) {
    const warn = el('div', 'missable-warning');
    warn.append(el('strong', '', '⚠ Missable - read before you play'));
    warn.append(el('span', '', t.missableNote));
    d.append(warn);
  }

  if (spoiled) {
    d.append(el('p', 'detail-meta', 'The spoiler setting is hiding this story trophy\u2019s guide until you earn it. Turn the setting off in the toolbar to read it now.'));
    return;
  }

  d.append(el('h3', '', 'The guide'));
  d.append(el('p', '', t.guide));

  d.append(el('h3', '', 'Step by step'));
  const steps = el('ol');
  for (const s of t.steps) steps.append(el('li', '', s));
  d.append(steps);

  if (t.tips?.length) {
    d.append(el('h3', '', 'Tips'));
    const tips = el('ul');
    for (const tip of t.tips) tips.append(el('li', '', tip));
    d.append(tips);
  }

  const meta = [
    `Category: ${t.category}`,
    `Roadmap stage ${t.stage} of 7`,
    t.hidden ? 'Hidden on PlayStation until earned' : 'Visible on PlayStation from the start',
  ];
  if (t.count) meta.push(`PlayStation tracked target: ${formatCount(t.count)}`);
  d.append(el('h3', '', 'Details'));
  d.append(el('p', 'detail-meta', meta.join(' · ')));

  d.append(el('h3', '', 'Sources'));
  const sources = el('ul', 'source-list');
  for (const s of t.sources) sources.append(el('li', '', s));
  d.append(sources);
}

// ---------- earned state ----------

function toggleEarned(id) {
  if (state.earned.has(id)) state.earned.delete(id);
  else state.earned.add(id);
  saveState();
  renderAll();
}

function renderAll() {
  renderProgress();
  renderList();
  renderMissables();
  renderRoadmap();
  renderDetail();
}

// ---------- views ----------

function setView(view) {
  currentView = view;
  for (const [name, panel] of Object.entries(els.views)) panel.hidden = name !== view;
  for (const tab of els.tabs) tab.classList.toggle('is-active', tab.dataset.view === view);
  els.toolbar.style.display = view === 'tracker' ? '' : 'none';
}
for (const tab of els.tabs) tab.addEventListener('click', () => setView(tab.dataset.view));

// ---------- toolbar wiring ----------

for (const control of [els.search, els.tier, els.kind, els.status, els.missableOnly]) {
  control.addEventListener('input', renderList);
  control.addEventListener('change', renderList);
}
els.spoilers.checked = state.spoilers;
els.spoilers.addEventListener('change', () => {
  state.spoilers = els.spoilers.checked;
  saveState();
  renderAll();
});

document.getElementById('export-btn').addEventListener('click', () => {
  const payload = {
    app: 'leonida-ledger',
    game: 'Grand Theft Auto VI',
    version: 1,
    exportedAt: new Date().toISOString(),
    earnedIds: [...state.earned].sort((a, b) => a - b),
    earnedNames: [...state.earned].map((id) => byId.get(id)?.name).filter(Boolean),
  };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  a.download = 'leonida-ledger-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById('import-file').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : (data.earnedIds ?? data.earned ?? []);
    const names = Array.isArray(data) ? [] : (data.earnedNames ?? []);
    const next = new Set();
    for (const id of ids) if (byId.has(Number(id))) next.add(Number(id));
    for (const name of names) {
      const t = trophies.find((x) => x.name === name);
      if (t) next.add(t.id);
    }
    // A bare array of names (the simple checklist format) is accepted too.
    if (Array.isArray(data)) {
      for (const name of data) {
        const t = trophies.find((x) => x.name === name);
        if (t) next.add(t.id);
      }
    }
    state.earned = next;
    saveState();
    renderAll();
  } catch {
    alert('That file could not be read as Leonida Ledger progress. Export a fresh file and try again.');
  }
  event.target.value = '';
});

document.getElementById('reset-btn').addEventListener('click', () => {
  if (!confirm('Clear every earned tick? This cannot be undone (export first if unsure).')) return;
  state.earned = new Set();
  saveState();
  renderAll();
});

document.addEventListener('keydown', (event) => {
  if (event.key === '/' && document.activeElement !== els.search && currentView === 'tracker') {
    event.preventDefault();
    els.search.focus();
  }
});

// ---------- go ----------

setView(currentView);
renderAll();
if (selectedId !== null) renderDetail();
