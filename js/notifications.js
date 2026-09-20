/**
 * NOTIFICATIONS.JS - Toast Notification System & In-App Alerts Center
 * StudyTracker Application
 */

const NotificationService = {
  container: null,

  init() {
    this.container = document.getElementById("toast-container");
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "toast-container";
      this.container.className = "toast-container";
      document.body.appendChild(this.container);
    }
    this.updateNotificationBadge();
  },

  // --- Show Toast Message ---
  showToast(message, type = "info", duration = 3500) {
    if (!this.container) this.init();

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconClass = "fa-circle-info";
    if (type === "success") iconClass = "fa-circle-check";
    if (type === "error") iconClass = "fa-circle-xmark";
    if (type === "warning") iconClass = "fa-triangle-exclamation";

    toast.innerHTML = `
      <i class="fa-solid ${iconClass} toast-icon"></i>
      <div class="toast-content">${message}</div>
      <button class="toast-close" style="margin-left:auto;color:var(--text-muted);font-size:0.8rem;padding:0.2rem;" aria-label="Đóng">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    toast.querySelector(".toast-close").addEventListener("click", () => {
      this.dismissToast(toast);
    });

    this.container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        this.dismissToast(toast);
      }, duration);
    }
  },

  dismissToast(toast) {
    toast.classList.add("toast-hiding");
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  },

  // --- Check & Scan In-App Alerts ---
  getSystemAlerts() {
    const tasks = StorageService.getTasks();
    const goals = StorageService.getGoals();
    const alerts = [];
    const now = new Date();

    // Check Tasks Deadlines
    tasks.forEach(task => {
      if (task.status !== "completed" && task.deadline) {
        const d = new Date(task.deadline);
        const diffHours = (d - now) / (1000 * 60 * 60);

        if (diffHours < 0) {
          alerts.push({
            id: `task-overdue-${task.id}`,
            type: "danger",
            icon: "fa-circle-exclamation",
            title: "Task đã quá hạn!",
            message: `"${task.title}" đã quá hạn chót.`,
            linkView: "tasks"
          });
        } else if (diffHours <= 48) {
          const hoursLeft = Math.max(1, Math.round(diffHours));
          alerts.push({
            id: `task-urgent-${task.id}`,
            type: "warning",
            icon: "fa-clock",
            title: "Deadline cận kề!",
            message: `"${task.title}" chỉ còn ${hoursLeft} giờ nữa.`,
            linkView: "tasks"
          });
        }
      }
    });

    // Check Goals
    goals.forEach(goal => {
      if (!goal.completed && goal.deadline) {
        const d = new Date(goal.deadline);
        const diffDays = Math.round((d - now) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7 && diffDays >= 0) {
          alerts.push({
            id: `goal-near-${goal.id}`,
            type: "info",
            icon: "fa-bullseye",
            title: "Mục tiêu sắp đến hạn",
            message: `"${goal.title}" còn ${diffDays} ngày để hoàn thành.`,
            linkView: "goals"
          });
        }
      }
    });

    return alerts;
  },

  updateNotificationBadge() {
    const badge = document.getElementById("header-notification-badge");
    const drawerList = document.getElementById("notification-list");
    if (!badge || !drawerList) return;

    const alerts = this.getSystemAlerts();
    if (alerts.length > 0) {
      badge.textContent = alerts.length > 9 ? "9+" : alerts.length;
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }

    if (alerts.length === 0) {
      drawerList.innerHTML = `
        <div style="padding:1.5rem;text-align:center;color:var(--text-muted);font-size:0.85rem;">
          <i class="fa-regular fa-bell-slash" style="font-size:1.8rem;margin-bottom:0.5rem;display:block;opacity:0.6;"></i>
          Không có thông báo mới nào
        </div>
      `;
    } else {
      drawerList.innerHTML = alerts.map(a => `
        <div class="notification-item" onclick="App.navigateTo('${a.linkView}')" style="cursor:pointer;">
          <i class="fa-solid ${a.icon}" style="color:var(--${a.type === 'danger' ? 'danger' : (a.type === 'warning' ? 'warning' : 'info')});margin-top:0.2rem;font-size:1rem;"></i>
          <div style="flex:1;">
            <div style="font-weight:700;color:var(--text-primary);font-size:0.85rem;">${a.title}</div>
            <div style="color:var(--text-secondary);font-size:0.775rem;margin-top:0.15rem;">${a.message}</div>
          </div>
        </div>
      `).join("");
    }
  },

  // Play audio beep on timer finish via Web Audio API
  playChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.3); // D6

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.85);
    } catch (e) {
      console.log("Audio not allowed without user interaction yet:", e);
    }
  }
};

