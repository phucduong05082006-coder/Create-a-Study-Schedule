/**
 * STUDY-PLAN.JS - Daily Study Timeline, Weekly Planning & Future Milestones
 * StudyTracker Application
 */

const StudyPlanModule = {
  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    // Add today plan button
    const btnAddPlan = document.getElementById("btn-add-daily-plan");
    if (btnAddPlan) {
      btnAddPlan.addEventListener("click", () => this.openAddPlanModal());
    }

    const formPlan = document.getElementById("form-daily-plan");
    if (formPlan) {
      formPlan.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveDailyPlan();
      });
    }

    // Add milestone form
    const formMilestone = document.getElementById("form-add-milestone");
    if (formMilestone) {
      formMilestone.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveMilestone();
      });
    }
  },

  render() {
    this.renderTodayPlan();
    this.renderFutureMilestones();
  },

  renderTodayPlan() {
    const container = document.getElementById("study-plan-today-timeline");
    if (!container) return;

    const planData = StorageService.getStudyPlan();
    const todayStr = new Date().toISOString().split("T")[0];
    const todayPlans = (planData.dailyPlans || [])
      .filter(p => p.date === todayStr)
      .sort((a, b) => (a.timeStart || "").localeCompare(b.timeStart || ""));

    if (todayPlans.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding:2rem 1rem;">
          <i class="fa-solid fa-list-check empty-state-icon"></i>
          <div class="empty-state-title">Chưa có kế hoạch học tập hôm nay</div>
          <p class="empty-state-desc">Hãy lên kế hoạch theo khung giờ để học tập có định hướng và kỷ luật hơn.</p>
          <button class="btn btn-primary btn-sm" onclick="StudyPlanModule.openAddPlanModal()">
            <i class="fa-solid fa-plus"></i> Lên lịch học hôm nay
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = todayPlans.map(p => {
      const sub = StorageService.getSubjectById(p.subjectId);
      const isDone = p.completed;
      return `
        <div class="task-item ${isDone ? 'completed' : ''}" style="margin-bottom:0.75rem;">
          <div class="task-left">
            <div class="custom-checkbox ${isDone ? 'checked' : ''}" onclick="StudyPlanModule.togglePlanComplete('${p.id}')">
              <i class="fa-solid fa-check"></i>
            </div>
            <div>
              <div style="font-weight:700;font-size:0.95rem;color:var(--primary);margin-bottom:0.15rem;">
                <i class="fa-regular fa-clock"></i> ${p.timeStart} - ${p.timeEnd}
              </div>
              <div class="task-title">${p.content}</div>
              <div class="task-meta">
                ${sub ? `<span style="color:${sub.color};font-weight:600;"><i class="fa-solid fa-book"></i> ${sub.name}</span>` : ''}
              </div>
            </div>
          </div>
          <button class="btn btn-secondary btn-icon btn-sm" onclick="StudyPlanModule.deletePlan('${p.id}')" title="Xóa khung giờ">
            <i class="fa-solid fa-trash-can" style="color:var(--danger);"></i>
          </button>
        </div>
      `;
    }).join("");
  },

  renderFutureMilestones() {
    const container = document.getElementById("future-milestones-list");
    if (!container) return;

    const planData = StorageService.getStudyPlan();
    const milestones = planData.futureMilestones || [];

    if (milestones.length === 0) {
      container.innerHTML = `
        <div style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:1.5rem;">
          Chưa có cột mốc tương lai nào. Hãy thiết lập mục tiêu tháng hoặc học kỳ!
        </div>
      `;
      return;
    }

    container.innerHTML = milestones.map(m => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;background-color:var(--bg-subtle);border-radius:var(--radius-md);border:1px solid var(--border-color);margin-bottom:0.6rem;">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <input type="checkbox" ${m.completed ? 'checked' : ''} onchange="StudyPlanModule.toggleMilestoneComplete('${m.id}')" style="width:18px;height:18px;cursor:pointer;">
          <div>
            <span style="font-size:0.75rem;font-weight:700;color:var(--primary);display:block;">${m.period}</span>
            <span style="font-size:0.9rem;font-weight:600;color:var(--text-primary);text-decoration:${m.completed ? 'line-through' : 'none'};opacity:${m.completed ? 0.7 : 1};">
              ${m.title}
            </span>
          </div>
        </div>
        <button class="btn btn-secondary btn-icon btn-sm" onclick="StudyPlanModule.deleteMilestone('${m.id}')" title="Xóa">
          <i class="fa-solid fa-trash-can" style="font-size:0.75rem;color:var(--danger);"></i>
        </button>
      </div>
    `).join("");
  },

  openAddPlanModal() {
    document.getElementById("form-daily-plan").reset();
    const select = document.getElementById("plan-subject-select");
    if (select) {
      const subjects = StorageService.getSubjects();
      select.innerHTML = `<option value="">-- Chọn môn học (tùy chọn) --</option>` +
        subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join("");
    }
    App.openModal("modal-daily-plan");
  },

  saveDailyPlan() {
    const timeStart = document.getElementById("plan-start-time").value;
    const timeEnd = document.getElementById("plan-end-time").value;
    const subjectId = document.getElementById("plan-subject-select").value || null;
    const content = document.getElementById("plan-content-input").value.trim();

    if (!timeStart || !timeEnd || !content) {
      NotificationService.showToast("Vui lòng điền đủ khung giờ và nội dung dự định học!", "warning");
      return;
    }

    const planData = StorageService.getStudyPlan();
    if (!planData.dailyPlans) planData.dailyPlans = [];

    const newPlan = {
      id: "dp-" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      timeStart,
      timeEnd,
      subjectId,
      content,
      completed: false
    };

    planData.dailyPlans.push(newPlan);
    StorageService.saveStudyPlan(planData);
    App.closeModal();
    this.renderTodayPlan();
    NotificationService.showToast("✓ Đã thêm kế hoạch học tập hôm nay!", "success");
  },

  togglePlanComplete(id) {
    const planData = StorageService.getStudyPlan();
    const p = (planData.dailyPlans || []).find(item => item.id === id);
    if (p) {
      p.completed = !p.completed;
      StorageService.saveStudyPlan(planData);
      this.renderTodayPlan();
    }
  },

  deletePlan(id) {
    const planData = StorageService.getStudyPlan();
    planData.dailyPlans = (planData.dailyPlans || []).filter(item => item.id !== id);
    StorageService.saveStudyPlan(planData);
    this.renderTodayPlan();
    NotificationService.showToast("✓ Đã xóa mục kế hoạch", "info");
  },

  saveMilestone() {
    const period = document.getElementById("milestone-period-input").value.trim();
    const title = document.getElementById("milestone-title-input").value.trim();

    if (!period || !title) {
      NotificationService.showToast("Vui lòng nhập mốc thời gian và mục tiêu!", "warning");
      return;
    }

    const planData = StorageService.getStudyPlan();
    if (!planData.futureMilestones) planData.futureMilestones = [];

    planData.futureMilestones.push({
      id: "ms-" + Date.now(),
      period,
      title,
      completed: false
    });

    StorageService.saveStudyPlan(planData);
    document.getElementById("form-add-milestone").reset();
    this.renderFutureMilestones();
    NotificationService.showToast("✓ Đã lưu cột mốc tương lai!", "success");
  },

  toggleMilestoneComplete(id) {
    const planData = StorageService.getStudyPlan();
    const m = (planData.futureMilestones || []).find(item => item.id === id);
    if (m) {
      m.completed = !m.completed;
      StorageService.saveStudyPlan(planData);
      this.renderFutureMilestones();
    }
  },

  deleteMilestone(id) {
    const planData = StorageService.getStudyPlan();
    planData.futureMilestones = (planData.futureMilestones || []).filter(item => item.id !== id);
    StorageService.saveStudyPlan(planData);
    this.renderFutureMilestones();
    NotificationService.showToast("✓ Đã xóa cột mốc", "info");
  }
};

