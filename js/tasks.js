/**
 * TASKS.JS - Task & Deadline Management, Priority Levels & Filters
 * StudyTracker Application
 */

const TasksModule = {
  activeFilter: "all", // 'all' | 'today' | 'upcoming' | 'completed' | 'overdue'
  sortBy: "deadline",  // 'deadline' | 'priority' | 'title'

  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    const btnAdd = document.getElementById("btn-add-task");
    if (btnAdd) {
      btnAdd.addEventListener("click", () => this.openAddModal());
    }

    const form = document.getElementById("form-task");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveTask();
      });
    }

    // Filter tabs
    document.querySelectorAll(".task-filter-tab").forEach(tab => {
      tab.addEventListener("click", (e) => {
        document.querySelectorAll(".task-filter-tab").forEach(t => t.classList.remove("active"));
        e.currentTarget.classList.add("active");
        this.activeFilter = e.currentTarget.dataset.filter || "all";
        this.render();
      });
    });

    const sortSelect = document.getElementById("task-sort-select");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        this.sortBy = e.target.value;
        this.render();
      });
    }
  },

  getPriorityText(p) {
    switch (p) {
      case "urgent": return "Khẩn cấp";
      case "high": return "Cao";
      case "medium": return "Trung bình";
      case "low": return "Thấp";
      default: return p;
    }
  },

  render() {
    const container = document.getElementById("tasks-list-container");
    if (!container) return;

    let tasks = StorageService.getTasks();
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Filter
    if (this.activeFilter === "today") {
      tasks = tasks.filter(t => t.deadline && t.deadline.startsWith(todayStr));
    } else if (this.activeFilter === "upcoming") {
      tasks = tasks.filter(t => t.status !== "completed" && t.deadline && new Date(t.deadline) > now);
    } else if (this.activeFilter === "completed") {
      tasks = tasks.filter(t => t.status === "completed");
    } else if (this.activeFilter === "overdue") {
      tasks = tasks.filter(t => t.status !== "completed" && t.deadline && new Date(t.deadline) < now);
    }

    // Sort
    tasks.sort((a, b) => {
      if (this.sortBy === "deadline") {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      } else if (this.sortBy === "priority") {
        const pOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
      } else {
        return a.title.localeCompare(b.title);
      }
    });

    if (tasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-regular fa-calendar-check empty-state-icon"></i>
          <div class="empty-state-title">Không tìm thấy công việc nào</div>
          <p class="empty-state-desc">Hãy thêm công việc mới hoặc thử chọn bộ lọc khác.</p>
          <button class="btn btn-primary btn-sm" onclick="TasksModule.openAddModal()">
            <i class="fa-solid fa-plus"></i> Thêm công việc
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = tasks.map(t => {
      const sub = StorageService.getSubjectById(t.subjectId);
      const isCompleted = t.status === "completed";
      const isOverdue = !isCompleted && t.deadline && new Date(t.deadline) < now;

      let deadlineText = "Không có deadline";
      if (t.deadline) {
        const d = new Date(t.deadline);
        deadlineText = `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}`;
      }

      return `
        <div class="task-item ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}">
          <div class="task-left">
            <div class="custom-checkbox ${isCompleted ? 'checked' : ''}" onclick="TasksModule.toggleComplete('${t.id}')">
              <i class="fa-solid fa-check"></i>
            </div>
            <div>
              <div class="task-title">${t.title}</div>
              <div class="task-meta">
                ${sub ? `<span style="color:${sub.color};font-weight:600;"><i class="fa-solid fa-book"></i> ${sub.name}</span>` : ''}
                <span style="color:${isOverdue ? 'var(--danger)' : 'inherit'};font-weight:${isOverdue ? '700' : '500'};">
                  <i class="fa-regular fa-calendar"></i> ${deadlineText} ${isOverdue ? '(Quá hạn)' : ''}
                </span>
                ${t.notes ? `<span title="${t.notes}"><i class="fa-regular fa-file-lines"></i> Có ghi chú</span>` : ''}
              </div>
            </div>
          </div>

          <div class="task-actions">
            <span class="badge badge-priority-${t.priority}">
              ${this.getPriorityText(t.priority)}
            </span>
            <button class="btn btn-secondary btn-icon btn-sm" onclick="TasksModule.openEditModal('${t.id}')" title="Sửa task">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn btn-secondary btn-icon btn-sm" onclick="TasksModule.deleteTask('${t.id}')" title="Xóa task">
              <i class="fa-solid fa-trash-can" style="color:var(--danger);"></i>
            </button>
          </div>
        </div>
      `;
    }).join("");
  },

  openAddModal() {
    document.getElementById("modal-task-title").textContent = "Thêm công việc mới";
    document.getElementById("form-task").reset();
    document.getElementById("task-id-input").value = "";

    // Set default deadline to tomorrow 23:59
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    const deadlineInput = document.getElementById("task-deadline-input");
    if (deadlineInput) deadlineInput.value = `${dateStr}T23:59`;

    this.populateSubjectSelect();
    App.openModal("modal-task");
  },

  openEditModal(id) {
    const tasks = StorageService.getTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    document.getElementById("modal-task-title").textContent = "Chỉnh sửa công việc";
    document.getElementById("task-id-input").value = task.id;
    document.getElementById("task-title-input").value = task.title;
    document.getElementById("task-deadline-input").value = task.deadline || "";
    document.getElementById("task-priority-select").value = task.priority || "medium";
    document.getElementById("task-status-select").value = task.status || "todo";
    document.getElementById("task-notes-input").value = task.notes || "";

    this.populateSubjectSelect(task.subjectId);
    App.openModal("modal-task");
  },

  populateSubjectSelect(selectedId = null) {
    const select = document.getElementById("task-subject-select");
    if (!select) return;
    const subjects = StorageService.getSubjects();
    select.innerHTML = `<option value="">-- Chọn môn học (tùy chọn) --</option>` +
      subjects.map(s => `<option value="${s.id}" ${s.id === selectedId ? 'selected' : ''}>${s.name} (${s.code})</option>`).join("");
  },

  saveTask() {
    const id = document.getElementById("task-id-input").value;
    const title = document.getElementById("task-title-input").value.trim();
    const subjectId = document.getElementById("task-subject-select").value || null;
    const deadline = document.getElementById("task-deadline-input").value;
    const priority = document.getElementById("task-priority-select").value;
    const status = document.getElementById("task-status-select").value;
    const notes = document.getElementById("task-notes-input").value.trim();

    if (!title) {
      NotificationService.showToast("Vui lòng nhập tên công việc!", "warning");
      return;
    }

    const tasks = StorageService.getTasks();

    if (id) {
      const idx = tasks.findIndex(t => t.id === id);
      if (idx !== -1) {
        tasks[idx] = {
          ...tasks[idx],
          title, subjectId, deadline, priority, status, notes,
          completedAt: status === "completed" ? (tasks[idx].completedAt || new Date().toISOString()) : null
        };
        NotificationService.showToast("✓ Đã cập nhật công việc!", "success");
      }
    } else {
      const newTask = {
        id: "task-" + Date.now(),
        title,
        subjectId,
        deadline,
        priority,
        status,
        notes,
        completedAt: status === "completed" ? new Date().toISOString() : null
      };
      tasks.unshift(newTask);
      NotificationService.showToast("✓ Đã thêm công việc mới!", "success");
    }

    StorageService.saveTasks(tasks);
    App.closeModal();
    this.render();
    DashboardModule.render();
    NotificationService.updateNotificationBadge();
  },

  toggleComplete(id) {
    const tasks = StorageService.getTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (task.status === "completed") {
      task.status = "todo";
      task.completedAt = null;
      NotificationService.showToast("Đã mở lại công việc", "info");
    } else {
      task.status = "completed";
      task.completedAt = new Date().toISOString();
      NotificationService.showToast("✓ Tuyệt vời! Đã hoàn thành công việc!", "success");
    }

    StorageService.saveTasks(tasks);
    this.render();
    DashboardModule.render();
    NotificationService.updateNotificationBadge();
  },

  deleteTask(id) {
    App.confirm("Bạn có muốn xóa công việc này không?", () => {
      let tasks = StorageService.getTasks();
      tasks = tasks.filter(t => t.id !== id);
      StorageService.saveTasks(tasks);
      NotificationService.showToast("✓ Đã xóa công việc", "info");
      this.render();
      DashboardModule.render();
      NotificationService.updateNotificationBadge();
    });
  }
};

