/**
 * SCHEDULE.JS - Timetable, Weekly Class Schedule & Calendar View
 * StudyTracker Application
 */

const ScheduleModule = {
  activeView: "week", // 'week' | 'day'

  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    const btnAdd = document.getElementById("btn-add-schedule");
    if (btnAdd) {
      btnAdd.addEventListener("click", () => this.openAddModal());
    }

    const form = document.getElementById("form-schedule");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveScheduleItem();
      });
    }

    // View switchers
    const btnWeek = document.getElementById("btn-sched-view-week");
    const btnDay = document.getElementById("btn-sched-view-day");
    if (btnWeek) {
      btnWeek.addEventListener("click", () => {
        this.activeView = "week";
        btnWeek.classList.add("active");
        if (btnDay) btnDay.classList.remove("active");
        this.render();
      });
    }
    if (btnDay) {
      btnDay.addEventListener("click", () => {
        this.activeView = "day";
        btnDay.classList.add("active");
        if (btnWeek) btnWeek.classList.remove("active");
        this.render();
      });
    }
  },

  render() {
    const container = document.getElementById("schedule-grid-container");
    if (!container) return;

    const schedule = StorageService.getSchedule();
    const days = [
      { num: 2, label: "Thứ 2" },
      { num: 3, label: "Thứ 3" },
      { num: 4, label: "Thứ 4" },
      { num: 5, label: "Thứ 5" },
      { num: 6, label: "Thứ 6" },
      { num: 7, label: "Thứ 7" },
      { num: 1, label: "Chủ nhật" }
    ];

    // Current day of week (JS: 0=Sun, 1=Mon, 2=Tue... -> convert: Sun=1, Mon=2...)
    const jsDay = new Date().getDay();
    const currentDayNum = jsDay === 0 ? 1 : jsDay + 1;

    let displayDays = days;
    if (this.activeView === "day") {
      displayDays = days.filter(d => d.num === currentDayNum);
    }

    container.innerHTML = displayDays.map(day => {
      const isToday = day.num === currentDayNum;
      const dayItems = schedule.filter(s => Number(s.dayOfWeek) === day.num)
        .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

      return `
        <div class="schedule-day-column ${isToday ? 'today-col' : ''}">
          <div class="schedule-day-header ${isToday ? 'today' : ''}">
            ${day.label} ${isToday ? '(Hôm nay)' : ''}
          </div>
          <div class="schedule-day-body">
            ${dayItems.length === 0 ? `
              <div style="font-size:0.75rem;color:var(--text-muted);text-align:center;padding:1.5rem 0.5rem;">
                Không có tiết học
              </div>
            ` : dayItems.map(item => {
        const sub = StorageService.getSubjectById(item.subjectId);
        const color = sub ? sub.color : 'var(--primary)';
        return `
                <div class="schedule-card" style="border-left-color: ${color};">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                    <div class="time"><i class="fa-regular fa-clock"></i> ${item.startTime} - ${item.endTime}</div>
                    <div style="display:flex;gap:0.25rem;">
                      <button class="btn btn-icon btn-sm" onclick="ScheduleModule.openEditModal('${item.id}')" title="Sửa" style="width:22px;height:22px;font-size:0.7rem;">
                        <i class="fa-solid fa-pen"></i>
                      </button>
                      <button class="btn btn-icon btn-sm" onclick="ScheduleModule.deleteScheduleItem('${item.id}')" title="Xóa" style="width:22px;height:22px;font-size:0.7rem;color:var(--danger);">
                        <i class="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  </div>
                  <div class="subject" style="color:${color};">${sub ? sub.name : 'Môn học'}</div>
                  <div style="color:var(--text-secondary);font-size:0.75rem;">
                    ${item.room ? `<i class="fa-solid fa-location-dot"></i> Phòng: ${item.room}` : ''}
                  </div>
                  ${item.lecturer ? `<div style="color:var(--text-muted);font-size:0.7rem;"><i class="fa-solid fa-user-tie"></i> ${item.lecturer}</div>` : ''}
                </div>
              `;
      }).join("")}
          </div>
        </div>
      `;
    }).join("");
  },

  openAddModal() {
    document.getElementById("modal-schedule-title").textContent = "Thêm lịch học mới";
    document.getElementById("form-schedule").reset();
    document.getElementById("schedule-id-input").value = "";

    this.populateSubjectSelect();
    App.openModal("modal-schedule");
  },

  openEditModal(id) {
    const schedule = StorageService.getSchedule();
    const item = schedule.find(s => s.id === id);
    if (!item) return;

    document.getElementById("modal-schedule-title").textContent = "Chỉnh sửa lịch học";
    document.getElementById("schedule-id-input").value = item.id;
    document.getElementById("schedule-day-select").value = item.dayOfWeek;
    document.getElementById("schedule-start-time").value = item.startTime;
    document.getElementById("schedule-end-time").value = item.endTime;
    document.getElementById("schedule-room-input").value = item.room || "";
    document.getElementById("schedule-lecturer-input").value = item.lecturer || "";

    this.populateSubjectSelect(item.subjectId);
    App.openModal("modal-schedule");
  },

  populateSubjectSelect(selectedId = null) {
    const select = document.getElementById("schedule-subject-select");
    if (!select) return;
    const subjects = StorageService.getSubjects();
    select.innerHTML = `<option value="">-- Chọn môn học --</option>` +
      subjects.map(s => `<option value="${s.id}" ${s.id === selectedId ? 'selected' : ''}>${s.name} (${s.code})</option>`).join("");
  },

  saveScheduleItem() {
    const id = document.getElementById("schedule-id-input").value;
    const subjectId = document.getElementById("schedule-subject-select").value;
    const dayOfWeek = parseInt(document.getElementById("schedule-day-select").value, 10);
    const startTime = document.getElementById("schedule-start-time").value;
    const endTime = document.getElementById("schedule-end-time").value;
    const room = document.getElementById("schedule-room-input").value.trim();
    const lecturer = document.getElementById("schedule-lecturer-input").value.trim();

    if (!subjectId || !startTime || !endTime) {
      NotificationService.showToast("Vui lòng điền đủ thông tin môn và thời gian!", "warning");
      return;
    }

    const schedule = StorageService.getSchedule();

    if (id) {
      const idx = schedule.findIndex(s => s.id === id);
      if (idx !== -1) {
        schedule[idx] = { ...schedule[idx], subjectId, dayOfWeek, startTime, endTime, room, lecturer };
        NotificationService.showToast("✓ Đã cập nhật lịch học!", "success");
      }
    } else {
      const newItem = {
        id: "sch-" + Date.now(),
        subjectId,
        dayOfWeek,
        startTime,
        endTime,
        room,
        lecturer,
        type: "regular"
      };
      schedule.push(newItem);
      NotificationService.showToast("✓ Đã thêm lịch học mới!", "success");
    }

    StorageService.saveSchedule(schedule);
    App.closeModal();
    this.render();
  },

  deleteScheduleItem(id) {
    App.confirm("Bạn có muốn xóa buổi học này khỏi lịch?", () => {
      let schedule = StorageService.getSchedule();
      schedule = schedule.filter(s => s.id !== id);
      StorageService.saveSchedule(schedule);
      NotificationService.showToast("✓ Đã xóa buổi học", "info");
      this.render();
    });
  }
};

