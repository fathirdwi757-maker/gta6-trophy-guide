// Leonida Legend — tracker engine for the offline GTA VI trophy guide.
// Loads app/data/trophies.json (the official 55 trophies with this guide's own
// per-trophy guides), renders the checklist, saves progress in localStorage,
// and handles filters, the spoiler shield, the detail panel and export/import.
// It fetches nothing beyond its own data file: the app works fully offline.

const EARNED_KEY = 'leonida-legend-earned-v1';
const SETTINGS_KEY = 'leonida-legend-settings-v1';

const KIND_LABELS = {
  story: 'Story',
  completion: 'Completion',
  activities: 'Activities',
  collectibles: 'Collectibles',
  side: 'Side strands',
  crime: 'Crime & robberies',
  freeroam: 'Free-roam & one-offs',
};

// Where each named source can be read. Links open only when followed;
// the app itself never fetches them.
const SOURCE_LINKS = [
  ['PowerPyx', 'https://egamers.io/gta-6-trophy-list-all-55-trophies-and-achievements-plus-the-hardest-ones/'],
  ['EGamers', 'https://egamers.io/gta-6-trophy-list-all-55-trophies-and-achievements-plus-the-hardest-ones/'],
  ['GTABase', 'https://cryptogames.gg/gta-6-trophies-achievements-full-list/'],
  ['CryptoGames', 'https://cryptogames.gg/gta-6-trophies-achievements-full-list/'],
  ['KeenGamer', 'https://www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/'],
  ['FullSweep', 'https://fullsweepmap.com/wiki/gta6-trophies/'],
  ['Push Square', 'https://heyday.news/articles/gta-6-ps5-trophy-list-platinum-100-percent-b79c5017'],
  ['Heyday', 'https://heyday.news/articles/gta-6-ps5-trophy-list-platinum-100-percent-b79c5017'],
  ['Exophase', 'https://www.techtroduce.com/gta-6-ps5-trophy-list-100-percent-completion/'],
  ['Techtroduce', 'https://www.techtroduce.com/gta-6-ps5-trophy-list-100-percent-completion/'],
  ['LeonidaUnlocked', 'https://leonidaunlocked.com/trophies/'],
];

const listEl = document.getElementById('trophy-list');
const detailEl = document.getElementById('detail-panel');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('grade-filter');
const spoilerEl = document.getElementById('spoiler-toggle');
const hideEarnedEl = document.getElementById('earned-toggle');

let trophies = [];
let sources = [];
let earned = loadEarned();
let selectedId = null;
let activeKind = 'all';

function loadEarned() {
  try {
    const raw = JSON.parse(localStorage.getItem(EARNED_KEY) ?? '[]');
    return new Set(Array.isArray(raw) ? raw : raw.earned ?? []);
  } catch {
    return new Set();
  }
}

function saveEarned() {
  localStorage.setItem(EARNED_KEY, JSON.stringify({ earned: [...earned] }));
}

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
    if (typeof s.spoiler === 'boolean') spoilerEl.checked = s.spoiler;
    if (typeof s.hideEarned === 'boolean') hideEarnedEl.checked = s.hideEarned;
  } catch { /* defaults stand */ }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    spoiler: spoilerEl.checked,
    hideEarned: hideEarnedEl.checked,
  }));
}

function isMasked(trophy) {
  return spoilerEl.checked && trophy.kind === 'story' && !earned.has(trophy.name);
}

function matchesKind(trophy) {
  if (activeKind === 'all') return true;
  if (activeKind === 'missable') return trophy.missable === 'possible';
  if (activeKind === 'online') return trophy.kind === 'online';
  return trophy.kind === activeKind;
}

function matchesFilters(trophy) {
  if (!matchesKind(trophy)) return false;
  if (gradeEl.value !== 'all' && trophy.grade !== gradeEl.value) return false;
  if (hideEarnedEl.checked && earned.has(trophy.name)) return false;
  const q = searchEl.value.trim().toLowerCase();
  if (!q) return true;
  if (isMasked(trophy)) return false;
  const haystack = `${trophy.name} ${trophy.description} ${trophy.guide} ${KIND_LABELS[trophy.kind] ?? ''}`.toLowerCase();
  return haystack.includes(q);
}

function badge(text, cls) {
  const span = document.createElement('span');
  span.className = `badge ${cls}`;
  span.textContent = text;
  return span;
}

function renderProgress() {
  const total = trophies.length;
  const done = trophies.filter((t) => earned.has(t.name)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('progress-count').textContent = `${done} of ${total} earned`;
  document.getElementById('progress-pct').textContent = `${pct}%`;
  document.getElementById('progress-bar').style.width = `${pct}%`;
  const byGrade = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const all = trophies.filter((t) => t.grade === g);
    const got = all.filter((t) => earned.has(t.name)).length;
    return `${got}/${all.length} ${g}`;
  }).join(' · ');
  document.getElementById('progress-detail').textContent =
    `${byGrade} · 28 hidden · progress saved in this browser`;
}

