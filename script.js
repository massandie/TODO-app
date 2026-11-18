/* ============================================================
   TASKFLOW — script.js
   Logique de l'application : CRUD, filtres, tri, recherche,
   localStorage, thème clair/sombre, notifications.
   ============================================================ */

(() => {
  'use strict';

  /* ----------------------- CONSTANTES ----------------------- */
  const THEME_KEY = 'taskflow.theme';
  const USERS_KEY = 'taskflow.users';
  const SESSION_KEY = 'taskflow.session';

  const CATEGORY_LABELS = {
    travail: 'Travail',
    personnel: 'Personnel',
    etudes: 'Études',
    sante: 'Santé',
    maison: 'Maison',
    autre: 'Autre',
  };

  const PRIORITY_LABELS = { high: 'Élevée', medium: 'Moyenne', low: 'Faible' };
  const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
  const PRIORITY_COLOR_VAR = { high: '--priority-high', medium: '--priority-medium', low: '--priority-low' };

  /* ----------------------- ÉTAT ----------------------- */
  let currentUser = null;
  let tasks = [];
  let state = {
    view: 'dashboard',      // dashboard | all | active | completed | categories | stats
    search: '',
    category: 'all',
    priority: 'all',
    sort: 'date-asc',
  };
  let pendingDeleteId = null;
  let pendingClearCompleted = false;

  /* ----------------------- RÉFÉRENCES DOM ----------------------- */
  const el = (id) => document.getElementById(id);

  const authScreen = el('authScreen');
  const appRoot = el('appRoot');
  const authTabs = document.querySelectorAll('.auth-tab');
  const loginForm = el('loginForm');
  const loginEmail = el('loginEmail');
  const loginPassword = el('loginPassword');
  const loginError = el('loginError');
  const registerForm = el('registerForm');
  const registerName = el('registerName');
  const registerEmail = el('registerEmail');
  const registerPassword = el('registerPassword');
  const registerConfirm = el('registerConfirm');
  const registerError = el('registerError');
  const logoutBtn = el('logoutBtn');
  const greetingText = el('greetingText');
  const avatar = el('avatar');

  const sidebar = el('sidebar');
  const overlay = el('overlay');
  const menuBtn = el('menuBtn');
  const sidebarClose = el('sidebarClose');
  const navItems = document.querySelectorAll('.nav-item');

  const themeToggle = el('themeToggle');
  const themeIcon = el('themeIcon');
  const themeLabel = el('themeLabel');

  const headerDate = el('headerDate');
  const searchInput = el('searchInput');
  const newTaskBtn = el('newTaskBtn');

  const statTotal = el('statTotal');
  const statDone = el('statDone');
  const statPending = el('statPending');
  const statProgressValue = el('statProgressValue');
  const progressFill = el('progressFill');

  const categoryFilter = el('categoryFilter');
  const priorityFilter = el('priorityFilter');
  const sortSelect = el('sortSelect');
  const clearCompletedBtn = el('clearCompletedBtn');

  const dashboard = el('dashboard');
  const toolbar = document.querySelector('.toolbar');
  const tasksSection = document.querySelector('.tasks-section');
  const categoriesView = el('categoriesView');
  const statsView = el('statsView');
  const categoriesGrid = el('categoriesGrid');
  const priorityBars = el('priorityBars');
  const categoryBars = el('categoryBars');

  const viewTitle = el('viewTitle');
  const tasksCount = el('tasksCount');
  const taskList = el('taskList');
  const emptyState = el('emptyState');

  const modalOverlay = el('modalOverlay');
  const modalTitle = el('modalTitle');
  const taskForm = el('taskForm');
  const taskIdInput = el('taskId');
  const taskTitleInput = el('taskTitle');
  const titleError = el('titleError');
  const taskDescriptionInput = el('taskDescription');
  const taskCategoryInput = el('taskCategory');
  const taskPriorityInput = el('taskPriority');
  const taskDueDateInput = el('taskDueDate');
  const modalClose = el('modalClose');
  const cancelBtn = el('cancelBtn');

  const confirmOverlay = el('confirmOverlay');
  const confirmTitle = el('confirmTitle');
  const confirmMessage = el('confirmMessage');
  const confirmCancel = el('confirmCancel');
  const confirmOk = el('confirmOk');

  const toastContainer = el('toastContainer');

  /* ----------------------- UTILITAIRES ----------------------- */
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const refreshIcons = () => {
    if (window.lucide) window.lucide.createIcons();
  };

  const formatDateLong = (date) =>
    date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const formatDateShort = (isoDate) => {
    const [y, m, d] = isoDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const isOverdue = (isoDate, completed) => {
    if (!isoDate || completed) return false;
    const [y, m, d] = isoDate.split('-').map(Number);
    const due = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  const escapeHtml = (str) =>
    String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));

  /* ----------------------- LOCALSTORAGE : TÂCHES (par compte) ----------------------- */
  const getTasksKey = () => `taskflow.tasks.${currentUser.email}`;

  const loadTasks = () => {
    try {
      const raw = localStorage.getItem(getTasksKey());
      tasks = raw ? JSON.parse(raw) : seedTasks();
    } catch {
      tasks = seedTasks();
    }
  };

  const saveTasks = () => {
    localStorage.setItem(getTasksKey(), JSON.stringify(tasks));
  };

  const seedTasks = () => {
    const today = new Date();
    const inDays = (n) => {
      const d = new Date(today);
      d.setDate(d.getDate() + n);
      return d.toISOString().slice(0, 10);
    };
    return [
      {
        id: uid(), title: 'Préparer la présentation client', description: 'Slides + chiffres clés du trimestre',
        category: 'travail', priority: 'high', dueDate: inDays(1), completed: false, createdAt: Date.now() - 300000,
      },
      {
        id: uid(), title: 'Faire les courses', description: '', category: 'maison', priority: 'low',
        dueDate: inDays(0), completed: false, createdAt: Date.now() - 200000,
      },
      {
        id: uid(), title: 'Réviser le chapitre 4', description: 'Algèbre linéaire', category: 'etudes',
        priority: 'medium', dueDate: inDays(3), completed: true, createdAt: Date.now() - 100000,
      },
    ];
  };

  /* ----------------------- THÈME ----------------------- */
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    themeIcon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
    themeLabel.textContent = theme === 'dark' ? 'Mode clair' : 'Mode sombre';
    refreshIcons();
  };

  const initTheme = () => {
    const saved = localStorage.getItem(THEME_KEY);
    const theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(theme);
  };

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });

  /* ----------------------- AUTHENTIFICATION ----------------------- */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const loadUsers = () => {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch {
      return [];
    }
  };

  const saveUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

  const randomSalt = () =>
    Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, '0')).join('');

  // Hash SHA-256 (Web Crypto). Repli si l'API est indisponible (contexte non sécurisé).
  const hashPassword = async (password, salt) => {
    const text = salt + password;
    if (window.crypto && window.crypto.subtle) {
      try {
        const buffer = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
      } catch {
        /* repli ci-dessous */
      }
    }
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    return `fallback:${hash.toString(16)}`;
  };

  const getInitials = (name) =>
    name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  const setAuthError = (node, message) => { node.textContent = message; };

  const startApp = (user) => {
    currentUser = user;
    authScreen.hidden = true;
    appRoot.hidden = false;
    avatar.textContent = getInitials(user.name) || 'U';
    avatar.title = user.name;
    greetingText.textContent = `Bonjour ${user.name.split(' ')[0]}, prêt à accomplir vos objectifs ?`;
    loadTasks();
    refreshIcons();
    render();
  };

  const openSession = (user) => {
    localStorage.setItem(SESSION_KEY, user.email);
    startApp(user);
  };

  authTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      authTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const isLogin = tab.dataset.tab === 'login';
      loginForm.hidden = !isLogin;
      registerForm.hidden = isLogin;
      setAuthError(loginError, '');
      setAuthError(registerError, '');
    });
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setAuthError(registerError, '');
    [registerName, registerEmail, registerPassword, registerConfirm].forEach((i) => i.classList.remove('input-error'));

    const name = registerName.value.trim();
    const email = registerEmail.value.trim().toLowerCase();
    const password = registerPassword.value;
    const confirm = registerConfirm.value;

    if (!name || !email || !password || !confirm) {
      setAuthError(registerError, 'Tous les champs sont obligatoires.');
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setAuthError(registerError, 'Adresse email invalide.');
      registerEmail.classList.add('input-error');
      return;
    }
    if (password.length < 6) {
      setAuthError(registerError, 'Le mot de passe doit contenir au moins 6 caractères.');
      registerPassword.classList.add('input-error');
      return;
    }
    if (password !== confirm) {
      setAuthError(registerError, 'Les mots de passe ne correspondent pas.');
      registerConfirm.classList.add('input-error');
      return;
    }

    const users = loadUsers();
    if (users.some((u) => u.email === email)) {
      setAuthError(registerError, 'Un compte existe déjà avec cet email.');
      registerEmail.classList.add('input-error');
      return;
    }

    const salt = randomSalt();
    const passwordHash = await hashPassword(password, salt);
    users.push({ name, email, salt, passwordHash, createdAt: Date.now() });
    saveUsers(users);

    showToast(`Bienvenue, ${name} !`, 'success');
    registerForm.reset();
    openSession({ name, email });
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setAuthError(loginError, '');
    [loginEmail, loginPassword].forEach((i) => i.classList.remove('input-error'));

    const email = loginEmail.value.trim().toLowerCase();
    const password = loginPassword.value;

    if (!email || !password) {
      setAuthError(loginError, 'Veuillez renseigner votre email et votre mot de passe.');
      return;
    }

    const users = loadUsers();
    const user = users.find((u) => u.email === email);
    if (!user) {
      setAuthError(loginError, 'Email ou mot de passe incorrect.');
      loginEmail.classList.add('input-error');
      return;
    }

    const hash = await hashPassword(password, user.salt);
    if (hash !== user.passwordHash) {
      setAuthError(loginError, 'Email ou mot de passe incorrect.');
      loginPassword.classList.add('input-error');
      return;
    }

    showToast(`Content de vous revoir, ${user.name} !`, 'success');
    loginForm.reset();
    openSession(user);
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(SESSION_KEY);
    currentUser = null;
    appRoot.hidden = true;
    authScreen.hidden = false;
    closeSidebar();
    loginForm.reset();
    registerForm.reset();
    showToast('Déconnexion réussie.', 'info');
  });

  /* ----------------------- SIDEBAR MOBILE ----------------------- */
  const openSidebar = () => {
    sidebar.classList.add('open');
    overlay.classList.add('open');
  };
  const closeSidebar = () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  };
  menuBtn.addEventListener('click', openSidebar);
  sidebarClose.addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);

  /* ----------------------- NAVIGATION ----------------------- */
  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      navItems.forEach((i) => i.classList.remove('active'));
      item.classList.add('active');
      state.view = item.dataset.view;
      closeSidebar();
      render();
    });
  });

  /* ----------------------- TOASTS ----------------------- */
  const showToast = (message, type = 'info') => {
    const icons = { success: 'check-circle-2', error: 'alert-circle', info: 'info' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i data-lucide="${icons[type]}"></i><span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);
    refreshIcons();
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  };

  /* ----------------------- CONFIRM DIALOG ----------------------- */
  const openConfirm = (title, message) => {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmOverlay.classList.add('open');
  };
  const closeConfirm = () => {
    confirmOverlay.classList.remove('open');
    pendingDeleteId = null;
    pendingClearCompleted = false;
  };
  confirmCancel.addEventListener('click', closeConfirm);
  confirmOverlay.addEventListener('click', (e) => { if (e.target === confirmOverlay) closeConfirm(); });

  confirmOk.addEventListener('click', () => {
    if (pendingDeleteId) {
      tasks = tasks.filter((t) => t.id !== pendingDeleteId);
      saveTasks();
      showToast('Tâche supprimée.', 'success');
      render();
    } else if (pendingClearCompleted) {
      const count = tasks.filter((t) => t.completed).length;
      tasks = tasks.filter((t) => !t.completed);
      saveTasks();
      showToast(`${count} tâche(s) terminée(s) supprimée(s).`, 'success');
      render();
    }
    closeConfirm();
  });

  /* ----------------------- MODAL TÂCHE ----------------------- */
  const openModal = (task = null) => {
    taskForm.reset();
    titleError.textContent = '';
    taskTitleInput.classList.remove('input-error');

    if (task) {
      modalTitle.textContent = 'Modifier la tâche';
      taskIdInput.value = task.id;
      taskTitleInput.value = task.title;
      taskDescriptionInput.value = task.description || '';
      taskCategoryInput.value = task.category;
      taskPriorityInput.value = task.priority;
      taskDueDateInput.value = task.dueDate || '';
    } else {
      modalTitle.textContent = 'Nouvelle tâche';
      taskIdInput.value = '';
      taskPriorityInput.value = 'medium';
    }

    modalOverlay.classList.add('open');
    setTimeout(() => taskTitleInput.focus(), 50);
  };

  const closeModal = () => {
    modalOverlay.classList.remove('open');
  };

  newTaskBtn.addEventListener('click', () => openModal());
  modalClose.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeConfirm();
    }
  });

  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = taskTitleInput.value.trim();
    if (!title) {
      titleError.textContent = 'Le titre est obligatoire.';
      taskTitleInput.classList.add('input-error');
      taskTitleInput.focus();
      return;
    }
    titleError.textContent = '';
    taskTitleInput.classList.remove('input-error');

    const id = taskIdInput.value;
    const payload = {
      title,
      description: taskDescriptionInput.value.trim(),
      category: taskCategoryInput.value,
      priority: taskPriorityInput.value,
      dueDate: taskDueDateInput.value,
    };

    if (id) {
      const task = tasks.find((t) => t.id === id);
      Object.assign(task, payload);
      showToast('Tâche mise à jour.', 'success');
    } else {
      tasks.push({
        id: uid(),
        ...payload,
        completed: false,
        createdAt: Date.now(),
      });
      showToast('Tâche ajoutée avec succès.', 'success');
    }

    saveTasks();
    closeModal();
    render();
  });

  /* ----------------------- ACTIONS TÂCHES ----------------------- */
  const toggleComplete = (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    saveTasks();
    render();
    if (task.completed) showToast('Tâche terminée. Bravo !', 'success');
  };

  const requestDelete = (id) => {
    pendingDeleteId = id;
    openConfirm('Supprimer la tâche', 'Cette action est irréversible. Voulez-vous vraiment supprimer cette tâche ?');
  };

  clearCompletedBtn.addEventListener('click', () => {
    if (!tasks.some((t) => t.completed)) {
      showToast('Aucune tâche terminée à supprimer.', 'info');
      return;
    }
    pendingClearCompleted = true;
    openConfirm('Vider les tâches terminées', 'Toutes les tâches marquées comme terminées seront définitivement supprimées.');
  });

  /* ----------------------- FILTRES / RECHERCHE / TRI ----------------------- */
  searchInput.addEventListener('input', (e) => {
    state.search = e.target.value.trim().toLowerCase();
    render();
  });
  categoryFilter.addEventListener('change', (e) => {
    state.category = e.target.value;
    render();
  });
  priorityFilter.addEventListener('change', (e) => {
    state.priority = e.target.value;
    render();
  });
  sortSelect.addEventListener('change', (e) => {
    state.sort = e.target.value;
    render();
  });

  const getFilteredTasks = () => {
    let list = [...tasks];

    if (state.view === 'active') list = list.filter((t) => !t.completed);
    if (state.view === 'completed') list = list.filter((t) => t.completed);

    if (state.category !== 'all') {
      list = list.filter((t) => t.category === state.category);
    }

    if (state.priority !== 'all') list = list.filter((t) => t.priority === state.priority);

    if (state.search) {
      list = list.filter((t) => t.title.toLowerCase().includes(state.search));
    }

    list.sort((a, b) => {
      switch (state.sort) {
        case 'date-desc':
          return (b.dueDate || '').localeCompare(a.dueDate || '');
        case 'priority':
          return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        case 'created':
          return b.createdAt - a.createdAt;
        case 'date-asc':
        default:
          return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
      }
    });

    return list;
  };

  /* ----------------------- RENDU : CARTE TÂCHE ----------------------- */
  const renderTaskCard = (task) => {
    const overdue = isOverdue(task.dueDate, task.completed);
    const dateTag = task.dueDate
      ? `<span class="tag tag-date ${overdue ? 'overdue' : ''}"><i data-lucide="calendar"></i>${formatDateShort(task.dueDate)}</span>`
      : '';

    return `
      <article class="task-card ${task.completed ? 'completed' : ''}" data-priority="${task.priority}" data-id="${task.id}">
        <button class="task-checkbox" data-action="toggle" aria-label="Marquer comme terminée">
          <i data-lucide="check"></i>
        </button>
        <div class="task-body">
          <h3 class="task-title">${escapeHtml(task.title)}</h3>
          ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
          <div class="task-meta">
            <span class="tag tag-category"><i data-lucide="folder"></i>${CATEGORY_LABELS[task.category] || 'Autre'}</span>
            <span class="tag tag-priority-${task.priority}"><i data-lucide="flag"></i>${PRIORITY_LABELS[task.priority]}</span>
            ${dateTag}
          </div>
        </div>
        <div class="task-actions">
          <button class="btn-icon" data-action="edit" aria-label="Modifier"><i data-lucide="pencil"></i></button>
          <button class="btn-icon danger" data-action="delete" aria-label="Supprimer"><i data-lucide="trash-2"></i></button>
        </div>
      </article>`;
  };

  taskList.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const card = e.target.closest('.task-card');
    const id = card.dataset.id;
    const action = btn.dataset.action;

    if (action === 'toggle') toggleComplete(id);
    if (action === 'delete') requestDelete(id);
    if (action === 'edit') {
      const task = tasks.find((t) => t.id === id);
      if (task) openModal(task);
    }
  });

  /* ----------------------- RENDU : LISTE ----------------------- */
  const VIEW_TITLES = {
    dashboard: 'Toutes les tâches',
    all: 'Toutes les tâches',
    active: 'Tâches actives',
    completed: 'Tâches terminées',
  };

  const renderList = () => {
    const list = getFilteredTasks();
    viewTitle.textContent = state.category !== 'all'
      ? `Catégorie : ${CATEGORY_LABELS[state.category]}`
      : (VIEW_TITLES[state.view] || 'Tâches');
    tasksCount.textContent = `${list.length} tâche${list.length === 1 ? '' : 's'}`;

    if (list.length === 0) {
      taskList.innerHTML = '';
      emptyState.hidden = false;
    } else {
      emptyState.hidden = true;
      taskList.innerHTML = list.map(renderTaskCard).join('');
    }
    refreshIcons();
  };

  /* ----------------------- RENDU : STATS DASHBOARD ----------------------- */
  const renderStats = () => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.completed).length;
    const pending = total - done;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);

    statTotal.textContent = total;
    statDone.textContent = done;
    statPending.textContent = pending;
    statProgressValue.textContent = `${pct}%`;
    progressFill.style.width = `${pct}%`;
  };

  /* ----------------------- RENDU : CATÉGORIES ----------------------- */
  const renderCategoriesView = () => {
    const counts = {};
    Object.keys(CATEGORY_LABELS).forEach((c) => (counts[c] = 0));
    tasks.forEach((t) => { counts[t.category] = (counts[t.category] || 0) + 1; });

    categoriesGrid.innerHTML = Object.entries(CATEGORY_LABELS).map(([key, label]) => `
      <div class="category-card" data-category="${key}">
        <div class="category-card-head">
          <span class="category-card-name">${label}</span>
          <i data-lucide="folder"></i>
        </div>
        <span class="category-card-count">${counts[key]} tâche${counts[key] === 1 ? '' : 's'}</span>
      </div>
    `).join('');
    refreshIcons();
  };

  categoriesGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.category-card');
    if (!card) return;
    state.view = 'all';
    state.category = card.dataset.category;
    categoryFilter.value = card.dataset.category;
    navItems.forEach((i) => i.classList.remove('active'));
    document.querySelector('[data-view="all"]').classList.add('active');
    render();
  });

  /* ----------------------- RENDU : STATISTIQUES ----------------------- */
  const renderStatsView = () => {
    const total = tasks.length || 1;

    const byPriority = { high: 0, medium: 0, low: 0 };
    tasks.forEach((t) => { byPriority[t.priority] = (byPriority[t.priority] || 0) + 1; });

    priorityBars.innerHTML = Object.entries(byPriority).map(([key, count]) => `
      <div class="bar-row">
        <div class="bar-row-head"><span>${PRIORITY_LABELS[key]}</span><span>${count}</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${(count / total) * 100}%; background:var(${PRIORITY_COLOR_VAR[key]})"></div></div>
      </div>
    `).join('');

    const byCategory = {};
    Object.keys(CATEGORY_LABELS).forEach((c) => (byCategory[c] = 0));
    tasks.forEach((t) => { byCategory[t.category] = (byCategory[t.category] || 0) + 1; });

    categoryBars.innerHTML = Object.entries(byCategory).map(([key, count]) => `
      <div class="bar-row">
        <div class="bar-row-head"><span>${CATEGORY_LABELS[key]}</span><span>${count}</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${(count / total) * 100}%; background:var(--violet)"></div></div>
      </div>
    `).join('');
  };

  /* ----------------------- COMMUTATION DE VUES ----------------------- */
  const toggleSections = () => {
    const showList = ['dashboard', 'all', 'active', 'completed'].includes(state.view);
    dashboard.hidden = state.view === 'categories' || state.view === 'stats';
    toolbar.hidden = !showList;
    tasksSection.hidden = !showList;
    categoriesView.hidden = state.view !== 'categories';
    statsView.hidden = state.view !== 'stats';
  };

  /* ----------------------- RENDU GLOBAL ----------------------- */
  const render = () => {
    toggleSections();
    renderStats();

    if (state.view === 'categories') {
      renderCategoriesView();
    } else if (state.view === 'stats') {
      renderStatsView();
    } else {
      renderList();
    }
  };

  /* ----------------------- INIT ----------------------- */
  const init = () => {
    headerDate.textContent = formatDateLong(new Date());
    initTheme();

    const sessionEmail = localStorage.getItem(SESSION_KEY);
    const user = sessionEmail ? loadUsers().find((u) => u.email === sessionEmail) : null;

    if (user) {
      startApp(user);
    } else {
      refreshIcons();
    }
  };

  init();
})();
