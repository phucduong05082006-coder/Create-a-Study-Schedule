/**
 * GRADES.JS - GPA Calculator, Letter Grade Conversion & Target Grade Predictor
 * StudyTracker Application
 */

const GradesModule = {
  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    // Target grade form
    const formTarget = document.getElementById("form-calc-target-grade");
    if (formTarget) {
      formTarget.addEventListener("submit", (e) => {
        e.preventDefault();
        this.calculateTargetGrade();
      });
    }

    // Save Grade Scale Table
    const formScale = document.getElementById("form-grade-scale");
    if (formScale) {
      formScale.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveGradeScale();
      });
    }
  },

  // Calculate Overall GPA across all subjects
  calculateOverallGPA() {
    const subjects = StorageService.getSubjects();
    const settings = StorageService.getSettings() || {};
    const scale = settings.gradeScale || [
      { grade: "A+", min: 9.0, gpa4: 4.0 },
      { grade: "A", min: 8.5, gpa4: 3.7 },
      { grade: "B+", min: 8.0, gpa4: 3.5 },
      { grade: "B", min: 7.0, gpa4: 3.0 },
      { grade: "C+", min: 6.5, gpa4: 2.5 },
      { grade: "C", min: 5.5, gpa4: 2.0 },
      { grade: "D+", min: 5.0, gpa4: 1.5 },
      { grade: "D", min: 4.0, gpa4: 1.0 },
      { grade: "F", min: 0.0, gpa4: 0.0 }
    ];

    let totalCredits = 0;
    let weighted10Sum = 0;
    let weighted4Sum = 0;

    subjects.forEach(s => {
      const g10 = StorageService.calculateSubjectFinalGrade(s);
      if (g10 !== null && !isNaN(g10)) {
        const credits = Number(s.credits) || 3;
        totalCredits += credits;
        weighted10Sum += g10 * credits;

        // Convert to GPA 4
        let g4 = 0.0;
        for (const item of scale) {
          if (g10 >= item.min) {
            g4 = item.gpa4;
            break;
          }
        }
        weighted4Sum += g4 * credits;
      }
    });

    if (totalCredits === 0) {
      return { gpa10: null, gpa4: null, totalCredits: 0 };
    }

    return {
      gpa10: parseFloat((weighted10Sum / totalCredits).toFixed(2)),
      gpa4: parseFloat((weighted4Sum / totalCredits).toFixed(2)),
      totalCredits
    };
  },

  convertToLetter(g10) {
    if (g10 === null || isNaN(g10)) return "--";
    const settings = StorageService.getSettings() || {};
    const scale = settings.gradeScale || [];
    for (const item of scale) {
      if (g10 >= item.min) return item.grade;
    }
    return "F";
  },

  render() {
    this.renderGpaSummary();
    this.renderGradesTable();
    this.renderScaleTable();
  },

  renderGpaSummary() {
    const gpa = this.calculateOverallGPA();

    const el4 = document.getElementById("calc-gpa-4");
    const el10 = document.getElementById("calc-gpa-10");
    const elCredits = document.getElementById("calc-total-credits");

    if (el4) el4.textContent = gpa.gpa4 !== null ? gpa.gpa4.toFixed(2) : "--";
    if (el10) el10.textContent = gpa.gpa10 !== null ? gpa.gpa10.toFixed(2) : "--";
    if (elCredits) elCredits.textContent = gpa.totalCredits % 1 === 0 ? gpa.totalCredits : parseFloat(gpa.totalCredits.toFixed(2));
  },

  renderGradesTable() {
    const tbody = document.getElementById("grades-summary-tbody");
    if (!tbody) return;

    const subjects = StorageService.getSubjects();

    if (subjects.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:1.5rem;">Chưa có môn học nào.</td></tr>`;
      return;
    }

    tbody.innerHTML = subjects.map((s, idx) => {
      const g = s.grades || {};
      const finalScore = StorageService.calculateSubjectFinalGrade(s);
      const letter = this.convertToLetter(finalScore);

      return `
        <tr>
          <td>${idx + 1}</td>
          <td>
            <strong>${s.name}</strong>
            <span style="font-size:0.75rem;color:var(--text-muted);display:block;">${s.code}</span>
          </td>
          <td>${s.credits}</td>
          <td>${g.attendance !== null && g.attendance !== undefined ? g.attendance : '--'}</td>
          <td>${g.midterm !== null && g.midterm !== undefined ? g.midterm : '--'}</td>
          <td>${g.final !== null && g.final !== undefined ? g.final : '--'}</td>
          <td>
            <strong style="color:var(--primary);">${finalScore !== null ? finalScore : '--'}</strong>
            ${letter !== '--' ? `<span class="badge badge-status-in_progress" style="margin-left:0.35rem;">${letter}</span>` : ''}
          </td>
        </tr>
      `;
    }).join("");
  },

  renderScaleTable() {
    const tbody = document.getElementById("grade-scale-tbody");
    if (!tbody) return;

    const settings = StorageService.getSettings() || {};
    const scale = settings.gradeScale || [];

    tbody.innerHTML = scale.map((item, idx) => `
      <tr>
        <td><strong>${item.grade}</strong></td>
        <td>
          <input type="number" step="0.1" min="0" max="10" class="form-control scale-min-input" data-idx="${idx}" value="${item.min}" style="width:90px;padding:0.3rem 0.5rem;">
        </td>
        <td>
          <input type="number" step="0.1" min="0" max="4" class="form-control scale-gpa-input" data-idx="${idx}" value="${item.gpa4}" style="width:90px;padding:0.3rem 0.5rem;">
        </td>
      </tr>
    `).join("");
  },

  saveGradeScale() {
    const settings = StorageService.getSettings() || {};
    const scale = settings.gradeScale || [];

    const minInputs = document.querySelectorAll(".scale-min-input");
    const gpaInputs = document.querySelectorAll(".scale-gpa-input");

    minInputs.forEach(input => {
      const idx = parseInt(input.dataset.idx, 10);
      if (scale[idx]) scale[idx].min = parseFloat(input.value);
    });

    gpaInputs.forEach(input => {
      const idx = parseInt(input.dataset.idx, 10);
      if (scale[idx]) scale[idx].gpa4 = parseFloat(input.value);
    });

    settings.gradeScale = scale;
    StorageService.saveSettings(settings);
    NotificationService.showToast("✓ Đã lưu bảng quy đổi điểm thành công!", "success");
    this.render();
    DashboardModule.render();
  },

  // 3. Target Grade Predictor Tool
  calculateTargetGrade() {
    const currentGrade = parseFloat(document.getElementById("target-current-grade").value);
    const targetGrade = parseFloat(document.getElementById("target-desired-grade").value);
    const remainingWeight = parseFloat(document.getElementById("target-remaining-weight").value);
    const resultBox = document.getElementById("target-grade-result-box");

    if (isNaN(currentGrade) || isNaN(targetGrade) || isNaN(remainingWeight) || remainingWeight <= 0) {
      NotificationService.showToast("Vui lòng nhập đầy đủ các thông số hợp lệ!", "warning");
      return;
    }

    // Formula:
    // Target = (Current * CompletedWeight + Required * RemainingWeight) / 100
    // => Required = (Target * 100 - Current * CompletedWeight) / RemainingWeight
    const completedWeight = 100 - remainingWeight;
    const requiredGrade = ((targetGrade * 100) - (currentGrade * completedWeight)) / remainingWeight;

    if (!resultBox) return;

    if (requiredGrade <= 0) {
      resultBox.innerHTML = `
        <div style="background-color:var(--success-light);color:var(--success);padding:1rem;border-radius:var(--radius-md);border:1px solid var(--success);">
          <div style="font-weight:700;font-size:1rem;"><i class="fa-solid fa-champagne-glasses"></i> Bạn đã đạt điểm mục tiêu rồi!</div>
          <div style="font-size:0.875rem;margin-top:0.25rem;">Điểm hiện tại của bạn đã đủ để hoàn thành mục tiêu ${targetGrade}. Hãy tiếp tục giữ phong độ!</div>
        </div>
      `;
    } else if (requiredGrade > 10.0) {
      resultBox.innerHTML = `
        <div style="background-color:var(--danger-light);color:var(--danger);padding:1rem;border-radius:var(--radius-md);border:1px solid var(--danger);">
          <div style="font-weight:700;font-size:1rem;"><i class="fa-solid fa-triangle-exclamation"></i> Mục tiêu vượt quá khả năng điểm 10</div>
          <div style="font-size:0.875rem;margin-top:0.25rem;">
            Bạn cần đạt <strong>${requiredGrade.toFixed(2)} điểm</strong> ở phần còn lại (${remainingWeight}%). Thang điểm tối đa là 10, nên bạn cần hạ mục tiêu xuống một chút để khả thi hơn!
          </div>
        </div>
      `;
    } else {
      resultBox.innerHTML = `
        <div style="background-color:var(--primary-light);color:var(--primary);padding:1.15rem;border-radius:var(--radius-md);border:1px solid var(--primary);">
          <div style="font-size:0.85rem;color:var(--text-secondary);">Để đạt điểm mục tiêu <strong>${targetGrade}</strong>:</div>
          <div style="font-size:1.6rem;font-weight:800;color:var(--primary);margin:0.2rem 0;">
            Cần đạt ít nhất: ${requiredGrade.toFixed(2)} / 10
          </div>
          <div style="font-size:0.8rem;color:var(--text-muted);">Áp dụng cho bài kiểm tra / thi cuối kỳ chiếm <strong>${remainingWeight}%</strong> tổng điểm.</div>
        </div>
      `;
    }
  }
};

