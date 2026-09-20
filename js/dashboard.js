/**
 * DASHBOARD.JS - Primary Dashboard Engine, Calculations & Widget Renderers
 * StudyTracker Application
 */

const DashboardModule = {
  chartInstance: null,

  init() {
    this.render();
  },

  render() {
    this.renderOverviewStats();
    this.renderOverallProgress();
    this.renderStreak();
    this.renderTodayTasks();
    this.renderUpcomingDeadlines();
    this.renderSubjectProgressCards();
    this.renderWeeklyChart();
    this.renderHeatmap();
  },

  // 1. Overview Stat Cards
  renderOverviewStats() {
    const subjects = StorageService.getSubjects();
    const tasks = StorageService.getTasks();
    const goals = StorageService.getGoals();
    const sessions = StorageService.getSessions();

    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Today & Yesterday Study Minutes
    let todayMinutes = 0;
    let yesterdayMinutes = 0;
    let totalMinutes = 0;

    sessions.forEach(s => {
      const sDate = s.date.split("T")[0];
      const dur = Number(s.durationMinutes) || 0;
      totalMinutes += dur;
      if (sDate === todayStr) todayMinutes += dur;
      if (sDate === yesterdayStr) yesterdayMinutes += dur;
    });

    const todayHours = (todayMinutes / 60).toFixed(1);
    const totalHours = Math.round(totalMinutes / 60);

    // % compare with yesterday
    let trendBadge = "";
    if (yesterdayMinutes === 0 && todayMinutes > 0) {
      trendBadge = `<span class="stat-trend up"><i class="fa-solid fa-arrow-up"></i> +100%</span>`;
    } else if (yesterdayMinutes > 0) {
      const diff = Math.round(((todayMinutes - yesterdayMinutes) / yesterdayMinutes) * 100);
      if (diff >= 0) {
        trendBadge = `<span class="stat-trend up"><i class="fa-solid fa-arrow-up"></i> +${diff}%</span>`;
      } else {
        trendBadge = `<span class="stat-trend down"><i class="fa-solid fa-arrow-down"></i> ${diff}%</span>`;
      }
    } else {
      trendBadge = `<span class="stat-trend neutral">0% hôm qua</span>`;
    }

    // Active subjects count
    const activeSubjects = subjects.filter(s => s.status === "studying").length;

    // Unfinished tasks & overdue
    const pendingTasks = tasks.filter(t => t.status !== "completed");
    const overdueTasks = pendingTasks.filter(t => t.deadline && new Date(t.deadline) < new Date());

    // Current GPA calculation
    const gpaData = GradesModule.calculateOverallGPA();

    // Fill elements
    const elTodayStudy = document.getElementById("dash-today-study");
    if (elTodayStudy) {
      const h = Math.floor(todayMinutes / 60);
      const m = todayMinutes % 60;
      elTodayStudy.innerHTML = `${h}h ${m}m ${trendBadge}`;
    }

    const elTotalHours = document.getElementById("dash-total-hours");
    if (elTotalHours) elTotalHours.textContent = `${totalHours} giờ`;

    const elSubjectsCount = document.getElementById("dash-subjects-count");
    if (elSubjectsCount) elSubjectsCount.textContent = `${activeSubjects}/${subjects.length}`;

    const elTasksCount = document.getElementById("dash-tasks-count");
    if (elTasksCount) {
      elTasksCount.innerHTML = `${pendingTasks.length} ${overdueTasks.length > 0 ? `<span class="stat-trend down">${overdueTasks.length} quá hạn</span>` : ''}`;
    }

    const elGpa = document.getElementById("dash-current-gpa");
    if (elGpa) {
      elGpa.textContent = gpaData.gpa4 !== null ? `${gpaData.gpa4.toFixed(2)} / 4.0` : "Chưa có";
    }

    const elGoalsCount = document.getElementById("dash-goals-count");
    if (elGoalsCount) {
      const activeGoals = goals.filter(g => !g.completed).length;
      elGoalsCount.textContent = `${activeGoals} mục tiêu`;
    }
  },

  // 2. Overall Progress Bar
  renderOverallProgress() {
    const subjects = StorageService.getSubjects();
    let totalProgress = 0;
    let count = 0;

    subjects.forEach(sub => {
      const prog = StorageService.calculateSubjectProgress(sub);
      totalProgress += prog;
      count++;
    });

    const avgProgress = count > 0 ? Math.round(totalProgress / count) : 0;

    const elBar = document.getElementById("dash-overall-progress-bar");
    const elText = document.getElementById("dash-overall-progress-text");

    if (elBar) elBar.style.width = `${avgProgress}%`;
    if (elText) elText.textContent = `${avgProgress}%`;
  },

  // 3. Streak Card
  renderStreak() {
    const streaks = StorageService.calculateStreaks();
    const elCurrent = document.getElementById("dash-streak-current");
    const elLongest = document.getElementById("dash-streak-longest");

    if (elCurrent) elCurrent.textContent = `${streaks.currentStreak} ngày`;
    if (elLongest) elLongest.textContent = `${streaks.longestStreak} ngày`;
  },

  // 4. Today's Tasks
  renderTodayTasks() {
    const container = document.getElementById("dash-today-tasks-list");
    if (!container) return;

    const tasks = StorageService.getTasks();
    const todayStr = new Date().toISOString().split("T")[0];

    // Priority filter or tasks with deadline today / overdue
    const todayTasks = tasks.filter(t => {
      if (t.status === "completed") return false;
      if (!t.deadline) return false;
      return t.deadline.startsWith(todayStr) || new Date(t.deadline) < new Date();
    });

    if (todayTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding:1.5rem 1rem;">
          <i class="fa-regular fa-circle-check empty-state-icon" style="font-size:2rem;color:var(--success);"></i>
          <div class="empty-state-title" style="font-size:0.95rem;">Không có task nào gấp hôm nay!</div>
          <p class="empty-state-desc" style="font-size:0.8rem;margin-bottom:0.75rem;">Bạn đã hoàn thành các nhiệm vụ quan trọng.</p>
          <button class="btn btn-outline btn-sm" onclick="App.navigateTo('tasks')">Xem tất cả công việc</button>
        </div>
      `;
      return;
    }

    container.innerHTML = todayTasks.slice(0, 5).map(task => {
      const sub = StorageService.getSubjectById(task.subjectId);
      const isOverdue = new Date(task.deadline) < new Date();
      return `
        <div class="task-item ${isOverdue ? 'overdue' : ''}" style="padding:0.7rem 0.85rem;">
          <div class="task-left">
            <div class="custom-checkbox" onclick="TasksModule.toggleComplete('${task.id}')">
              <i class="fa-solid fa-check"></i>
            </div>
            <div>
              <div class="task-title" style="font-size:0.875rem;">${task.title}</div>
              <div class="task-meta">
                ${sub ? `<span style="color:${sub.color};font-weight:600;"><i class="fa-solid fa-book-bookmark"></i> ${sub.name}</span>` : ''}
                <span style="color:${isOverdue ? 'var(--danger)' : 'inherit'};font-weight:600;">
                  <i class="fa-regular fa-clock"></i> ${isOverdue ? 'Đã quá hạn' : 'Hôm nay'}
                </span>
              </div>
            </div>
          </div>
          <span class="badge badge-priority-${task.priority}">
            ${TasksModule.getPriorityText(task.priority)}
          </span>
        </div>
      `;
    }).join("");
  },

  // 5. Upcoming Tests & Deadlines
  renderUpcomingDeadlines() {
    const container = document.getElementById("dash-upcoming-list");
    if (!container) return;

    const tasks = StorageService.getTasks();
    const now = new Date();

    const upcoming = tasks
      .filter(t => t.status !== "completed" && t.deadline && new Date(t.deadline) > now)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 4);

    if (upcoming.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;color:var(--text-muted);font-size:0.85rem;padding:1.5rem;">
          Chưa có deadline nào trong những ngày tới.
        </div>
      `;
      return;
    }

    container.innerHTML = upcoming.map(item => {
      const sub = StorageService.getSubjectById(item.subjectId);
      const d = new Date(item.deadline);
      const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));

      let badgeClass = "badge-priority-low";
      let timeText = `Còn ${diffDays} ngày`;
      if (diffDays <= 1) {
        badgeClass = "badge-priority-urgent";
        timeText = "Hạn chót ngày mai!";
      } else if (diffDays <= 3) {
        badgeClass = "badge-priority-high";
        timeText = `Còn ${diffDays} ngày`;
      }

      return `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:0.65rem 0.5rem;border-bottom:1px solid var(--border-light);">
          <div>
            <div style="font-weight:600;font-size:0.875rem;color:var(--text-primary);">${item.title}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.15rem;">
              ${sub ? sub.name : 'Chung'} • ${d.toLocaleDateString('vi-VN')}
            </div>
          </div>
          <span class="badge ${badgeClass}">${timeText}</span>
        </div>
      `;
    }).join("");
  },

  // 6. Subject Progress Cards
  renderSubjectProgressCards() {
    const container = document.getElementById("dash-subjects-progress-list");
    if (!container) return;

    const subjects = StorageService.getSubjects();
    if (subjects.length === 0) {
      container.innerHTML = `<div style="color:var(--text-muted);font-size:0.85rem;">Chưa có môn học nào.</div>`;
      return;
    }

    container.innerHTML = subjects.slice(0, 4).map(sub => {
      const prog = StorageService.calculateSubjectProgress(sub);
      const finalGrade = StorageService.calculateSubjectFinalGrade(sub);
      return `
        <div style="margin-bottom:0.85rem;">
          <div style="display:flex;justify-content:space-between;font-size:0.85rem;font-weight:600;margin-bottom:0.3rem;">
            <span style="color:var(--text-primary);display:flex;align-items:center;gap:0.4rem;">
              <span style="width:8px;height:8px;border-radius:50%;background-color:${sub.color};"></span>
              ${sub.name}
            </span>
            <span style="color:var(--text-muted);">${prog}% ${finalGrade !== null ? `(Điểm: ${finalGrade})` : ''}</span>
          </div>
          <div class="progress-bar-bg" style="height:7px;">
            <div class="progress-fill" style="width:${prog}%;background-color:${sub.color};"></div>
          </div>
        </div>
      `;
    }).join("");
  },

  // 7. Weekly Chart (Chart.js)
  renderWeeklyChart() {
    const canvas = document.getElementById("dash-weekly-chart");
    if (!canvas || typeof Chart === "undefined") return;

    const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
    const hours = [0, 0, 0, 0, 0, 0, 0];

    // Compute hours for current week
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const sessions = StorageService.getSessions();
    sessions.forEach(s => {
      const sDate = new Date(s.date);
      const diffDays = Math.floor((sDate - monday) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        hours[diffDays] += (Number(s.durationMinutes) || 0) / 60;
      }
    });

    const roundedHours = hours.map(h => parseFloat(h.toFixed(1)));

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const textColor = isDark ? "#cbd5e1" : "#475569";
    const gridColor = isDark ? "#1e293b" : "#f1f5f9";

    this.chartInstance = new Chart(canvas, {
      type: "bar",
      data: {
        labels: days,
        datasets: [{
          label: "Giờ học",
          data: roundedHours,
          backgroundColor: "rgba(59, 130, 246, 0.8)",
          borderRadius: 6,
          hoverBackgroundColor: "#2563eb"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Thời gian: ${ctx.parsed.y} giờ`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { size: 11 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { size: 11 },
              callback: (val) => `${val}h`
            }
          }
        }
      }
    });
  },

  // 8. Heatmap (GitHub-like 365 days)
  renderHeatmap() {
    const container = document.getElementById("dash-heatmap-grid");
    if (!container) return;

    const sessions = StorageService.getSessions();
    const dateHoursMap = {};

    sessions.forEach(s => {
      const d = s.date.split("T")[0];
      const hrs = (Number(s.durationMinutes) || 0) / 60;
      dateHoursMap[d] = (dateHoursMap[d] || 0) + hrs;
    });

    // Render past 24 weeks (~168 days) for clear viewing
    const totalDays = 24 * 7;
    const today = new Date();
    let html = "";

    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const hrs = dateHoursMap[dateStr] || 0;

      let levelClass = "";
      if (hrs > 4) levelClass = "level-4";
      else if (hrs > 2.5) levelClass = "level-3";
      else if (hrs > 1) levelClass = "level-2";
      else if (hrs > 0) levelClass = "level-1";

      html += `<div class="heatmap-cell ${levelClass}" title="${dateStr}: ${hrs.toFixed(1)} giờ học"></div>`;
    }

    container.innerHTML = html;
  },

  // 9. Open Weekly Report Modal
  openWeeklyReport() {
    const sessions = StorageService.getSessions();
    const tasks = StorageService.getTasks();
    const streaks = StorageService.calculateStreaks();
    const subjects = StorageService.getSubjects();

    // 7 days window
    const now = new Date();
    const past7 = new Date();
    past7.setDate(now.getDate() - 7);

    let totalMins = 0;
    const subjectMins = {};

    sessions.forEach(s => {
      const sDate = new Date(s.date);
      if (sDate >= past7 && sDate <= now) {
        const d = Number(s.durationMinutes) || 0;
        totalMins += d;
        subjectMins[s.subjectId] = (subjectMins[s.subjectId] || 0) + d;
      }
    });

    const totalHours = (totalMins / 60).toFixed(1);
    const dailyAvg = (totalMins / (7 * 60)).toFixed(1);

    // Most studied subject
    let topSubjectName = "Chưa có dữ liệu";
    let maxSubMins = 0;
    for (const [subId, m] of Object.entries(subjectMins)) {
      if (m > maxSubMins) {
        maxSubMins = m;
        const sub = StorageService.getSubjectById(subId);
        if (sub) topSubjectName = sub.name;
      }
    }

    // Tasks completed in last 7 days
    const completedTasksCount = tasks.filter(t => t.status === "completed").length;
    const totalTasks = tasks.length;

    const modalBody = document.getElementById("modal-weekly-report-content");
    if (modalBody) {
      modalBody.innerHTML = `
        <div style="background:linear-gradient(135deg, var(--primary-light), var(--accent-light));padding:1.25rem;border-radius:var(--radius-lg);margin-bottom:1.25rem;text-align:center;">
          <div style="font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;font-weight:700;color:var(--primary);">BÁO CÁO HỌC TẬP 7 NGÀY GẦN NHẤT</div>
          <div style="font-size:2.2rem;font-weight:800;color:var(--text-primary);margin:0.25rem 0;">${totalHours} Giờ</div>
          <div style="font-size:0.85rem;color:var(--text-secondary);">Trung bình mỗi ngày đạt: <strong>${dailyAvg} giờ/ngày</strong></div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1.25rem;">
          <div class="stat-card">
            <div class="stat-label"><i class="fa-solid fa-list-check" style="color:var(--success);"></i> Task hoàn thành</div>
            <div class="stat-value" style="font-size:1.35rem;">${completedTasksCount}/${totalTasks}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label"><i class="fa-solid fa-fire" style="color:#f97316;"></i> Chuỗi học (Streak)</div>
            <div class="stat-value" style="font-size:1.35rem;">${streaks.currentStreak} ngày</div>
          </div>
        </div>

        <div style="background-color:var(--bg-subtle);padding:1rem;border-radius:var(--radius-md);border:1px solid var(--border-color);">
          <div style="font-weight:700;font-size:0.9rem;margin-bottom:0.4rem;color:var(--text-primary);">Môn học tập trung nhiều nhất:</div>
          <div style="display:flex;align-items:center;gap:0.5rem;color:var(--primary);font-weight:600;">
            <i class="fa-solid fa-trophy" style="color:var(--warning);"></i>
            ${topSubjectName} (${Math.round(maxSubMins / 60)} giờ)
          </div>
        </div>
      `;
    }

    App.openModal("modal-weekly-report");
  }
};

