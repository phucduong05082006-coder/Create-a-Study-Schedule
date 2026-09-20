/**
 * GOALS.JS - Academic Goals, Milestones & Progress Tracking
 * StudyTracker Application
 */

const GoalsModule = {
  activeTypeFilter: "all", // 'all' | 'short_term' | 'medium_term' | 'long_term'

  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    const btnAdd = document.getElementById("btn-add-goal");
    if (btnAdd) {
      btnAdd.addEventListener("click", () => this.openAddModal());
    }

    const form = document.getElementById("form-goal");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveGoal();
      });
    }

    // Filter tabs
    document.querySelectorAll(".goal-filter-tab").forEach(tab => {
      tab.addEventListener("click", (e) => {
        document.querySelectorAll(".goal-filter-tab").forEach(t => t.classList.remove("active"));
        e.currentTarget.classList.add("active");
        this.activeTypeFilter = e.currentTarget.dataset.type || "all";
        this.render();
      });
    });
  },

  getTypeLabel(type) {
    switch (type) {
      case "short_term": return "Ngắn hạn";
      case "medium_term": return "Trung hạn";
      case "long_term": return "Dài hạn";
      default: return type;
    }
  },

  render() {
    const container = document.getElementById("goals-list-container");
    if (!container) return;

    let goals = StorageService.getGoals();

    if (this.activeTypeFilter !== "all") {
      goals = goals.filter(g => g.type === this.activeTypeFilter);
    }

    if (goals.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <i class="fa-solid fa-bullseye empty-state-icon"></i>
          <div class="empty-state-title">Chưa có mục tiêu học tập nào</div>
          <p class="empty-state-desc">Đặt mục tiêu giúp bạn có động lực bứt phá và theo sát lộ trình cá nhân.</p>
          <button class="btn btn-primary btn-sm" onclick="GoalsModule.openAddModal()">
            <i class="fa-solid fa-plus"></i> Đặt mục tiêu mới
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = goals.map(g => {
      const isDone = g.completed || g.progress >= 100;
      let badgeTypeClass = "badge-status-in_progress";
      if (g.type === "long_term") badgeTypeClass = "badge-priority-urgent";
      else if (g.type === "medium_term") badgeTypeClass = "badge-priority-high";

      return `
        <div class="card" style="padding:1.25rem;display:flex;flex-direction:column;gap:0.85rem;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;">
            <span class="badge ${badgeTypeClass}">
              <i class="fa-solid fa-flag"></i> ${this.getTypeLabel(g.type)}
            </span>
            <div style="display:flex;gap:0.3rem;">
              <button class="btn btn-secondary btn-icon btn-sm" onclick="GoalsModule.openEditModal('${g.id}')" title="Sửa mục tiêu">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="btn btn-secondary btn-icon btn-sm" onclick="GoalsModule.deleteGoal('${g.id}')" title="Xóa">
                <i class="fa-solid fa-trash-can" style="color:var(--danger);"></i>
              </button>
            </div>
          </div>

          <div>
            <h3 style="font-size:1.05rem;font-weight:700;color:var(--text-primary);margin-bottom:0.25rem;">
              ${g.title}
            </h3>
            ${g.description ? `<p style="font-size:0.825rem;color:var(--text-muted);">${g.description}</p>` : ''}
          </div>

          <div>
            <div class="progress-meta">
              <span style="font-size:0.8rem;color:var(--text-secondary);">Tiến độ: <strong>${g.target || ''}</strong></span>
              <span style="font-weight:700;color:var(--primary);">${g.progress}%</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-fill ${isDone ? 'success' : 'accent'}" style="width:${g.progress}%;"></div>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:0.6rem;border-top:1px solid var(--border-light);font-size:0.8rem;">
            <span style="color:var(--text-muted);">
              <i class="fa-regular fa-calendar"></i> Hạn chót: ${g.deadline ? new Date(g.deadline).toLocaleDateString("vi-VN") : 'Không có'}
            </span>
            <button class="btn btn-sm ${isDone ? 'btn-success' : 'btn-outline'}" onclick="GoalsModule.toggleComplete('${g.id}')">
              <i class="fa-solid ${isDone ? 'fa-check' : 'fa-circle-check'}"></i> ${isDone ? 'Đã đạt' : 'Hoàn thành'}
            </button>
          </div>
        </div>
      `;
    }).join("");
  },

  openAddModal() {
    document.getElementById("modal-goal-title").textContent = "Đặt mục tiêu học tập mới";
    document.getElementById("form-goal").reset();
    document.getElementById("goal-id-input").value = "";
    document.getElementById("goal-progress-input").value = 0;
    document.getElementById("goal-progress-val-display").textContent = "0%";
    App.openModal("modal-goal");
  },

  openEditModal(id) {
    const goals = StorageService.getGoals();
    const g = goals.find(item => item.id === id);
    if (!g) return;

    document.getElementById("modal-goal-title").textContent = "Chỉnh sửa mục tiêu";
    document.getElementById("goal-id-input").value = g.id;
    document.getElementById("goal-title-input").value = g.title;
    document.getElementById("goal-type-select").value = g.type || "medium_term";
    document.getElementById("goal-target-input").value = g.target || "";
    document.getElementById("goal-progress-input").value = g.progress || 0;
    document.getElementById("goal-progress-val-display").textContent = `${g.progress || 0}%`;
    document.getElementById("goal-deadline-input").value = g.deadline || "";
    document.getElementById("goal-desc-input").value = g.description || "";

    App.openModal("modal-goal");
  },

  saveGoal() {
    const id = document.getElementById("goal-id-input").value;
    const title = document.getElementById("goal-title-input").value.trim();
    const type = document.getElementById("goal-type-select").value;
    const target = document.getElementById("goal-target-input").value.trim();
    const progress = parseInt(document.getElementById("goal-progress-input").value, 10) || 0;
    const deadline = document.getElementById("goal-deadline-input").value;
    const description = document.getElementById("goal-desc-input").value.trim();

    if (!title) {
      NotificationService.showToast("Vui lòng nhập tên mục tiêu!", "warning");
      return;
    }

    const goals = StorageService.getGoals();

    if (id) {
      const idx = goals.findIndex(g => g.id === id);
      if (idx !== -1) {
        goals[idx] = {
          ...goals[idx],
          title, type, target, progress, deadline, description,
          completed: progress >= 100
        };
        NotificationService.showToast("✓ Đã cập nhật mục tiêu!", "success");
      }
    } else {
      const newGoal = {
        id: "goal-" + Date.now(),
        title,
        type,
        target,
        progress,
        deadline,
        description,
        completed: progress >= 100
      };
      goals.push(newGoal);
      NotificationService.showToast("✓ Đã đặt mục tiêu mới!", "success");
    }

    StorageService.saveGoals(goals);
    App.closeModal();
    this.render();
    DashboardModule.render();
  },

  toggleComplete(id) {
    const goals = StorageService.getGoals();
    const g = goals.find(item => item.id === id);
    if (!g) return;

    if (g.completed) {
      g.completed = false;
      g.progress = 50;
      NotificationService.showToast("Đã mở lại mục tiêu", "info");
    } else {
      g.completed = true;
      g.progress = 100;
      NotificationService.showToast("🎉 Chúc mừng bạn đã hoàn thành xuất sắc mục tiêu!", "success");
    }

    StorageService.saveGoals(goals);
    this.render();
    DashboardModule.render();
  },

  deleteGoal(id) {
    App.confirm("Bạn có muốn xóa mục tiêu này không?", () => {
      let goals = StorageService.getGoals();
      goals = goals.filter(g => g.id !== id);
      StorageService.saveGoals(goals);
      NotificationService.showToast("✓ Đã xóa mục tiêu", "info");
      this.render();
      DashboardModule.render();
    });
  }
};

