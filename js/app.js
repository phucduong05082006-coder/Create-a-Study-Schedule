/**
 * APP.JS - Application Orchestrator, SPA Navigation, Global Search, Theme & Modals
 * StudyTracker Application
 */

const App = {
  activeView: "dashboard",
  confirmCallback: null,

  init() {
    // 1. Initialize Sample Data if first run
    StorageService.initDefaultDataIfEmpty(false);

    // 2. Initialize Theme (Dark/Light)
    this.initTheme();

    // 3. Initialize Notification Service
    NotificationService.init();

    // 4. Setup Event Listeners & Modals
    this.bindEvents();

    // 5. Populate Header Semester Selector
    this.populateHeaderSemesters();

    // 6. Initialize Core Modules
    AuthService.init();
    TimerModule.init();
    DashboardModule.init();
    SubjectsModule.init();
    TasksModule.init();
    ScheduleModule.init();
    StudyPlanModule.init();
    GoalsModule.init();
    StatisticsModule.init();
    HistoryModule.init();
    GradesModule.init();
    NotesModule.init();
    SettingsModule.init();

    // 7. Initial view
    this.navigateTo("dashboard");

    console.log("StudyTracker Application Initialized Successfully.");
  },

  // --- Theme Engine (Light / Dark Mode) ---
  initTheme() {
    const settings = StorageService.getSettings() || {};
    const savedTheme = (settings.preferences && settings.preferences.theme) || "light";
    this.applyTheme(savedTheme);

    const btnToggle = document.getElementById("theme-toggle-btn");
    if (btnToggle) {
      btnToggle.addEventListener("click", () => this.toggleTheme());
    }
  },

  applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      const icon = document.querySelector("#theme-toggle-btn i");
      if (icon) icon.className = "fa-solid fa-sun";
    } else {
      document.documentElement.removeAttribute("data-theme");
      const icon = document.querySelector("#theme-toggle-btn i");
      if (icon) icon.className = "fa-solid fa-moon";
    }

    // Update charts theme if already rendered
    if (DashboardModule.chartInstance) DashboardModule.renderWeeklyChart();
    if (StatisticsModule.hoursChart) StatisticsModule.render();
  },

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    this.applyTheme(newTheme);

    const settings = StorageService.getSettings() || {};
    if (!settings.preferences) settings.preferences = {};
    settings.preferences.theme = newTheme;
    StorageService.saveSettings(settings);

    NotificationService.showToast(`Đã chuyển sang chế độ ${newTheme === 'dark' ? 'Tối (Dark Mode)' : 'Sáng (Light Mode)'}`, "info", 1500);
  },

  // --- SPA Navigation ---
  navigateTo(viewId) {
    this.activeView = viewId;

    // Hide all view sections
    document.querySelectorAll(".view-section").forEach(sec => {
      sec.classList.remove("active");
    });

    // Show target view
    const target = document.getElementById(`view-${viewId}`);
    if (target) {
      target.classList.add("active");
    }

    // Update sidebar navigation items
    document.querySelectorAll(".sidebar-nav .nav-item").forEach(item => {
      if (item.dataset.view === viewId) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Update mobile bottom nav items
    document.querySelectorAll(".mobile-bottom-nav .bottom-nav-item").forEach(item => {
      if (item.dataset.view === viewId) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Close mobile drawer if open
    this.closeMobileSidebar();

    // Trigger view-specific re-renders
    if (viewId === "dashboard") DashboardModule.render();
    if (viewId === "subjects") SubjectsModule.render();
    if (viewId === "tasks") TasksModule.render();
    if (viewId === "schedule") ScheduleModule.render();
    if (viewId === "study-plan") StudyPlanModule.render();
    if (viewId === "goals") GoalsModule.render();
    if (viewId === "statistics") StatisticsModule.render();
    if (viewId === "history") HistoryModule.render();
    if (viewId === "grades") GradesModule.render();
    if (viewId === "notes") NotesModule.render();
    if (viewId === "settings") SettingsModule.render();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  // --- Header Semester Dropdown ---
  populateHeaderSemesters() {
    const select = document.getElementById("header-semester-select");
    if (!select) return;

    const semesters = StorageService.getSemesters();
    const settings = StorageService.getSettings() || {};
    const activeSem = (settings.preferences || {}).activeSemester;

    select.innerHTML = semesters.map(sem => `
      <option value="${sem.id}" ${sem.id === activeSem ? 'selected' : ''}>
        ${sem.name}
      </option>
    `).join("");

    select.onchange = (e) => {
      SettingsModule.setActiveSemester(e.target.value);
    };
  },

  // --- Modals System ---
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  },

  closeModal() {
    document.querySelectorAll(".modal-overlay").forEach(modal => {
      modal.classList.remove("active");
    });
    document.body.style.overflow = "";
    this.confirmCallback = null;
  },

  confirm(message, onConfirm) {
    this.confirmCallback = onConfirm;
    const msgEl = document.getElementById("confirm-dialog-message");
    if (msgEl) msgEl.textContent = message;
    this.openModal("modal-confirm-dialog");
  },

  // --- Mobile Sidebar Controls ---
  toggleMobileSidebar() {
    const sidebar = document.getElementById("app-sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    if (sidebar && backdrop) {
      sidebar.classList.toggle("mobile-open");
      backdrop.classList.toggle("active");
    }
  },

  closeMobileSidebar() {
    const sidebar = document.getElementById("app-sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    if (sidebar && backdrop) {
      sidebar.classList.remove("mobile-open");
      backdrop.classList.remove("active");
    }
  },

  // --- Global Search System ---
  bindEvents() {
    // Navigation click handler
    document.querySelectorAll("[data-view]").forEach(elem => {
      elem.addEventListener("click", (e) => {
        e.preventDefault();
        const v = e.currentTarget.dataset.view;
        if (v) this.navigateTo(v);
      });
    });

    // Mobile sidebar toggle button
    const btnMenu = document.getElementById("menu-toggle-btn");
    if (btnMenu) {
      btnMenu.addEventListener("click", () => this.toggleMobileSidebar());
    }

    const backdrop = document.getElementById("sidebar-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", () => this.closeMobileSidebar());
    }

    // Modal Close Buttons & Backdrop click
    document.querySelectorAll(".modal-close-btn, .btn-modal-cancel").forEach(btn => {
      btn.addEventListener("click", () => this.closeModal());
    });

    document.querySelectorAll(".modal-overlay").forEach(overlay => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          this.closeModal();
        }
      });
    });

    // Confirm dialog submit
    const btnConfirmOk = document.getElementById("btn-confirm-ok");
    if (btnConfirmOk) {
      btnConfirmOk.addEventListener("click", () => {
        if (typeof this.confirmCallback === "function") {
          this.confirmCallback();
        }
        this.closeModal();
      });
    }

    // Escape key closes modals
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeModal();
      }
      // Ctrl+K or / focuses Global Search
      if ((e.ctrlKey && e.key === "k") || (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA")) {
        e.preventDefault();
        const searchInput = document.getElementById("global-search-input");
        if (searchInput) searchInput.focus();
      }
    });

    // Notification center bell toggle
    const btnBell = document.getElementById("btn-notification-bell");
    const drawer = document.getElementById("notification-drawer");
    if (btnBell && drawer) {
      btnBell.addEventListener("click", (e) => {
        e.stopPropagation();
        drawer.classList.toggle("active");
        NotificationService.updateNotificationBadge();
      });

      document.addEventListener("click", (e) => {
        if (!drawer.contains(e.target) && e.target !== btnBell) {
          drawer.classList.remove("active");
        }
      });
    }

    // Global Search Input
    const searchInput = document.getElementById("global-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.handleGlobalSearch(e.target.value.trim());
      });
      searchInput.addEventListener("focus", (e) => {
        if (e.target.value.trim().length > 0) {
          this.handleGlobalSearch(e.target.value.trim());
        }
      });
    }
  },

  handleGlobalSearch(query) {
    const resultsModal = document.getElementById("modal-search-results");
    const listContainer = document.getElementById("search-results-list");
    if (!resultsModal || !listContainer) return;

    if (!query) {
      this.closeModal();
      return;
    }

    const q = query.toLowerCase();
    const subjects = StorageService.getSubjects();
    const tasks = StorageService.getTasks();
    const notes = StorageService.getNotes();
    const goals = StorageService.getGoals();

    const matches = [];

    // Subjects
    subjects.forEach(s => {
      if (s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)) {
        matches.push({
          type: "Môn học",
          icon: "fa-book",
          color: s.color,
          title: s.name,
          sub: `${s.code} • ${s.credits} Tín chỉ`,
          view: "subjects"
        });
      }
    });

    // Tasks
    tasks.forEach(t => {
      if (t.title.toLowerCase().includes(q)) {
        matches.push({
          type: "Công việc",
          icon: "fa-list-check",
          color: "var(--primary)",
          title: t.title,
          sub: `Hạn: ${t.deadline ? new Date(t.deadline).toLocaleDateString("vi-VN") : 'Không có'}`,
          view: "tasks"
        });
      }
    });

    // Notes
    notes.forEach(n => {
      if (n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) {
        matches.push({
          type: "Ghi chú",
          icon: "fa-note-sticky",
          color: "var(--accent)",
          title: n.title,
          sub: n.content.substring(0, 60) + "...",
          view: "notes"
        });
      }
    });

    // Goals
    goals.forEach(g => {
      if (g.title.toLowerCase().includes(q)) {
        matches.push({
          type: "Mục tiêu",
          icon: "fa-bullseye",
          color: "var(--warning)",
          title: g.title,
          sub: `Tiến độ: ${g.progress}%`,
          view: "goals"
        });
      }
    });

    if (matches.length === 0) {
      listContainer.innerHTML = `
        <div style="padding:2rem;text-align:center;color:var(--text-muted);font-size:0.9rem;">
          Không tìm thấy kết quả nào khớp với "<strong>${query}</strong>"
        </div>
      `;
    } else {
      listContainer.innerHTML = matches.map(m => `
        <div class="task-item" onclick="App.navigateTo('${m.view}'); App.closeModal();" style="cursor:pointer;margin-bottom:0.5rem;">
          <div class="task-left">
            <div style="width:34px;height:34px;border-radius:var(--radius-sm);background-color:${m.color}22;color:${m.color};display:flex;align-items:center;justify-content:center;">
              <i class="fa-solid ${m.icon}"></i>
            </div>
            <div>
              <div style="font-weight:700;font-size:0.9rem;color:var(--text-primary);">${m.title}</div>
              <div style="font-size:0.775rem;color:var(--text-muted);">${m.sub}</div>
            </div>
          </div>
          <span class="badge badge-priority-low">${m.type}</span>
        </div>
      `).join("");
    }

    this.openModal("modal-search-results");
  }
};

// Bootstrap when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});

