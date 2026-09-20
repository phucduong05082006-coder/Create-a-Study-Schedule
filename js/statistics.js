/**
 * STATISTICS.JS & HISTORY.JS - Deep Analytics, Chart.js Visualizations & Study History
 * StudyTracker Application
 */

const StatisticsModule = {
  hoursChart: null,
  subjectChart: null,
  gradesChart: null,
  activeHoursPeriod: "week", // 'day' | 'week' | 'month'

  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    const periodSelect = document.getElementById("stats-hours-period-select");
    if (periodSelect) {
      periodSelect.addEventListener("change", (e) => {
        this.activeHoursPeriod = e.target.value;
        this.renderHoursChart();
      });
    }
  },

  render() {
    this.renderProductivityMetrics();
    this.renderHoursChart();
    this.renderSubjectProgressChart();
    this.renderGradesChart();
  },

  // 1. Productivity Summary Metrics
  renderProductivityMetrics() {
    const sessions = StorageService.getSessions();
    const tasks = StorageService.getTasks();

    let totalMins = 0;
    const dateMins = {};
    const subMins = {};

    sessions.forEach(s => {
      const d = Number(s.durationMinutes) || 0;
      totalMins += d;

      const dateStr = s.date.split("T")[0];
      dateMins[dateStr] = (dateMins[dateStr] || 0) + d;
      subMins[s.subjectId] = (subMins[s.subjectId] || 0) + d;
    });

    const totalHours = (totalMins / 60).toFixed(1);

    // Active days count
    const uniqueDays = Object.keys(dateMins).length;
    const dailyAvg = uniqueDays > 0 ? (totalMins / (uniqueDays * 60)).toFixed(1) : "0.0";

    // Top study day
    let topDay = "Chưa có";
    let maxDayMins = 0;
    for (const [date, m] of Object.entries(dateMins)) {
      if (m > maxDayMins) {
        maxDayMins = m;
        topDay = `${new Date(date).toLocaleDateString("vi-VN")} (${(m / 60).toFixed(1)}h)`;
      }
    }

    // Top subject
    let topSubject = "Chưa có";
    let maxSubMins = 0;
    for (const [sId, m] of Object.entries(subMins)) {
      if (m > maxSubMins) {
        maxSubMins = m;
        const sub = StorageService.getSubjectById(sId);
        if (sub) topSubject = `${sub.name} (${(m / 60).toFixed(1)}h)`;
      }
    }

    // Task completion rate
    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const totalTasks = tasks.length;
    const taskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Populate DOM
    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setTxt("stat-metric-total-hours", `${totalHours} giờ`);
    setTxt("stat-metric-daily-avg", `${dailyAvg} giờ/ngày`);
    setTxt("stat-metric-top-day", topDay);
    setTxt("stat-metric-top-subject", topSubject);
    setTxt("stat-metric-tasks-done", `${completedTasks} / ${totalTasks}`);
    setTxt("stat-metric-task-rate", `${taskRate}%`);
  },

  // 2. Study Hours Chart (Day, Week, Month)
  renderHoursChart() {
    const canvas = document.getElementById("stats-hours-canvas");
    if (!canvas || typeof Chart === "undefined") return;

    const sessions = StorageService.getSessions();
    const now = new Date();
    let labels = [];
    let dataPoints = [];

    if (this.activeHoursPeriod === "week") {
      // 7 days of current week Mon -> Sun
      labels = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
      dataPoints = [0, 0, 0, 0, 0, 0, 0];
      const curDay = now.getDay();
      const monOffset = curDay === 0 ? -6 : 1 - curDay;
      const monday = new Date(now);
      monday.setDate(now.getDate() + monOffset);
      monday.setHours(0, 0, 0, 0);

      sessions.forEach(s => {
        const sDate = new Date(s.date);
        const diff = Math.floor((sDate - monday) / (1000 * 60 * 60 * 24));
        if (diff >= 0 && diff < 7) {
          dataPoints[diff] += (Number(s.durationMinutes) || 0) / 60;
        }
      });
    } else if (this.activeHoursPeriod === "month") {
      // Past 4 weeks
      labels = ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"];
      dataPoints = [0, 0, 0, 0];
      sessions.forEach(s => {
        const sDate = new Date(s.date);
        const diffDays = Math.floor((now - sDate) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 28) {
          const wIdx = 3 - Math.floor(diffDays / 7);
          dataPoints[wIdx] += (Number(s.durationMinutes) || 0) / 60;
        }
      });
    } else {
      // Past 7 days
      labels = [];
      dataPoints = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dStr = d.toISOString().split("T")[0];
        labels.push(`${d.getDate()}/${d.getMonth() + 1}`);

        let dayMins = 0;
        sessions.forEach(s => {
          if (s.date.startsWith(dStr)) dayMins += (Number(s.durationMinutes) || 0);
        });
        dataPoints.push(dayMins / 60);
      }
    }

    const roundedData = dataPoints.map(d => parseFloat(d.toFixed(1)));

    if (this.hoursChart) this.hoursChart.destroy();

    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const textColor = isDark ? "#cbd5e1" : "#475569";
    const gridColor = isDark ? "#1e293b" : "#f1f5f9";

    this.hoursChart = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Số giờ học",
          data: roundedData,
          backgroundColor: "#3b82f6",
          borderRadius: 8,
          hoverBackgroundColor: "#2563eb"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: ctx => `${ctx.parsed.y} giờ` }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor } },
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: { color: textColor, callback: v => `${v}h` }
          }
        }
      }
    });
  },

  // 3. Subject Progress Chart (Horizontal Bar)
  renderSubjectProgressChart() {
    const canvas = document.getElementById("stats-subjects-canvas");
    if (!canvas || typeof Chart === "undefined") return;

    const subjects = StorageService.getSubjects();
    const labels = subjects.map(s => s.name);
    const data = subjects.map(s => StorageService.calculateSubjectProgress(s));
    const colors = subjects.map(s => s.color || "#3b82f6");

    if (this.subjectChart) this.subjectChart.destroy();

    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const textColor = isDark ? "#cbd5e1" : "#475569";
    const gridColor = isDark ? "#1e293b" : "#f1f5f9";

    this.subjectChart = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Tiến độ %",
          data,
          backgroundColor: colors,
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: ctx => `Hoàn thành: ${ctx.parsed.x}%` }
          }
        },
        scales: {
          x: {
            min: 0,
            max: 100,
            grid: { color: gridColor },
            ticks: { color: textColor, callback: v => `${v}%` }
          },
          y: { grid: { display: false }, ticks: { color: textColor } }
        }
      }
    });
  },

  // 4. Grades Chart
  renderGradesChart() {
    const canvas = document.getElementById("stats-grades-canvas");
    if (!canvas || typeof Chart === "undefined") return;

    const subjects = StorageService.getSubjects();
    const labels = subjects.map(s => s.code || s.name);
    const data = subjects.map(s => {
      const g = StorageService.calculateSubjectFinalGrade(s);
      return g !== null ? g : 0;
    });

    if (this.gradesChart) this.gradesChart.destroy();

    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const textColor = isDark ? "#cbd5e1" : "#475569";
    const gridColor = isDark ? "#1e293b" : "#f1f5f9";

    this.gradesChart = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Điểm tổng kết",
          data,
          backgroundColor: "rgba(16, 185, 129, 0.85)",
          borderRadius: 6,
          hoverBackgroundColor: "#059669"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: ctx => `Điểm số: ${ctx.parsed.y} / 10` }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor } },
          y: {
            min: 0,
            max: 10,
            grid: { color: gridColor },
            ticks: { color: textColor }
          }
        }
      }
    });
  }
};

