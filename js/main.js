/* ── Siler Technology — Main Site JS ── */

const API_BASE = '/api'; // Cloudflare Worker URL — set this after deploying worker

// ── State ──
let projects = [];
let currentPage = 'home';
let currentProjectId = null;

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  loadProjects();
  initNewsletter();
  initToast();
});

// ── Router ──
function initRouter() {
  handleRoute();
  window.addEventListener('popstate', handleRoute);
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-route]');
    if (a) {
      e.preventDefault();
      navigateTo(a.dataset.route);
    }
  });
}

function handleRoute() {
  const hash = window.location.hash.replace('#', '') || 'home';
  const parts = hash.split('/');
  if (parts[0] === 'project' && parts[1]) {
    showProjectPage(parts[1]);
  } else if (parts[0] === 'projects') {
    showPage('projects');
  } else {
    showPage('home');
  }
}

function navigateTo(route) {
  window.location.hash = route;
}

function showPage(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  const el = document.getElementById(`page-${page}`);
  if (el) el.style.display = 'block';
  window.scrollTo(0, 0);
}

// ── Load Projects from Worker ──
async function loadProjects() {
  try {
    const res = await fetch(`${API_BASE}/projects`);
    projects = await res.json();
  } catch {
    // Fallback demo data for development
    projects = getDemoProjects();
  }
  renderHomeProjects();
  renderProjectsGrid();
}

function getDemoProjects() {
  return [
    {
      id: 'blender-prokit',
      title: 'Blender ProKit',
      type: 'blender',
      typeLabel: 'Blender Addon',
      synopsis: 'A comprehensive suite of procedural mesh tools for 3D artists. Streamline your workflow with smart UV unwrapping, batch modifiers, and one-click LOD generation.',
      date: '2025-03-01',
      status: 'published',
      content: '<h2>Overview</h2><p>Blender ProKit is a powerful addon that brings professional-grade tools directly into Blender\'s interface...</p>',
      externalUrl: '',
      images: []
    },
    {
      id: 'uv-toolkit',
      title: 'UV Toolkit Pro',
      type: 'plugin',
      typeLabel: 'Blender Plugin',
      synopsis: 'Intelligent UV unwrapping that understands your mesh topology. Reduce unwrapping time by 80% with AI-assisted seam detection and atlas packing.',
      date: '2025-01-15',
      status: 'published',
      content: '<h2>Overview</h2><p>UV Toolkit Pro reimagines the UV unwrapping pipeline...</p>',
      externalUrl: '',
      images: []
    },
    {
      id: 'sky-bridge-saga',
      title: 'Sky Bridge Saga',
      type: 'unreal',
      typeLabel: 'Unreal Engine',
      synopsis: 'An epic open-world adventure across sky islands connected by ancient bridges. Build, explore, and unravel the mysteries of a world suspended in the clouds. Full details and demo at skybridgesaga.com.',
      date: '2024-11-20',
      status: 'published',
      content: '<h2>About the Game</h2><p>Sky Bridge Saga is an ambitious open-world adventure...</p>',
      externalUrl: 'https://skybridgesaga.com',
      images: []
    },
    {
      id: 'node-forge',
      title: 'Node Forge',
      type: 'blender',
      typeLabel: 'Blender Addon',
      synopsis: 'A visual node graph editor extension that supercharges Blender\'s geometry nodes with custom presets, node groups, and a searchable community library.',
      date: '2024-09-05',
      status: 'published',
      content: '<h2>Overview</h2><p>Node Forge extends Blender\'s geometry node system...</p>',
      externalUrl: '',
      images: []
    }
  ];
}

// ── Home Page Rendering ──
function renderHomeProjects() {
  const container = document.getElementById('home-featured');
  if (!container) return;

  const published = projects.filter(p => p.status === 'published');
  const featured = published[0];
  const rest = published.slice(1, 4);

  let html = '';

  if (featured) {
    html += `
      <a href="#project/${featured.id}" class="featured-strip" style="text-decoration:none;color:inherit;display:grid;">
        <div class="featured-strip-num">01</div>
        <div class="featured-strip-body">
          <div class="featured-strip-meta">Featured · ${featured.typeLabel} · ${formatDate(featured.date)}</div>
          <div class="featured-strip-title">${featured.title}</div>
          <div class="featured-strip-desc">${featured.synopsis}</div>
        </div>
        <div class="featured-strip-arrow">↗</div>
      </a>`;
  }

  rest.forEach((p, i) => {
    const num = String(i + 2).padStart(2, '0');
    html += `
      <a href="#project/${p.id}" style="text-decoration:none;color:inherit;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:2rem;padding:2rem 2rem;border-bottom:var(--border);transition:background 0.15s ease;" onmouseenter="this.style.background='var(--paper-off)'" onmouseleave="this.style.background=''">
        <div class="featured-strip-num">${num}</div>
        <div>
          <div class="featured-strip-meta">${p.typeLabel} · ${formatDate(p.date)}</div>
          <div style="font-size:1.2rem;font-weight:800;letter-spacing:-0.02em;">${p.title}</div>
          <div class="featured-strip-desc">${p.synopsis}</div>
        </div>
        <div style="font-size:1.5rem;font-weight:800;">↗</div>
      </a>`;
  });

  container.innerHTML = html;
}