function renderList() {
  const visible = trophies.filter(matchesFilters);
  listEl.replaceChildren();
  for (const trophy of visible) {
    listEl.append(buildCard(trophy));
  }
  const line = document.getElementById('result-line');
  if (activeKind === 'online') {
    line.textContent = 'Online trophies: none. All 55 trophies in the official list are offline and single-player (PowerPyx; Push Square), so this filter honestly returns an empty list.';
  } else if (activeKind === 'missable') {
    line.textContent = 'Missable filter: 1 trophy is flagged as possibly missable by published guides (unconfirmed). See the Missables tab for the full reasoning.';
  } else {
    line.textContent = `Showing ${visible.length} of ${trophies.length} trophies. Select one to read its guide.`;
  }
}

function buildCard(trophy) {
  const li = document.createElement('li');
  const card = document.createElement('div');
  card.className = `trophy-card grade-${trophy.grade}`;
  card.dataset.trophyId = String(trophy.id);
  if (earned.has(trophy.name)) card.classList.add('earned');
  if (selectedId === trophy.id) card.classList.add('selected');

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(trophy.name);
  box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
  box.addEventListener('click', (event) => event.stopPropagation());
  box.addEventListener('change', () => toggleEarned(trophy.name));

  const body = document.createElement('div');
  const masked = isMasked(trophy);
  const name = document.createElement('span');
  name.className = 'trophy-name';
  name.textContent = masked ? 'Story trophy — hidden by the spoiler shield' : trophy.name;
  const desc = document.createElement('span');
  desc.className = 'trophy-desc';
  desc.textContent = masked
    ? 'Name and description stay hidden until you earn it. Tick the box once it pops on your PlayStation.'
    : trophy.description;
  body.append(name, desc);

  const meta = document.createElement('div');
  meta.className = 'trophy-meta';
  meta.append(badge(trophy.grade, `grade-${trophy.grade}`));
  meta.append(badge(KIND_LABELS[trophy.kind] ?? trophy.kind, 'kind'));
  if (trophy.target) meta.append(badge(trophy.target, 'target'));
  if (trophy.hidden) meta.append(badge('Hidden on PSN', 'hidden-badge'));
  if (trophy.missable === 'possible') meta.append(badge('Possibly missable', 'missable'));
  body.append(meta);

  const side = document.createElement('div');
  side.className = 'card-side';
  side.textContent = earned.has(trophy.name) ? 'Earned ✓' : 'Guide →';

  card.append(box, body, side);
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `Read the guide for ${masked ? 'this story trophy' : trophy.name}`);
  card.addEventListener('click', () => selectTrophy(trophy.id));
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectTrophy(trophy.id);
    }
  });
  li.append(card);
  return li;
}

function sourceLinksFor(trophy) {
  const found = [];
  for (const [label, url] of SOURCE_LINKS) {
    if (trophy.sources.includes(label) && !found.some((f) => f.url === url)) {
      found.push({ label, url });
    }
  }
  return found;
}

function selectTrophy(id) {
  selectedId = id;
  const trophy = trophies.find((t) => t.id === id);
  if (!trophy) return;
  renderListSelection();
  const masked = isMasked(trophy);
  detailEl.replaceChildren();

  const title = document.createElement('h3');
  title.textContent = masked ? 'Story trophy — hidden by the spoiler shield' : trophy.name;
  const desc = document.createElement('p');
  desc.className = 'detail-desc';
  desc.textContent = masked
    ? 'Turn the spoiler shield off above if you want to read it now.'
    : `“${trophy.description}” — official description`;
  const meta = document.createElement('div');
  meta.className = 'trophy-meta';
  meta.append(badge(trophy.grade, `grade-${trophy.grade}`));
  meta.append(badge(KIND_LABELS[trophy.kind] ?? trophy.kind, 'kind'));
  if (trophy.target) meta.append(badge(trophy.target, 'target'));
  if (trophy.hidden) meta.append(badge('Hidden on PSN', 'hidden-badge'));
  if (trophy.missable === 'possible') meta.append(badge('Possibly missable — see Missables tab', 'missable'));

  const guide = document.createElement('p');
  guide.className = 'detail-guide';
  guide.textContent = masked
    ? 'This is a story trophy: it is earned by playing the campaign. Its guide stays hidden with its name until you earn it or lift the shield.'
    : trophy.guide;

  const srcBox = document.createElement('div');
  srcBox.className = 'detail-sources';
  const srcTitle = document.createElement('strong');
  srcTitle.textContent = 'Sources for this guide: ';
  srcBox.append(srcTitle, document.createTextNode(trophy.sources + '. '));
  for (const { label, url } of sourceLinksFor(trophy)) {
    const a = document.createElement('a');
    a.href = url;
    a.textContent = `Read: ${label}`;
    a.rel = 'noopener';
    srcBox.append(a, document.createTextNode(' '));
  }

  const checkLabel = document.createElement('label');
  checkLabel.className = 'detail-check';
  const check = document.createElement('input');
  check.type = 'checkbox';
  check.checked = earned.has(trophy.name);
  check.addEventListener('change', () => toggleEarned(trophy.name));
  checkLabel.append(check, document.createTextNode(' I have earned this trophy'));

  detailEl.append(title, desc, meta, guide, srcBox, checkLabel);
}