/**
 * HISTORY MODULE - Study Sessions Table & Filtering
 */
const HistoryModule = {
  filterSubject: "all",

  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    const subFilter = document.getElementById("history-subject-filter");
    if (subFilter) {
      subFilter.addEventListener("change", (e) => {
        this.filterSubject = e.target.value;
        this.render();
      });
    }
  },

  populateSubjectFilter() {
    const select = document.getElementById("history-subject-filter");
    if (!select) return;
    const subjects = StorageService.getSubjects();
    select.innerHTML = `<option value="all">Tất cả môn học</option>` +
      subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join("");
  },

  render() {
    const container = document.getElementById("history-list-container");
    if (!container) return;

    this.populateSubjectFilter();

    let sessions = StorageService.getSessions();

    if (this.filterSubject !== "all") {
      sessions = sessions.filter(s => s.subjectId === this.filterSubject);
    }

    if (sessions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-clock-rotate-left empty-state-icon"></i>
          <div class="empty-state-title">Chưa có lịch sử học tập</div>
          <p class="empty-state-desc">Hãy sử dụng Study Timer để theo dõi các phiên học tập và ghi lại độ tập trung.</p>
          <button class="btn btn-primary btn-sm" onclick="App.navigateTo('timer')">
            <i class="fa-solid fa-stopwatch"></i> Mở Study Timer
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = sessions.map(s => {
      const sub = StorageService.getSubjectById(s.subjectId);
      const hours = Math.floor(s.durationMinutes / 60);
      const mins = s.durationMinutes % 60;
      const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} phút`;

      // Render stars
      let starsHtml = "";
      const rating = s.focusRating || 5;
      for (let i = 1; i <= 5; i++) {
        starsHtml += `<i class="${i <= rating ? 'fa-solid' : 'fa-regular'} fa-star" style="color:var(--warning);font-size:0.8rem;"></i>`;
      }

      return `
        <div class="task-item" style="margin-bottom:0.75rem;">
          <div class="task-left">
            <div style="width:40px;height:40px;border-radius:var(--radius-md);background-color:${sub ? sub.color : '#3b82f6'}22;color:${sub ? sub.color : '#3b82f6'};display:flex;align-items:center;justify-content:center;font-size:1.1rem;">
              <i class="fa-solid fa-book-bookmark"></i>
            </div>
            <div>
              <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
                <span style="font-weight:700;color:var(--text-primary);font-size:0.95rem;">${sub ? sub.name : 'Chung'}</span>
                <span style="font-size:0.75rem;padding:0.15rem 0.5rem;border-radius:var(--radius-full);background-color:var(--primary-light);color:var(--primary);font-weight:600;">
                  ${durationStr}
                </span>
              </div>
              <div style="color:var(--text-secondary);font-size:0.85rem;margin-top:0.2rem;">
                <strong>Nội dung:</strong> ${s.topic || 'Học bài'}
              </div>
              ${s.notes ? `<div style="font-size:0.775rem;color:var(--text-muted);margin-top:0.1rem;"><i class="fa-regular fa-comment-dots"></i> ${s.notes}</div>` : ''}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.25rem;">
              <i class="fa-regular fa-calendar"></i> ${new Date(s.date).toLocaleDateString("vi-VN")}
            </div>
            <div title="Mức độ tập trung: ${rating}/5 sao">
              ${starsHtml}
            </div>
          </div>
        </div>
      `;
    }).join("");
  }
};

