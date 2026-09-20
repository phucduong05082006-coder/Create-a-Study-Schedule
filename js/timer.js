/**
 * TIMER.JS - Study Timer, Pomodoro Engine & Session Logger
 * StudyTracker Application
 */

const TimerModule = {
  state: "idle", // 'idle' | 'running' | 'paused'
  mode: "pomodoro", // 'pomodoro' | 'stopwatch'
  totalSeconds: 25 * 60,
  remainingSeconds: 25 * 60,
  elapsedSeconds: 0,
  intervalId: null,
  selectedSubjectId: null,

  init() {
    this.bindEvents();
    this.renderDisplay();
  },

  bindEvents() {
    const btnStart = document.getElementById("timer-btn-start");
    const btnPause = document.getElementById("timer-btn-pause");
    const btnReset = document.getElementById("timer-btn-reset");
    const btnFinish = document.getElementById("timer-btn-finish");

    if (btnStart) btnStart.addEventListener("click", () => this.start());
    if (btnPause) btnPause.addEventListener("click", () => this.pause());
    if (btnReset) btnReset.addEventListener("click", () => this.reset());
    if (btnFinish) btnFinish.addEventListener("click", () => this.finishSessionPrompt());

    // Preset buttons
    document.querySelectorAll(".timer-preset-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const mins = parseInt(e.target.dataset.mins || "25", 10);
        this.setCustomTime(mins);
      });
    });

    // Modal Star Rating selection
    document.querySelectorAll(".star-rating-select i").forEach(star => {
      star.addEventListener("click", (e) => {
        const rating = parseInt(e.target.dataset.val || "5", 10);
        this.setRatingInput(rating);
      });
    });

    // Save Session Form
    const sessionForm = document.getElementById("form-log-session");
    if (sessionForm) {
      sessionForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveSession();
      });
    }
  },

  setRatingInput(rating) {
    const stars = document.querySelectorAll(".star-rating-select i");
    const inputVal = document.getElementById("session-focus-rating");
    if (inputVal) inputVal.value = rating;

    stars.forEach(s => {
      const v = parseInt(s.dataset.val, 10);
      if (v <= rating) {
        s.className = "fa-solid fa-star";
      } else {
        s.className = "fa-regular fa-star";
      }
    });
  },

  setCustomTime(minutes) {
    if (this.state === "running") {
      if (!confirm("Phiên học đang diễn ra. Bạn có muốn đổi thời gian và thiết lập lại không?")) {
        return;
      }
    }
    this.pause();
    this.totalSeconds = minutes * 60;
    this.remainingSeconds = this.totalSeconds;
    this.elapsedSeconds = 0;
    this.state = "idle";
    this.renderDisplay();
  },

  start() {
    if (this.state === "running") return;
    this.state = "running";

    this.intervalId = setInterval(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;
        this.elapsedSeconds++;
        this.renderDisplay();

        if (this.remainingSeconds === 0) {
          this.onTimerComplete();
        }
      }
    }, 1000);

    this.updateControls();
    NotificationService.showToast("Đã bắt đầu tính giờ học tập! Tập trung nhé!", "info", 2000);
  },

  pause() {
    if (this.state !== "running") return;
    this.state = "paused";
    clearInterval(this.intervalId);
    this.updateControls();
  },

  reset() {
    this.pause();
    this.state = "idle";
    this.remainingSeconds = this.totalSeconds;
    this.elapsedSeconds = 0;
    this.renderDisplay();
    this.updateControls();
  },

  onTimerComplete() {
    this.pause();
    NotificationService.playChime();
    NotificationService.showToast("🔔 Hết giờ học! Hãy ghi lại kết quả phiên học của bạn.", "success", 5000);
    this.finishSessionPrompt();
  },

  finishSessionPrompt() {
    if (this.elapsedSeconds < 60) {
      NotificationService.showToast("Phiên học dưới 1 phút chưa được tính vào lịch sử.", "warning");
      return;
    }

    const durationMins = Math.max(1, Math.round(this.elapsedSeconds / 60));

    // Populate subjects in modal select
    const select = document.getElementById("session-subject-select");
    const subjects = StorageService.getSubjects();
    if (select) {
      select.innerHTML = `<option value="">-- Chọn môn học --</option>` +
        subjects.map(s => `<option value="${s.id}">${s.name} (${s.code})</option>`).join("");
    }

    const durationDisplay = document.getElementById("session-duration-display");
    if (durationDisplay) {
      durationDisplay.textContent = `${durationMins} phút`;
    }
    const durationInput = document.getElementById("session-duration-input");
    if (durationInput) {
      durationInput.value = durationMins;
    }

    this.setRatingInput(5);
    App.openModal("modal-log-session");
  },

  saveSession() {
    const subjectId = document.getElementById("session-subject-select").value;
    const duration = parseInt(document.getElementById("session-duration-input").value, 10);
    const topic = document.getElementById("session-topic-input").value.trim();
    const rating = parseInt(document.getElementById("session-focus-rating").value, 10);
    const notes = document.getElementById("session-notes-input").value.trim();

    if (!subjectId) {
      NotificationService.showToast("Vui lòng chọn môn học vừa học!", "warning");
      return;
    }

    const newSession = {
      id: "ses-" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      subjectId,
      durationMinutes: duration,
      topic: topic || "Học bài tổng quát",
      focusRating: rating || 5,
      notes: notes || ""
    };

    const sessions = StorageService.getSessions();
    sessions.unshift(newSession);
    StorageService.saveSessions(sessions);

    App.closeModal();
    this.reset();

    NotificationService.showToast(`✓ Đã lưu phiên học (${duration} phút). Tuyệt vời!`, "success");

    // Trigger views reload
    DashboardModule.render();
    HistoryModule.render();
    StatisticsModule.render();
  },

  renderDisplay() {
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    const displayEl = document.getElementById("timer-digits");
    if (displayEl) {
      displayEl.textContent = timeStr;
    }

    // Update document title with timer if running
    if (this.state === "running") {
      document.title = `(${timeStr}) StudyTracker`;
    } else {
      document.title = "StudyTracker - Quản Lý Quá Trình Học Tập";
    }

    const statusLabel = document.getElementById("timer-status-text");
    if (statusLabel) {
      if (this.state === "running") statusLabel.textContent = "Đang tập trung...";
      else if (this.state === "paused") statusLabel.textContent = "Tạm dừng";
      else statusLabel.textContent = "Sẵn sàng";
    }
  },

  updateControls() {
    const btnStart = document.getElementById("timer-btn-start");
    const btnPause = document.getElementById("timer-btn-pause");
    if (!btnStart || !btnPause) return;

    if (this.state === "running") {
      btnStart.style.display = "none";
      btnPause.style.display = "inline-flex";
    } else {
      btnStart.style.display = "inline-flex";
      btnPause.style.display = "none";
    }
  }
};

