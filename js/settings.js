/**
 * SETTINGS.JS - User Profile, Semesters, Data Backup (Export/Import) & Theme Config
 * StudyTracker Application
 */

const SettingsModule = {
  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    // Profile form
    const formProfile = document.getElementById("form-settings-profile");
    if (formProfile) {
      formProfile.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveProfile();
      });
    }

    // Study targets form
    const formTargets = document.getElementById("form-settings-targets");
    if (formTargets) {
      formTargets.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveStudyTargets();
      });
    }

    // Add semester form
    const formSemester = document.getElementById("form-add-semester");
    if (formSemester) {
      formSemester.addEventListener("submit", (e) => {
        e.preventDefault();
        this.addSemester();
      });
    }

    // Data Export
    const btnExport = document.getElementById("btn-export-data");
    if (btnExport) {
      btnExport.addEventListener("click", () => {
        StorageService.exportAllData();
        NotificationService.showToast("✓ Đã xuất tệp dữ liệu sao lưu thành công!", "success");
      });
    }

    // Data Import
    const fileImport = document.getElementById("input-import-file");
    if (fileImport) {
      fileImport.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        App.confirm("CẢNH BÁO: Việc nhập dữ liệu sẽ ghi đè lên toàn bộ dữ liệu hiện tại của bạn. Bạn có chắc muốn tiếp tục không?", () => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const res = StorageService.importAllData(event.target.result);
            if (res.success) {
              NotificationService.showToast("✓ Đã khôi phục dữ liệu thành công! Đang tải lại...", "success");
              setTimeout(() => window.location.reload(), 1000);
            } else {
              NotificationService.showToast(res.message, "error");
            }
          };
          reader.readAsText(file);
        });
      });
    }

    // Reset Sample Data
    const btnResetSample = document.getElementById("btn-reset-sample-data");
    if (btnResetSample) {
      btnResetSample.addEventListener("click", () => {
        App.confirm("Bạn có muốn đặt lại toàn bộ ứng dụng về Dữ liệu mẫu ban đầu?", () => {
          StorageService.clearAllData();
          StorageService.initDefaultDataIfEmpty(true);
          NotificationService.showToast("✓ Đã nạp lại dữ liệu mẫu! Đang làm mới...", "success");
          setTimeout(() => window.location.reload(), 800);
        });
      });
    }

    // Clear all data
    const btnClearAll = document.getElementById("btn-clear-all-data");
    if (btnClearAll) {
      btnClearAll.addEventListener("click", () => {
        App.confirm("CẢNH BÁO NGUY HIỂM: Thao tác này sẽ xóa vĩnh viễn toàn bộ môn học, task, điểm và lịch sử học tập. Bạn chắc chắn chứ?", () => {
          StorageService.clearAllData();
          NotificationService.showToast("Đã xóa sạch toàn bộ dữ liệu!", "info");
          setTimeout(() => window.location.reload(), 800);
        });
      });
    }
  },

  render() {
    const settings = StorageService.getSettings() || {};
    const profile = settings.profile || {};
    const prefs = settings.preferences || {};

    // Profile Inputs
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || "";
    };

    setVal("setting-name-input", profile.name);
    setVal("setting-university-input", profile.university);
    setVal("setting-major-input", profile.major);
    setVal("setting-cohort-input", profile.cohort);

    setVal("setting-target-daily", prefs.dailyTargetHours || 4);
    setVal("setting-target-weekly", prefs.weeklyTargetHours || 25);

    // Render Semesters list
    this.renderSemestersList();

    // Update sidebar profile card
    const sideName = document.getElementById("sidebar-user-name");
    const sideSub = document.getElementById("sidebar-user-sub");
    if (sideName) sideName.textContent = profile.name || "Sinh viên";
    if (sideSub) sideSub.textContent = profile.major || "Kỹ thuật phần mềm";
  },

  renderSemestersList() {
    const container = document.getElementById("settings-semesters-list");
    if (!container) return;

    const semesters = StorageService.getSemesters();
    const settings = StorageService.getSettings() || {};
    const activeSem = (settings.preferences || {}).activeSemester;

    container.innerHTML = semesters.map(sem => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0.65rem 0.85rem;background-color:var(--bg-subtle);border-radius:var(--radius-md);border:1px solid var(--border-color);margin-bottom:0.5rem;">
        <div style="display:flex;align-items:center;gap:0.6rem;">
          <span style="font-weight:700;font-size:0.9rem;color:var(--text-primary);">${sem.name}</span>
          ${sem.id === activeSem ? '<span class="badge badge-status-in_progress" style="font-size:0.7rem;">Đang chọn</span>' : ''}
        </div>
        <div style="display:flex;gap:0.3rem;">
          ${sem.id !== activeSem ? `
            <button class="btn btn-outline btn-sm" onclick="SettingsModule.setActiveSemester('${sem.id}')" title="Chọn làm học kỳ chính">
              Chọn
            </button>
          ` : ''}
          <button class="btn btn-secondary btn-icon btn-sm" onclick="SettingsModule.deleteSemester('${sem.id}')" title="Xóa học kỳ">
            <i class="fa-solid fa-trash-can" style="font-size:0.75rem;color:var(--danger);"></i>
          </button>
        </div>
      </div>
    `).join("");
  },

  saveProfile() {
    const settings = StorageService.getSettings() || {};
    settings.profile = {
      name: document.getElementById("setting-name-input").value.trim(),
      university: document.getElementById("setting-university-input").value.trim(),
      major: document.getElementById("setting-major-input").value.trim(),
      cohort: document.getElementById("setting-cohort-input").value.trim(),
      avatar: ""
    };

    StorageService.saveSettings(settings);
    this.render();
    NotificationService.showToast("✓ Đã cập nhật hồ sơ cá nhân!", "success");
  },

  saveStudyTargets() {
    const settings = StorageService.getSettings() || {};
    if (!settings.preferences) settings.preferences = {};

    settings.preferences.dailyTargetHours = parseFloat(document.getElementById("setting-target-daily").value) || 4;
    settings.preferences.weeklyTargetHours = parseFloat(document.getElementById("setting-target-weekly").value) || 25;

    StorageService.saveSettings(settings);
    NotificationService.showToast("✓ Đã lưu mục tiêu giờ học!", "success");
  },

  addSemester() {
    const name = document.getElementById("new-semester-name-input").value.trim();
    if (!name) return;

    const semesters = StorageService.getSemesters();
    const newId = "sem-" + Date.now();

    semesters.push({
      id: newId,
      name,
      isCurrent: false
    });

    StorageService.saveSemesters(semesters);
    document.getElementById("new-semester-name-input").value = "";
    this.renderSemestersList();
    App.populateHeaderSemesters();
    NotificationService.showToast("✓ Đã thêm học kỳ mới!", "success");
  },

  setActiveSemester(id) {
    const settings = StorageService.getSettings() || {};
    if (!settings.preferences) settings.preferences = {};
    settings.preferences.activeSemester = id;

    StorageService.saveSettings(settings);
    this.renderSemestersList();
    App.populateHeaderSemesters();
    NotificationService.showToast("✓ Đã đổi học kỳ hoạt động!", "info");
    DashboardModule.render();
    SubjectsModule.render();
    GradesModule.render();
  },

  deleteSemester(id) {
    App.confirm("Bạn có muốn xóa học kỳ này không?", () => {
      let semesters = StorageService.getSemesters();
      if (semesters.length <= 1) {
        NotificationService.showToast("Phải giữ lại ít nhất một học kỳ!", "warning");
        return;
      }
      semesters = semesters.filter(s => s.id !== id);
      StorageService.saveSemesters(semesters);
      this.renderSemestersList();
      App.populateHeaderSemesters();
      NotificationService.showToast("✓ Đã xóa học kỳ", "info");
    });
  }
};

