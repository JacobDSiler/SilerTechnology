/* ── Siler Technology — Admin Panel JS ── */

const API_BASE = '/api';
let adminToken = null;
let editingProjectId = null;
let projects = [];
let subscribers = [];

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  adminToken = sessionStorage.getItem('siler_admin_token');
  const page = document.body.dataset.adminPage;
  if (page === 'login') initLoginPage();
  else if (page === 'reset') initResetPage();
  else if (page === 'panel') initAdminPanel();
});

// ── Login Page ──
function initLoginPage() {
  const form = document.getElementById('login-form');
  if (!form) return;

  // Check already logged in
  if (adminToken) { window.location.href = 'admin.html'; return; }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const password = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    const btn = form.querySelector('.login-submit');
    btn.textContent = 'Signing in...';
    btn.disabled = true;
    errEl.classList.remove('show');

    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        sessionStorage.setItem('siler_admin_token', data.token);
        window.location.href = 'admin.html';
      } else {
        errEl.textContent = data.error || 'Incorrect password.';
        errEl.classList.add('show');
      }
    } catch {
      errEl.textContent = 'Connection error. Try again.';
      errEl.classList.add('show');
    } finally {
      btn.textContent = 'Sign In';
      btn.disabled = false;
    }
  });
}

// ── Reset Page ──
function initResetPage() {
  const form = document.getElementById('reset-form');
  const requestForm = document.getElementById('reset-request-form');

  // Handle reset token in URL
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (token && form) {
    document.getElementById('reset-token-section').style.display = 'block';
    document.getElementById('reset-request-section').style.display = 'none';

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const newPassword = document.getElementById('new-password').value;
      const confirm = document.getElementById('confirm-password').value;
      const errEl = document.getElementById('reset-error');
      if (newPassword !== confirm) {
        errEl.textContent = 'Passwords do not match.';
        errEl.classList.add('show');
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/admin/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword })
        });
        if (res.ok) {
          document.getElementById('reset-success').style.display = 'block';
          form.style.display = 'none';
        } else {
          const d = await res.json();
          errEl.textContent = d.error || 'Reset failed.';
          errEl.classList.add('show');
        }
      } catch {
        errEl.textContent = 'Connection error.';
        errEl.classList.add('show');
      }
    });
  }

  if (requestForm) {
    requestForm.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = requestForm.querySelector('button');
      btn.textContent = 'Sending...';
      btn.disabled = true;
      try {
        await fetch(`${API_BASE}/admin/forgot-password`, { method: 'POST' });
        document.getElementById('reset-sent-msg').style.display = 'block';
        requestForm.style.display = 'none';
      } catch {}
      finally {
        btn.textContent = 'Send Reset Link';
        btn.disabled = false;
      }
    });
  }
}

// ── Admin Panel ──
function initAdminPanel() {
  if (!adminToken) { window.location.href = 'login.html'; return; }

  // Nav
  document.querySelectorAll('.admin-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      showAdminSection(item.dataset.section);
    });
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    sessionStorage.removeItem('siler_admin_token');
    window.location.href = 'login.html';
  });

  // Load initial section
  showAdminSection('projects');
  loadAdminProjects();
  loadSubscribers();
}

function showAdminSection(section) {
  document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
  const el = document.getElementById(`section-${section}`);
  if (el) el.style.display = 'block';
}

// ── Admin Projects ──
async function loadAdminProjects() {
  try {
    const res = await fetch(`${API_BASE}/projects?all=1`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    projects = await res.json();
  } catch {
    projects = [];
  }
  renderAdminProjectList();
}

function renderAdminProjectList() {
  const container = document.getElementById('admin-project-list');
  if (!container) return;

  if (!projects.length) {
    container.innerHTML = `<div style="padding:3rem;text-align:center;font-family:var(--font-mono);font-size:0.8rem;color:var(--ink-light);">No projects yet. Create your first one above.</div>`;
    return;
  }

  container.innerHTML = projects.map((p, i) => `
    <div class="admin-project-item">
      <div class="admin-project-num">${String(i+1).padStart(2,'0')}</div>
      <div class="admin-project-info">
        <div class="admin-project-title">${p.title}</div>
        <div class="admin-project-meta">${p.typeLabel} · ${formatDate(p.date)} · <span class="status status--${p.status}">${p.status}</span></div>
      </div>
      <div class="admin-project-actions">
        <button class="admin-action-btn" onclick="editProject('${p.id}')">Edit</button>
        <button class="admin-action-btn" onclick="togglePublish('${p.id}','${p.status}')">${p.status === 'published' ? 'Unpublish' : 'Publish'}</button>
        <button class="admin-action-btn admin-action-btn--danger" onclick="confirmDelete('${p.id}','${escapeAttr(p.title)}')">Delete</button>
      </div>
    </div>`).join('');
}

function openProjectEditor(project = null) {
  editingProjectId = project?.id || null;
  const section = document.getElementById('section-editor');
  const listSection = document.getElementById('section-projects');

  if (listSection) listSection.style.display = 'none';
  if (section) section.style.display = 'block';

  document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));

  // Populate form
  document.getElementById('editor-title').value = project?.title || '';
  document.getElementById('editor-type').value = project?.type || 'blender';
  document.getElementById('editor-synopsis').value = project?.synopsis || '';
  document.getElementById('editor-date').value = project?.date || new Date().toISOString().split('T')[0];
  document.getElementById('editor-external').value = project?.externalUrl || '';
  document.getElementById('editor-status').value = project?.status || 'draft';
  document.getElementById('editor-images').value = project?.images?.join('\n') || '';

  const content = document.getElementById('editor-content');
  if (content) content.innerHTML = project?.content || '';

  document.getElementById('editor-heading').textContent = project ? `Edit: ${project.title}` : 'New Project';
}

