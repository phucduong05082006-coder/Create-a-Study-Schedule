/**
 * SUBJECTS.JS - Subject Management, Chapters Checklist & Grading Weight Engine
 * StudyTracker Application
 */

const SubjectsModule = {
  activeSubjectId: null,
  filterSemester: "all",
  filterStatus: "all",

  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    const btnAdd = document.getElementById("btn-add-subject");
    if (btnAdd) {
      btnAdd.addEventListener("click", () => this.openAddModal());
    }

    const form = document.getElementById("form-subject");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveSubject();
      });
    }

    const filterSem = document.getElementById("filter-subject-semester");
    if (filterSem) {
      filterSem.addEventListener("change", (e) => {
        this.filterSemester = e.target.value;
        this.render();
      });
    }

    const filterSt = document.getElementById("filter-subject-status");
    if (filterSt) {
      filterSt.addEventListener("change", (e) => {
        this.filterStatus = e.target.value;
        this.render();
      });
    }

    // Add chapter form inside detail modal
    const formChapter = document.getElementById("form-add-chapter");
    if (formChapter) {
      formChapter.addEventListener("submit", (e) => {
        e.preventDefault();
        this.addChapter();
      });
    }

    // Subject grades form
    const formGrades = document.getElementById("form-subject-grades");
    if (formGrades) {
      formGrades.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveSubjectGrades();
      });
    }
  },

  render() {
    const container = document.getElementById("subjects-list-container");
    if (!container) return;

    let subjects = StorageService.getSubjects();

    // Filters
    if (this.filterSemester !== "all") {
      subjects = subjects.filter(s => s.semester === this.filterSemester);
    }
    if (this.filterStatus !== "all") {
      subjects = subjects.filter(s => s.status === this.filterStatus);
    }

    if (subjects.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <i class="fa-solid fa-book-open empty-state-icon"></i>
          <div class="empty-state-title">Chưa có môn học nào</div>
          <p class="empty-state-desc">Hãy thêm môn học đầu tiên để bắt đầu theo dõi tiến độ và điểm số.</p>
          <button class="btn btn-primary" onclick="SubjectsModule.openAddModal()">
            <i class="fa-solid fa-plus"></i> Thêm môn học
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = subjects.map(s => {
      const progress = StorageService.calculateSubjectProgress(s);
      const finalGrade = StorageService.calculateSubjectFinalGrade(s);
      const completedChapters = (s.chapters || []).filter(c => c.completed).length;
      const totalChapters = (s.chapters || []).length;

      let statusBadge = `<span class="badge badge-status-todo">Chưa học</span>`;
      if (s.status === "studying") statusBadge = `<span class="badge badge-status-in_progress">Đang học</span>`;
      else if (s.status === "completed") statusBadge = `<span class="badge badge-status-completed">Hoàn thành</span>`;
      else if (s.status === "paused") statusBadge = `<span class="badge badge-priority-low">Tạm dừng</span>`;

      return `
        <div class="subject-card" style="border-top: 4px solid ${s.color || '#3b82f6'};">
          <div class="subject-card-header">
            <div>
              <span class="subject-badge-code" style="background-color:${s.color}22;color:${s.color};">
                ${s.code || 'MÔN'}
              </span>
              <div class="subject-title">${s.name}</div>
            </div>
            ${statusBadge}
          </div>

          <div class="subject-info-row">
            <span><i class="fa-solid fa-graduation-cap"></i> ${s.credits} tín chỉ</span>
            <span><i class="fa-solid fa-chalkboard-user"></i> ${s.lecturer || 'Chưa cập nhật'}</span>
          </div>

          <div>
            <div class="progress-meta">
              <span style="color:var(--text-secondary);font-size:0.8rem;">Tiến độ (${completedChapters}/${totalChapters} chương)</span>
              <span style="color:var(--text-primary);font-weight:700;">${progress}%</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-fill" style="width:${progress}%;background-color:${s.color};"></div>
            </div>
          </div>

          <div class="subject-card-footer">
            <div>
              <span style="font-size:0.75rem;color:var(--text-muted);display:block;">Điểm hiện tại</span>
              <strong style="font-size:1.05rem;color:${finalGrade ? 'var(--primary)' : 'var(--text-muted)'};">
                ${finalGrade !== null ? finalGrade : '--'}
              </strong>
            </div>
            <div style="display:flex;gap:0.4rem;">
              <button class="btn btn-outline btn-sm" onclick="SubjectsModule.openDetail('${s.id}')" title="Xem chi tiết & chương học">
                <i class="fa-solid fa-circle-info"></i> Chi tiết
              </button>
              <button class="btn btn-secondary btn-icon btn-sm" onclick="SubjectsModule.openEditModal('${s.id}')" title="Chỉnh sửa">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="btn btn-secondary btn-icon btn-sm" onclick="SubjectsModule.deleteSubject('${s.id}')" title="Xóa môn">
                <i class="fa-solid fa-trash-can" style="color:var(--danger);"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  },

  openAddModal() {
    document.getElementById("modal-subject-title").textContent = "Thêm môn học mới";
    document.getElementById("form-subject").reset();
    document.getElementById("subject-id-input").value = "";

    // Populate semester select
    const semSelect = document.getElementById("subject-semester-select");
    const semesters = StorageService.getSemesters();
    if (semSelect) {
      semSelect.innerHTML = semesters.map(sem =>
        `<option value="${sem.id}">${sem.name}</option>`
      ).join("");
    }

    App.openModal("modal-subject");
  },

  openEditModal(id) {
    const subject = StorageService.getSubjectById(id);
    if (!subject) return;

    document.getElementById("modal-subject-title").textContent = "Chỉnh sửa môn học";
    document.getElementById("subject-id-input").value = subject.id;
    document.getElementById("subject-name-input").value = subject.name;
    document.getElementById("subject-code-input").value = subject.code;
    document.getElementById("subject-credits-input").value = subject.credits;
    document.getElementById("subject-lecturer-input").value = subject.lecturer || "";
    document.getElementById("subject-color-input").value = subject.color || "#3b82f6";
    document.getElementById("subject-status-select").value = subject.status || "studying";

    const semSelect = document.getElementById("subject-semester-select");
    const semesters = StorageService.getSemesters();
    if (semSelect) {
      semSelect.innerHTML = semesters.map(sem =>
        `<option value="${sem.id}" ${sem.id === subject.semester ? 'selected' : ''}>${sem.name}</option>`
      ).join("");
    }

    App.openModal("modal-subject");
  },

  saveSubject() {
    const id = document.getElementById("subject-id-input").value;
    const name = document.getElementById("subject-name-input").value.trim();
    const code = document.getElementById("subject-code-input").value.trim().toUpperCase();
    const credits = parseFloat(document.getElementById("subject-credits-input").value) || 3;
    const lecturer = document.getElementById("subject-lecturer-input").value.trim();
    const color = document.getElementById("subject-color-input").value;
    const status = document.getElementById("subject-status-select").value;
    const semester = document.getElementById("subject-semester-select").value;

    if (!name || !code) {
      NotificationService.showToast("Vui lòng điền tên môn và mã môn!", "warning");
      return;
    }

    const subjects = StorageService.getSubjects();

    if (id) {
      // Edit
      const index = subjects.findIndex(s => s.id === id);
      if (index !== -1) {
        subjects[index] = {
          ...subjects[index],
          name, code, credits, lecturer, color, status, semester
        };
        NotificationService.showToast("✓ Đã cập nhật môn học!", "success");
      }
    } else {
      // Add
      const newSubject = {
        id: "sub-" + Date.now(),
        name,
        code,
        credits,
        lecturer,
        color,
        status,
        semester,
        chapters: [],
        gradingWeights: { attendance: 10, homework: 20, midterm: 30, final: 40 },
        grades: { attendance: null, homework: null, midterm: null, final: null },
        notes: ""
      };
      subjects.push(newSubject);
      NotificationService.showToast("✓ Đã thêm môn học mới!", "success");
    }

    StorageService.saveSubjects(subjects);
    App.closeModal();
    this.render();
    DashboardModule.render();
    GradesModule.render();
  },

  deleteSubject(id) {
    App.confirm("Bạn có chắc chắn muốn xóa môn học này? Các task và lịch học liên quan sẽ bị ảnh hưởng.", () => {
      let subjects = StorageService.getSubjects();
      subjects = subjects.filter(s => s.id !== id);
      StorageService.saveSubjects(subjects);

      NotificationService.showToast("✓ Đã xóa môn học", "info");
      this.render();
      DashboardModule.render();
      GradesModule.render();
    });
  },

  // --- Subject Detail & Chapters ---
  openDetail(id) {
    const subject = StorageService.getSubjectById(id);
    if (!subject) return;

    this.activeSubjectId = id;
    this.renderDetailContent(subject);
    App.openModal("modal-subject-detail");
  },

  renderDetailContent(subject) {
    const titleEl = document.getElementById("detail-subject-title");
    if (titleEl) titleEl.textContent = `${subject.name} (${subject.code})`;

    const metaEl = document.getElementById("detail-subject-meta");
    if (metaEl) {
      metaEl.innerHTML = `
        <span style="margin-right:1rem;"><i class="fa-solid fa-graduation-cap"></i> ${subject.credits} Tín chỉ</span>
        <span style="margin-right:1rem;"><i class="fa-solid fa-user-tie"></i> Giảng viên: ${subject.lecturer || 'Chưa có'}</span>
      `;
    }

    // Chapters list
    const chaptersContainer = document.getElementById("detail-chapters-list");
    const chapters = subject.chapters || [];
    const completedCount = chapters.filter(c => c.completed).length;
    const progress = chapters.length > 0 ? Math.round((completedCount / chapters.length) * 100) : 0;

    const progressText = document.getElementById("detail-progress-summary");
    if (progressText) {
      progressText.textContent = `${completedCount}/${chapters.length} chương hoàn thành (${progress}%)`;
    }
    const progressBar = document.getElementById("detail-progress-fill");
    if (progressBar) progressBar.style.width = `${progress}%`;

    if (chaptersContainer) {
      if (chapters.length === 0) {
        chaptersContainer.innerHTML = `
          <div style="text-align:center;padding:1.5rem;color:var(--text-muted);font-size:0.85rem;">
            Chưa có chương học nào được tạo. Hãy thêm chương bên dưới!
          </div>
        `;
      } else {
        chaptersContainer.innerHTML = chapters.map(ch => `
          <div class="chapter-item">
            <label class="chapter-checkbox-label" style="text-decoration: ${ch.completed ? 'line-through' : 'none'}; opacity: ${ch.completed ? 0.7 : 1};">
              <input type="checkbox" ${ch.completed ? 'checked' : ''} onchange="SubjectsModule.toggleChapter('${ch.id}')" style="width:16px;height:16px;cursor:pointer;">
              ${ch.title}
            </label>
            <button class="btn btn-secondary btn-icon btn-sm" onclick="SubjectsModule.deleteChapter('${ch.id}')" title="Xóa chương">
              <i class="fa-solid fa-trash-can" style="font-size:0.75rem;color:var(--danger);"></i>
            </button>
          </div>
        `).join("");
      }
    }

    // Fill Grades & Weights
    const w = subject.gradingWeights || { attendance: 10, homework: 20, midterm: 30, final: 40 };
    const g = subject.grades || {};

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== null && val !== undefined ? val : "";
    };

    setVal("weight-attendance", w.attendance);
    setVal("weight-homework", w.homework);
    setVal("weight-midterm", w.midterm);
    setVal("weight-final", w.final);

    setVal("grade-attendance", g.attendance);
    setVal("grade-homework", g.homework);
    setVal("grade-midterm", g.midterm);
    setVal("grade-final", g.final);

    const finalCalculated = StorageService.calculateSubjectFinalGrade(subject);
    const scoreDisplay = document.getElementById("detail-final-score-badge");
    if (scoreDisplay) {
      scoreDisplay.textContent = finalCalculated !== null ? `${finalCalculated} / 10` : "Chưa có đủ điểm";
    }
  },

  addChapter() {
    const input = document.getElementById("new-chapter-title");
    const title = input.value.trim();
    if (!title || !this.activeSubjectId) return;

    const subjects = StorageService.getSubjects();
    const sub = subjects.find(s => s.id === this.activeSubjectId);
    if (!sub) return;

    if (!sub.chapters) sub.chapters = [];
    sub.chapters.push({
      id: "ch-" + Date.now(),
      title,
      completed: false
    });

    StorageService.saveSubjects(subjects);
    input.value = "";
    this.renderDetailContent(sub);
    this.render();
    DashboardModule.render();
    NotificationService.showToast("✓ Đã thêm chương học mới", "success");
  },

  toggleChapter(chapterId) {
    if (!this.activeSubjectId) return;
    const subjects = StorageService.getSubjects();
    const sub = subjects.find(s => s.id === this.activeSubjectId);
    if (!sub || !sub.chapters) return;

    const ch = sub.chapters.find(c => c.id === chapterId);
    if (ch) {
      ch.completed = !ch.completed;
      StorageService.saveSubjects(subjects);
      this.renderDetailContent(sub);
      this.render();
      DashboardModule.render();
    }
  },

  deleteChapter(chapterId) {
    if (!this.activeSubjectId) return;
    const subjects = StorageService.getSubjects();
    const sub = subjects.find(s => s.id === this.activeSubjectId);
    if (!sub || !sub.chapters) return;

    sub.chapters = sub.chapters.filter(c => c.id !== chapterId);
    StorageService.saveSubjects(subjects);
    this.renderDetailContent(sub);
    this.render();
    DashboardModule.render();
  },

  saveSubjectGrades() {
    if (!this.activeSubjectId) return;
    const subjects = StorageService.getSubjects();
    const sub = subjects.find(s => s.id === this.activeSubjectId);
    if (!sub) return;

    const getFloat = id => {
      const val = document.getElementById(id).value;
      return val === "" ? null : parseFloat(val);
    };

    const wAtt = getFloat("weight-attendance") || 0;
    const wHw = getFloat("weight-homework") || 0;
    const wMid = getFloat("weight-midterm") || 0;
    const wFin = getFloat("weight-final") || 0;

    const totalWeight = wAtt + wHw + wMid + wFin;
    if (totalWeight !== 100) {
      NotificationService.showToast(`Tổng trọng số phải bằng 100% (Hiện tại: ${totalWeight}%)`, "warning");
      return;
    }

    sub.gradingWeights = { attendance: wAtt, homework: wHw, midterm: wMid, final: wFin };
    sub.grades = {
      attendance: getFloat("grade-attendance"),
      homework: getFloat("grade-homework"),
      midterm: getFloat("grade-midterm"),
      final: getFloat("grade-final")
    };

    StorageService.saveSubjects(subjects);
    this.renderDetailContent(sub);
    this.render();
    DashboardModule.render();
    GradesModule.render();
    NotificationService.showToast("✓ Đã lưu trọng số và điểm thành phần!", "success");
  }
};