function renderListSelection() {
  for (const el of listEl.querySelectorAll('.trophy-card')) {
    el.classList.toggle('selected', Number(el.dataset.trophyId) === selectedId);
  }
}

function toggleEarned(name) {
  if (earned.has(name)) earned.delete(name);
  else earned.add(name);
  saveEarned();
  renderProgress();
  renderList();
  if (selectedId !== null) selectTrophy(selectedId);
}

function exportProgress() {
  const payload = JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned] }, null, 2);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  a.download = 'leonida-legend-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importProgress(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(names)) throw new Error('no earned list');
    const valid = new Set(trophies.map((t) => t.name));
    earned = new Set(names.filter((n) => valid.has(n)));
    saveEarned();
    renderProgress();
    renderList();
    if (selectedId !== null) selectTrophy(selectedId);
  } catch {
    document.getElementById('result-line').textContent =
      'That file could not be read as a progress export. Export from this app first, then import that file.';
  }
}

function showView(name) {
  for (const btn of document.querySelectorAll('.view-btn')) {
    btn.classList.toggle('active', btn.dataset.view === name);
  }
  for (const section of document.querySelectorAll('.view')) {
    section.hidden = section.id !== `view-${name}`;
  }
  if (location.hash !== `#${name}`) history.replaceState(null, '', `#${name}`);
  window.scrollTo({ top: 0 });
}

function renderSourceList() {
  const ul = document.getElementById('source-list');
  ul.replaceChildren();
  for (const s of sources) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url;
    a.textContent = s.name;
    a.rel = 'noopener';
    li.append(a);
    ul.append(li);
  }
}

function clearFilters() {
  searchEl.value = '';
  gradeEl.value = 'all';
  hideEarnedEl.checked = false;
  activeKind = 'all';
  for (const c of document.querySelectorAll('#kind-chips .chip')) {
    c.classList.toggle('active', c.dataset.kind === 'all');
  }
  saveSettings();
  renderList();
}

// Keyboard shortcuts: "/" jumps to the search box from anywhere (and back to
// the tracker view if another tab is showing); "Esc" clears the search text,
// the grade and kind filters and the hide-earned toggle. The spoiler shield
// is a reading preference, not a filter, so Esc deliberately leaves it alone.
function wireKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const typing = target instanceof HTMLElement &&
      (target.tagName === 'TEXTAREA' ||
        (target.tagName === 'INPUT' && target.type !== 'checkbox') ||
        target.isContentEditable);
    if (event.key === '/' && !typing) {
      event.preventDefault();
      showView('tracker');
      searchEl.focus();
      searchEl.select();
    } else if (event.key === 'Escape' && !event.defaultPrevented) {
      if (document.activeElement === searchEl) searchEl.blur();
      clearFilters();
    }
  });
}

function wireControls() {
  wireKeyboardShortcuts();
  searchEl.addEventListener('input', renderList);
  gradeEl.addEventListener('change', renderList);
  spoilerEl.addEventListener('change', () => {
    saveSettings();
    renderList();
    if (selectedId !== null) selectTrophy(selectedId);
  });
  hideEarnedEl.addEventListener('change', () => {
    saveSettings();
    renderList();
  });
  document.getElementById('export-btn').addEventListener('click', exportProgress);
  document.getElementById('import-file').addEventListener('change', (e) => importProgress(e.target.files[0]));
  document.getElementById('reset-btn').addEventListener('click', () => {
    earned = new Set();
    saveEarned();
    renderProgress();
    renderList();
    if (selectedId !== null) selectTrophy(selectedId);
  });
  for (const chip of document.querySelectorAll('#kind-chips .chip')) {
    chip.addEventListener('click', () => {
      activeKind = chip.dataset.kind;
      for (const c of document.querySelectorAll('#kind-chips .chip')) {
        c.classList.toggle('active', c === chip);
      }
      renderList();
    });
  }
  for (const btn of document.querySelectorAll('.view-btn')) {
    btn.addEventListener('click', () => showView(btn.dataset.view));
  }
}

async function init() {
  loadSettings();
  const doc = await (await fetch('data/trophies.json')).json();
  trophies = doc.trophies;
  sources = doc.sources ?? [];
  wireControls();
  renderSourceList();
  renderProgress();
  renderList();
  const hash = location.hash.replace('#', '');
  if (['roadmap', 'missables', 'sources'].includes(hash)) showView(hash);
  const trophyMatch = location.hash.match(/trophy-(\d+)/);
  if (trophyMatch) selectTrophy(Number(trophyMatch[1]));
  else selectTrophy(17); // The Shootist: a silver with a clear count, good first guide to show.
}

init();