window.editProject = function(id) {
  const p = projects.find(x => x.id === id);
  if (p) openProjectEditor(p);
};

window.newProject = function() {
  openProjectEditor(null);
};

window.cancelEditor = function() {
  showAdminSection('projects');
  document.querySelector('[data-section="projects"]')?.classList.add('active');
};

window.saveProject = async function() {
  const title = document.getElementById('editor-title').value.trim();
  const type = document.getElementById('editor-type').value;
  const synopsis = document.getElementById('editor-synopsis').value.trim();
  const date = document.getElementById('editor-date').value;
  const externalUrl = document.getElementById('editor-external').value.trim();
  const status = document.getElementById('editor-status').value;
  const content = document.getElementById('editor-content').innerHTML;
  const imagesRaw = document.getElementById('editor-images').value.trim();
  const images = imagesRaw ? imagesRaw.split('\n').map(s=>s.trim()).filter(Boolean) : [];

  const typeLabels = { blender: 'Blender Addon', plugin: 'Plugin', unreal: 'Unreal Engine', game: 'Game', html5: 'HTML5 Game' };

  const payload = {
    title, type, typeLabel: typeLabels[type] || type, synopsis,
    date, externalUrl, status, content, images,
    id: editingProjectId || slugify(title)
  };

  if (!title) { alert('Title is required.'); return; }

  const btn = document.getElementById('save-btn');
  btn.textContent = 'Saving...';
  btn.disabled = true;

  try {
    const method = editingProjectId ? 'PUT' : 'POST';
    const url = editingProjectId ? `${API_BASE}/projects/${editingProjectId}` : `${API_BASE}/projects`;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      await loadAdminProjects();
      cancelEditor();
      showToast('Project saved!');
    } else {
      const d = await res.json();
      alert(d.error || 'Save failed.');
    }
  } catch {
    alert('Connection error.');
  } finally {
    btn.textContent = 'Save Project';
    btn.disabled = false;
  }
};

window.togglePublish = async function(id, currentStatus) {
  const newStatus = currentStatus === 'published' ? 'draft' : 'published';
  try {
    await fetch(`${API_BASE}/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ status: newStatus })
    });
    await loadAdminProjects();
    showToast(`Project ${newStatus}.`);
  } catch {
    alert('Could not update status.');
  }
};

let deleteTargetId = null;
window.confirmDelete = function(id, title) {
  deleteTargetId = id;
  document.getElementById('delete-target-name').textContent = title;
  document.getElementById('delete-modal').classList.add('show');
};

window.cancelDelete = function() {
  document.getElementById('delete-modal').classList.remove('show');
  deleteTargetId = null;
};

window.confirmDeleteProject = async function() {
  if (!deleteTargetId) return;
  try {
    await fetch(`${API_BASE}/projects/${deleteTargetId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    cancelDelete();
    await loadAdminProjects();
    showToast('Project deleted.');
  } catch {
    alert('Could not delete.');
  }
};

// ── Rich Text Editor ──
window.execEditorCmd = function(cmd, value = null) {
  document.getElementById('editor-content').focus();
  document.execCommand(cmd, false, value);
};

window.insertImage = function() {
  const url = prompt('Paste image URL (PostImages, Imgur, etc.):');
  if (url) document.execCommand('insertImage', false, url);
};

window.insertLink = function() {
  const url = prompt('Enter URL:');
  if (url) document.execCommand('createLink', false, url);
};

// ── Subscribers ──
async function loadSubscribers() {
  try {
    const res = await fetch(`${API_BASE}/subscribers`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    subscribers = await res.json();
  } catch {
    subscribers = [];
  }
  renderSubscribersTable();
  updateSubscriberCount();
}

function renderSubscribersTable() {
  const tbody = document.getElementById('subscribers-tbody');
  if (!tbody) return;

  if (!subscribers.length) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--ink-light);padding:2rem;">No subscribers yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = subscribers.map(s => `
    <tr>
      <td>${s.name || '—'}</td>
      <td>${s.email}</td>
      <td>${formatDate(s.date)}</td>
    </tr>`).join('');
}

function updateSubscriberCount() {
  const el = document.getElementById('subscriber-count');
  if (el) el.textContent = subscribers.length;
}

// ── Newsletter Broadcast ──
window.sendNewsletter = async function() {
  const subject = document.getElementById('nl-subject').value.trim();
  const body = document.getElementById('nl-body').value.trim();
  if (!subject || !body) { alert('Subject and body are required.'); return; }
  if (!confirm(`Send newsletter to ${subscribers.length} subscribers?`)) return;

  const btn = document.getElementById('nl-send-btn');
  btn.textContent = 'Sending...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/newsletter/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ subject, body })
    });
    if (res.ok) {
      showToast(`Newsletter sent to ${subscribers.length} subscribers.`);
      document.getElementById('nl-subject').value = '';
      document.getElementById('nl-body').value = '';
    } else {
      const d = await res.json();
      alert(d.error || 'Send failed.');
    }
  } catch {
    alert('Connection error.');
  } finally {
    btn.textContent = 'Send Newsletter';
    btn.disabled = false;
  }
};

// ── Helpers ──
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-IE', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeAttr(str) {
  return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

let toastTimer;
function showToast(msg) {
  let toast = document.getElementById('admin-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'admin-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}