// ── Projects Grid ──
function renderProjectsGrid() {
  const container = document.getElementById('projects-grid');
  if (!container) return;

  const published = projects.filter(p => p.status === 'published');

  container.innerHTML = published.map((p, i) => {
    const num = String(i + 1).padStart(2, '0');
    const tagClass = `tag--${p.type}`;
    return `
      <div class="project-card" style="position:relative;">
        <a href="#project/${p.id}" class="card-link"></a>
        <div class="project-card-num">${num}</div>
        <div class="project-card-tag"><span class="tag ${tagClass}">${p.typeLabel}</span></div>
        <div class="project-card-title">${p.title}</div>
        <div class="project-card-desc">${p.synopsis}</div>
        <div class="project-card-footer">
          <span class="project-card-date">${formatDate(p.date)}</span>
          <span class="project-card-arrow">↗</span>
        </div>
        <button class="share-btn" style="margin-top:0.75rem;position:relative;z-index:2;" onclick="shareProject('${p.id}', '${escapeAttr(p.title)}', event)">Share ↗</button>
      </div>`;
  }).join('');
}

// ── Project Page ──
async function showProjectPage(id) {
  currentProjectId = id;
  let project = projects.find(p => p.id === id);

  // If not cached yet, fetch
  if (!project) {
    try {
      const res = await fetch(`${API_BASE}/projects/${id}`);
      project = await res.json();
    } catch {
      showPage('home');
      return;
    }
  }

  renderProjectPage(project);
  showPage('project');
  window.scrollTo(0, 0);
}

function renderProjectPage(p) {
  const page = document.getElementById('page-project');
  if (!page) return;

  const tagClass = `tag--${p.type}`;

  page.innerHTML = `
    <div class="project-hero">
      <div class="project-hero-inner">
        <div class="project-hero-num">${String(projects.filter(x=>x.status==='published').findIndex(x=>x.id===p.id)+1).padStart(2,'0')}</div>
        <h1 class="project-hero-title">${p.title}</h1>
        <div class="project-hero-meta">
          <span class="project-hero-tag tag ${tagClass}">${p.typeLabel}</span>
          <span class="project-hero-date">${formatDate(p.date)}</span>
          <button class="project-share-btn" onclick="shareProject('${p.id}','${escapeAttr(p.title)}')">Share ↗</button>
        </div>
      </div>
    </div>
    <div class="project-content">
      <div class="project-body">
        ${p.images && p.images.length ? p.images.map(img => `<img src="${img}" alt="${p.title} screenshot" loading="lazy">`).join('') : ''}
        ${p.content || `<p>${p.synopsis}</p>`}
      </div>
      <aside class="project-sidebar">
        <div class="sidebar-block">
          <div class="sidebar-label">Category</div>
          <div class="sidebar-value">${p.typeLabel}</div>
        </div>
        <div class="sidebar-block">
          <div class="sidebar-label">Published</div>
          <div class="sidebar-value">${formatDate(p.date)}</div>
        </div>
        ${p.externalUrl ? `
        <div class="sidebar-block">
          <div class="sidebar-label">External Links</div>
          <a href="${p.externalUrl}" target="_blank" rel="noopener" class="sidebar-link">${p.externalUrl.replace('https://', '')} ↗</a>
        </div>` : ''}
        <div class="sidebar-block">
          <div class="sidebar-label">More Projects</div>
          ${projects.filter(x=>x.status==='published'&&x.id!==p.id).slice(0,3).map(x=>`
            <a href="#project/${x.id}" class="sidebar-link">${x.title} ↗</a>
          `).join('')}
        </div>
      </aside>
    </div>`;
}

// ── Share ──
function shareProject(id, title, event) {
  if (event) event.preventDefault();
  const url = `${window.location.origin}${window.location.pathname}#project/${id}`;
  if (navigator.share) {
    navigator.share({ title: `${title} — Siler Technology`, url });
  } else {
    navigator.clipboard.writeText(url).then(() => showToast('Link copied to clipboard'));
  }
}

// ── Newsletter ──
function initNewsletter() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = form.querySelector('#newsletter-email').value.trim();
    const name = form.querySelector('#newsletter-name').value.trim();
    const btn = form.querySelector('.newsletter-submit');
    btn.textContent = 'Subscribing...';
    btn.disabled = true;
    try {
      const res = await fetch(`${API_BASE}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
      });
      if (res.ok) {
        showToast('Subscribed! Welcome aboard.');
        form.reset();
      } else {
        const data = await res.json();
        showToast(data.error || 'Something went wrong. Try again.');
      }
    } catch {
      showToast('Could not connect. Try again later.');
    } finally {
      btn.textContent = 'Subscribe';
      btn.disabled = false;
    }
  });
}

// ── Toast ──
let toastTimer;
function initToast() {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.id = 'toast';
  document.body.appendChild(toast);
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Helpers ──
function formatDate(str) {
  if (!str) return '';
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-IE', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeAttr(str) {
  return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
