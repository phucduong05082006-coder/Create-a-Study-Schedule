/**
 * STORAGE.JS - LocalStorage Engine, Data Model, Migrations & Sample Data
 * StudyTracker Application
 */

const STORAGE_KEYS = {
  SETTINGS: "st_settings",
  SEMESTERS: "st_semesters",
  SUBJECTS: "st_subjects",
  TASKS: "st_tasks",
  SCHEDULE: "st_schedule",
  STUDY_PLAN: "st_study_plan",
  GOALS: "st_goals",
  STUDY_SESSIONS: "st_study_sessions",
  NOTES: "st_notes"
};

const StorageService = {
  // --- Generic Helpers ---
  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage:`, e);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      // Notify Cloud Sync if user is logged in
      if (typeof AuthService !== "undefined" && AuthService.scheduleCloudSync) {
        AuthService.scheduleCloudSync();
      }
      return true;
    } catch (e) {
      console.error(`Error saving ${key} to localStorage:`, e);
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  // --- Settings & Profile ---
  getSettings() {
    const s = this.get(STORAGE_KEYS.SETTINGS, null);
    if (s && Array.isArray(s.gradeScale)) {
      // Auto-upgrade gradeScale to include A+ if missing
      if (!s.gradeScale.some(g => g.grade === "A+")) {
        s.gradeScale.unshift({ grade: "A+", min: 9.0, gpa4: 4.0 });
        const aGrade = s.gradeScale.find(g => g.grade === "A");
        if (aGrade) aGrade.gpa4 = 3.7;
        this.saveSettings(s);
      }
    }
    return s;
  },
  saveSettings(settings) {
    return this.set(STORAGE_KEYS.SETTINGS, settings);
  },

  // --- Semesters ---
  getSemesters() {
    return this.get(STORAGE_KEYS.SEMESTERS, []);
  },
  saveSemesters(semesters) {
    return this.set(STORAGE_KEYS.SEMESTERS, semesters);
  },

  // --- Subjects ---
  getSubjects() {
    return this.get(STORAGE_KEYS.SUBJECTS, []);
  },
  saveSubjects(subjects) {
    return this.set(STORAGE_KEYS.SUBJECTS, subjects);
  },

  // --- Tasks ---
  getTasks() {
    return this.get(STORAGE_KEYS.TASKS, []);
  },
  saveTasks(tasks) {
    return this.set(STORAGE_KEYS.TASKS, tasks);
  },

  // --- Schedule ---
  getSchedule() {
    return this.get(STORAGE_KEYS.SCHEDULE, []);
  },
  saveSchedule(schedule) {
    return this.set(STORAGE_KEYS.SCHEDULE, schedule);
  },

  // --- Study Plan ---
  getStudyPlan() {
    return this.get(STORAGE_KEYS.STUDY_PLAN, { dailyPlans: [], futureMilestones: [] });
  },
  saveStudyPlan(plan) {
    return this.set(STORAGE_KEYS.STUDY_PLAN, plan);
  },

  // --- Goals ---
  getGoals() {
    return this.get(STORAGE_KEYS.GOALS, []);
  },
  saveGoals(goals) {
    return this.set(STORAGE_KEYS.GOALS, goals);
  },

  // --- Study Sessions (History) ---
  getSessions() {
    return this.get(STORAGE_KEYS.STUDY_SESSIONS, []);
  },
  saveSessions(sessions) {
    return this.set(STORAGE_KEYS.STUDY_SESSIONS, sessions);
  },

  // --- Notes ---
  getNotes() {
    return this.get(STORAGE_KEYS.NOTES, []);
  },
  saveNotes(notes) {
    return this.set(STORAGE_KEYS.NOTES, notes);
  },

  // --- Calculated Data Helpers ---
  getSubjectById(id) {
    const subjects = this.getSubjects();
    return subjects.find(s => s.id === id) || null;
  },

  calculateSubjectProgress(subject) {
    if (!subject.chapters || subject.chapters.length === 0) return 0;
    const completed = subject.chapters.filter(c => c.completed).length;
    return Math.round((completed / subject.chapters.length) * 100);
  },

  calculateSubjectFinalGrade(subject) {
    if (!subject.gradingWeights || !subject.grades) return null;
    const { attendance = 0, homework = 0, midterm = 0, final = 0 } = subject.gradingWeights;
    const g = subject.grades;

    let totalScore = 0;
    let totalWeight = 0;

    if (g.attendance !== null && g.attendance !== undefined && !isNaN(g.attendance)) {
      totalScore += g.attendance * (attendance / 100);
      totalWeight += attendance;
    }
    if (g.homework !== null && g.homework !== undefined && !isNaN(g.homework)) {
      totalScore += g.homework * (homework / 100);
      totalWeight += homework;
    }
    if (g.midterm !== null && g.midterm !== undefined && !isNaN(g.midterm)) {
      totalScore += g.midterm * (midterm / 100);
      totalWeight += midterm;
    }
    if (g.final !== null && g.final !== undefined && !isNaN(g.final)) {
      totalScore += g.final * (final / 100);
      totalWeight += final;
    }

    if (totalWeight === 0) return null;
    // Normalized to 10 scale if partial, or exact if all 100%
    if (totalWeight === 100) {
      return parseFloat(totalScore.toFixed(2));
    } else {
      return parseFloat(((totalScore / totalWeight) * 10).toFixed(2));
    }
  },

  // Calculate Streak
  calculateStreaks() {
    const sessions = this.getSessions();
    if (!sessions || sessions.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Extract unique dates sorted ascending
    const sessionDates = [...new Set(sessions.map(s => s.date.split("T")[0]))].sort();
    if (sessionDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // Calculate streaks
    let longest = 1;
    let current = 0;
    let tempStreak = 1;

    for (let i = 1; i < sessionDates.length; i++) {
      const prev = new Date(sessionDates[i - 1]);
      const curr = new Date(sessionDates[i]);
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
        if (tempStreak > longest) longest = tempStreak;
      } else {
        tempStreak = 1;
      }
    }

    // Check if streak is active today or yesterday
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const lastDate = sessionDates[sessionDates.length - 1];
    if (lastDate === todayStr || lastDate === yesterdayStr) {
      // Walk backwards to find current streak
      let streakCount = 1;
      let checkDate = new Date(lastDate);
      for (let i = sessionDates.length - 2; i >= 0; i--) {
        const d = new Date(sessionDates[i]);
        const diff = Math.round((checkDate - d) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          streakCount++;
          checkDate = d;
        } else {
          break;
        }
      }
      current = streakCount;
    } else {
      current = 0;
    }

    return {
      currentStreak: current,
      longestStreak: Math.max(longest, current)
    };
  },

  // --- Export & Import Data ---
  exportAllData() {
    const dump = {};
    for (const [name, key] of Object.entries(STORAGE_KEYS)) {
      dump[name] = this.get(key, null);
    }
    dump._exportedAt = new Date().toISOString();
    dump._appVersion = "1.0.0";

    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    a.href = url;
    a.download = `study-tracker-backup-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importAllData(jsonData) {
    try {
      const data = typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData;
      if (!data.SETTINGS && !data.SUBJECTS && !data.TASKS) {
        throw new Error("Tệp tin không đúng định dạng dữ liệu StudyTracker!");
      }

      for (const [name, key] of Object.entries(STORAGE_KEYS)) {
        if (data[name] !== undefined) {
          this.set(key, data[name]);
        }
      }
      return { success: true, message: "Nhập dữ liệu thành công!" };
    } catch (err) {
      return { success: false, message: "Lỗi đọc file: " + err.message };
    }
  },

  clearAllData() {
    for (const key of Object.values(STORAGE_KEYS)) {
      this.remove(key);
    }
  },

  // --- Cloud Sync Helpers ---
  getAllDataForSync() {
    const dump = {};
    for (const [name, key] of Object.entries(STORAGE_KEYS)) {
      dump[name] = this.get(key, null);
    }
    dump._updatedAt = new Date().toISOString();
    return dump;
  },

  applyAllDataFromSync(data) {
    if (!data) return false;
    for (const [name, key] of Object.entries(STORAGE_KEYS)) {
      if (data[name] !== undefined && data[name] !== null) {
        try {
          localStorage.setItem(key, JSON.stringify(data[name]));
        } catch (e) {
          console.error("Error applying cloud data item:", e);
        }
      }
    }
    return true;
  },

  // --- Seed Sample Data ---
  initDefaultDataIfEmpty(force = false) {
    if (!force && this.getSettings() !== null) {
      return false; // Already initialized
    }

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Date helpers for realistic deadlines & history
    const addDays = (d, n) => {
      const copy = new Date(d);
      copy.setDate(copy.getDate() + n);
      return copy.toISOString().split("T")[0];
    };

    // Default Settings
    const defaultSettings = {
      profile: {
        name: "Trần Minh Quang",
        university: "Đại học Bách Khoa",
        major: "Kỹ thuật Phần mềm (Software Engineering)",
        cohort: "K2023 - 2027",
        avatar: ""
      },
      preferences: {
        theme: "light",
        dailyTargetHours: 4,
        weeklyTargetHours: 25,
        activeSemester: "2025-2026-HK1"
      },
      gradeScale: [
        { grade: "A+", min: 9.0, gpa4: 4.0 },
        { grade: "A", min: 8.5, gpa4: 3.7 },
        { grade: "B+", min: 8.0, gpa4: 3.5 },
        { grade: "B", min: 7.0, gpa4: 3.0 },
        { grade: "C+", min: 6.5, gpa4: 2.5 },
        { grade: "C", min: 5.5, gpa4: 2.0 },
        { grade: "D+", min: 5.0, gpa4: 1.5 },
        { grade: "D", min: 4.0, gpa4: 1.0 },
        { grade: "F", min: 0.0, gpa4: 0.0 }
      ]
    };

    // Default Semesters
    const defaultSemesters = [
      { id: "2025-2026-HK1", name: "Học kỳ 1 (2025 - 2026)", isCurrent: true },
      { id: "2025-2026-HK2", name: "Học kỳ 2 (2025 - 2026)", isCurrent: false },
      { id: "2024-2025-HK2", name: "Học kỳ 2 (2024 - 2025)", isCurrent: false }
    ];

    // Default Subjects
    const defaultSubjects = [
      {
        id: "sub-1",
        name: "Cấu trúc dữ liệu & Giải thuật",
        code: "CTDL01",
        credits: 3,
        lecturer: "TS. Trần Văn Nam",
        semester: "2025-2026-HK1",
        color: "#3b82f6",
        status: "studying",
        targetGrade: 8.5,
        chapters: [
          { id: "ch-101", title: "Chương 1: Đánh giá độ phức tạp & Giải thuật đệ quy", completed: true },
          { id: "ch-102", title: "Chương 2: Danh sách liên kết đơn & kép", completed: true },
          { id: "ch-103", title: "Chương 3: Ngăn xếp (Stack) & Hàng đợi (Queue)", completed: true },
          { id: "ch-104", title: "Chương 4: Cây nhị phân tìm kiếm & Cây AVL cân bằng", completed: false },
          { id: "ch-105", title: "Chương 5: Đồ thị & Các thuật toán duyệt DFS/BFS, Dijkstra", completed: false }
        ],
        gradingWeights: { attendance: 10, homework: 20, midterm: 30, final: 40 },
        grades: { attendance: 10, homework: 8.5, midterm: 8.0, final: null },
        notes: "Môn học nền tảng phỏng vấn lập trình, cần luyện nhiều bài tập LeetCode/Codeforces."
      },
      {
        id: "sub-2",
        name: "Lập trình Hướng đối tượng (OOP)",
        code: "OOP02",
        credits: 3,
        lecturer: "ThS. Lê Hoàng Yến",
        semester: "2025-2026-HK1",
        color: "#10b981",
        status: "studying",
        targetGrade: 9.0,
        chapters: [
          { id: "ch-201", title: "Chương 1: Lớp (Class), Đối tượng (Object) & Đóng gói", completed: true },
          { id: "ch-202", title: "Chương 2: Kế thừa (Inheritance) & Tái sử dụng code", completed: true },
          { id: "ch-203", title: "Chương 3: Đa hình (Polymorphism) & Lớp trừu tượng", completed: true },
          { id: "ch-204", title: "Chương 4: Design Patterns & Đồ án thực hành lớn", completed: false }
        ],
        gradingWeights: { attendance: 10, homework: 20, midterm: 30, final: 40 },
        grades: { attendance: 10, homework: 9.0, midterm: 8.5, final: 9.0 },
        notes: "Nắm vững nguyên lý SOLID và ứng dụng mẫu Singleton, Factory."
      },
      {
        id: "sub-3",
        name: "Hệ quản trị Cơ sở Dữ liệu",
        code: "CSDL03",
        credits: 3,
        lecturer: "PGS.TS. Nguyễn Đức Thắng",
        semester: "2025-2026-HK1",
        color: "#8b5cf6",
        status: "studying",
        targetGrade: 8.0,
        chapters: [
          { id: "ch-301", title: "Chương 1: Mô hình thực thể liên kết (ERD) & Quan hệ", completed: true },
          { id: "ch-302", title: "Chương 2: Ngôn ngữ truy vấn SQL từ cơ bản đến nâng cao", completed: true },
          { id: "ch-303", title: "Chương 3: Chuẩn hóa cơ sở dữ liệu (1NF, 2NF, 3NF, BCNF)", completed: false },
          { id: "ch-304", title: "Chương 4: Giao tác (Transaction), Khóa & Index tối ưu", completed: false }
        ],
        gradingWeights: { attendance: 10, homework: 20, midterm: 30, final: 40 },
        grades: { attendance: 9.0, homework: 8.0, midterm: 7.5, final: null },
        notes: "Thực hành nhiều câu lệnh JOIN lồng và Stored Procedure trên PostgreSQL."
      },
      {
        id: "sub-4",
        name: "Phát triển Ứng dụng Web",
        code: "WEB04",
        credits: 3,
        lecturer: "TS. Vũ Minh Tuấn",
        semester: "2025-2026-HK1",
        color: "#f59e0b",
        status: "studying",
        targetGrade: 9.5,
        chapters: [
          { id: "ch-401", title: "Chương 1: HTML5 Semantics & CSS3 Flexbox/Grid", completed: true },
          { id: "ch-402", title: "Chương 2: JavaScript ES6+ & DOM Manipulation", completed: true },
          { id: "ch-403", title: "Chương 3: Xây dựng RESTful API với Node.js & Express", completed: true },
          { id: "ch-404", title: "Chương 4: Xác thực JWT & Bảo mật ứng dụng Web", completed: true },
          { id: "ch-405", title: "Chương 5: Triển khai ứng dụng (CI/CD & Cloud)", completed: false }
        ],
        gradingWeights: { attendance: 10, homework: 20, midterm: 30, final: 40 },
        grades: { attendance: 10, homework: 9.5, midterm: 9.0, final: null },
        notes: "Môn học thế mạnh, đặt mục tiêu điểm A+."
      },
      {
        id: "sub-5",
        name: "Tiếng Nhật Chuyên ngành IT",
        code: "JPN05",
        credits: 2,
        lecturer: "Sensei Tanaka & Cô Mai",
        semester: "2025-2026-HK1",
        color: "#ec4899",
        status: "studying",
        targetGrade: 8.5,
        chapters: [
          { id: "ch-501", title: "Bài 1: Giao tiếp chào hỏi & Văn hóa công ty IT Nhật", completed: true },
          { id: "ch-502", title: "Bài 2: Từ vựng đặc tả yêu cầu (Requirements Spec)", completed: true },
          { id: "ch-503", title: "Bài 3: Đọc hiểu tài liệu thiết kế cơ bản & chi tiết", completed: true },
          { id: "ch-504", title: "Bài 4: Báo cáo tiến độ (Horenso) & Viết Email nghiệp vụ", completed: false },
          { id: "ch-505", title: "Bài 5: Luyện nghe hội thoại giải thích Bug & Testing", completed: false },
          { id: "ch-506", title: "Bài 6: Thuyết trình Demo dự án tốt nghiệp bằng tiếng Nhật", completed: false }
        ],
        gradingWeights: { attendance: 15, homework: 25, midterm: 25, final: 35 },
        grades: { attendance: 9.5, homework: 8.5, midterm: 8.0, final: null },
        notes: "Luyện 15 từ vựng Kanji IT mỗi ngày qua app Flashcard."
      }
    ];

    // Default Tasks
    const defaultTasks = [
      {
        id: "task-1",
        title: "Cài đặt thuật toán Dijkstra tìm đường đi ngắn nhất",
        subjectId: "sub-1",
        deadline: addDays(today, 2) + "T23:59",
        priority: "urgent",
        status: "in_progress",
        notes: "Sử dụng hàng đợi ưu tiên (Priority Queue / Min-Heap) để tối ưu O((V+E)logV).",
        completedAt: null
      },
      {
        id: "task-2",
        title: "Vẽ biểu đồ lớp Class Diagram & Triển khai Factory Pattern",
        subjectId: "sub-2",
        deadline: addDays(today, 1) + "T17:00",
        priority: "high",
        status: "todo",
        notes: "Nộp file PDF sơ đồ kiến trúc lớp cho giảng viên hướng dẫn.",
        completedAt: null
      },
      {
        id: "task-3",
        title: "Làm bài tập chuẩn hóa CSDL về dạng chuẩn 3NF và BCNF",
        subjectId: "sub-3",
        deadline: addDays(today, 4) + "T21:00",
        priority: "medium",
        status: "todo",
        notes: "Giải quyết bài tập sách giáo trình trang 142 - 148.",
        completedAt: null
      },
      {
        id: "task-4",
        title: "Học thuộc 40 từ vựng và thuật ngữ Horenso chuyên ngành IT",
        subjectId: "sub-5",
        deadline: todayStr + "T22:30",
        priority: "medium",
        status: "todo",
        notes: "Ôn tập qua Quizlet và tự ghi âm phát âm 5 câu hội thoại mẫu.",
        completedAt: null
      },
      {
        id: "task-5",
        title: "Xây dựng middleware xác thực JWT và phân quyền Admin/User",
        subjectId: "sub-4",
        deadline: addDays(today, 6) + "T23:59",
        priority: "high",
        status: "todo",
        notes: "Đảm bảo mã hóa mật khẩu bằng bcrypt và xử lý Refresh Token an toàn.",
        completedAt: null
      },
      {
        id: "task-6",
        title: "Nộp bài tập thực hành Danh sách liên kết đơn (Linked List)",
        subjectId: "sub-1",
        deadline: addDays(today, -1) + "T23:59",
        priority: "high",
        status: "completed",
        notes: "Đã nộp thành công qua cổng LMS trường, đạt điểm tối đa.",
        completedAt: addDays(today, -1) + "T20:15"
      }
    ];

    // Default Schedule
    const defaultSchedule = [
      { id: "sch-1", subjectId: "sub-1", dayOfWeek: 2, startTime: "07:30", endTime: "10:00", room: "A3-402", lecturer: "TS. Trần Văn Nam", type: "regular" },
      { id: "sch-2", subjectId: "sub-2", dayOfWeek: 3, startTime: "09:15", endTime: "11:45", room: "B2-205", lecturer: "ThS. Lê Hoàng Yến", type: "regular" },
      { id: "sch-3", subjectId: "sub-3", dayOfWeek: 4, startTime: "13:30", endTime: "16:00", room: "C1-301", lecturer: "PGS.TS. Nguyễn Đức Thắng", type: "regular" },
      { id: "sch-4", subjectId: "sub-4", dayOfWeek: 5, startTime: "07:30", endTime: "10:00", room: "Phòng Máy Lab 4", lecturer: "TS. Vũ Minh Tuấn", type: "regular" },
      { id: "sch-5", subjectId: "sub-5", dayOfWeek: 6, startTime: "15:00", endTime: "17:00", room: "D4-102", lecturer: "Sensei Tanaka", type: "regular" }
    ];

    // Default Study Plan
    const defaultStudyPlan = {
      dailyPlans: [
        { id: "dp-1", date: todayStr, timeStart: "19:00", timeEnd: "20:30", subjectId: "sub-1", content: "Lập trình cài đặt thuật toán Dijkstra", completed: true },
        { id: "dp-2", date: todayStr, timeStart: "20:45", timeEnd: "22:00", subjectId: "sub-2", content: "Thiết kế Class Diagram đồ án OOP", completed: false },
        { id: "dp-3", date: todayStr, timeStart: "22:15", timeEnd: "23:00", subjectId: "sub-5", content: "Luyện nghe tiếng Nhật bài 4", completed: false }
      ],
      futureMilestones: [
        { id: "ms-1", period: "Tháng 10/2026", title: "Hoàn thành 5 chương CTDL & Luyện 50 bài LeetCode", completed: false },
        { id: "ms-2", period: "Tháng 11/2026", title: "Hoàn thiện đồ án Web fullstack & Đạt chứng chỉ JLPT N3", completed: false },
        { id: "ms-3", period: "HK1 2025-2026", title: "Đạt GPA >= 3.6 để săn học bổng loại Giỏi", completed: false }
      ]
    };

    // Default Goals
    const defaultGoals = [
      {
        id: "goal-1",
        title: "Đạt GPA Học kỳ 1 từ 3.6/4.0 trở lên",
        type: "medium_term",
        target: "GPA >= 3.6",
        progress: 82,
        deadline: addDays(today, 75),
        priority: "urgent",
        description: "Duy trì kết quả cao tất cả các môn, không để môn nào dưới điểm B+.",
        completed: false
      },
      {
        id: "goal-2",
        title: "Nắm vững Cấu trúc dữ liệu nâng cao (AVL Tree & Graph)",
        type: "short_term",
        target: "Hoàn thành 100% bài tập",
        progress: 60,
        deadline: addDays(today, 20),
        priority: "high",
        description: "Cài đặt thành thạo trên C++, hiểu rõ cơ chế cân bằng cây và tìm đường đi.",
        completed: false
      },
      {
        id: "goal-3",
        title: "Thi đỗ chứng chỉ Năng lực tiếng Nhật JLPT N3",
        type: "long_term",
        target: "Đạt >= 120/180 điểm",
        progress: 55,
        deadline: addDays(today, 80),
        priority: "medium",
        description: "Thuộc 650 từ vựng và làm trọn vẹn 10 đề thi thử các năm trước.",
        completed: false
      }
    ];

    // Default Study Sessions (Generating last 7 days of continuous sessions for 7-day streak!)
    const defaultSessions = [];
    const topicsMap = {
      "sub-1": ["Luyện giải Linked List", "Ôn Stack & Queue", "Thuật toán đệ quy", "Tìm hiểu cây AVL"],
      "sub-2": ["Nguyên lý đóng gói & kế thừa", "Đa hình và Abstract Class", "Design Pattern Factory"],
      "sub-3": ["Truy vấn SELECT lồng & JOIN", "Thực hành ERD bán hàng", "Tối ưu hóa Index"],
      "sub-4": ["Xây dựng Responsive Layout", "Async/Await trong JavaScript", "Tạo API Express.js"],
      "sub-5": ["Từ vựng IT tiếng Nhật", "Luyện nghe báo cáo lỗi", "Viết Email nghiệp vụ"]
    };

    const subjectKeys = ["sub-1", "sub-2", "sub-3", "sub-4", "sub-5"];

    // Seed 14 days of realistic sessions
    for (let i = 13; i >= 0; i--) {
      const sDate = addDays(today, -i);
      const subId = subjectKeys[i % subjectKeys.length];
      const topics = topicsMap[subId];
      const duration = 60 + (i * 15) % 90; // Between 60 and 135 mins

      defaultSessions.push({
        id: "ses-" + (14 - i),
        date: sDate,
        subjectId: subId,
        durationMinutes: duration,
        topic: topics[i % topics.length],
        focusRating: (i % 2 === 0) ? 5 : 4,
        notes: "Tập trung cao độ, hoàn thành mục tiêu phiên học hiệu quả."
      });

      // Extra session on some days to vary hours
      if (i % 3 === 0) {
        defaultSessions.push({
          id: "ses-extra-" + (14 - i),
          date: sDate,
          subjectId: subjectKeys[(i + 2) % subjectKeys.length],
          durationMinutes: 45,
          topic: "Đọc tài liệu bổ trợ và làm flashcard",
          focusRating: 5,
          notes: "Phiên học phụ buổi tối."
        });
      }
    }

    // Default Notes
    const defaultNotes = [
      {
        id: "note-1",
        title: "Tóm tắt độ phức tạp thuật toán sắp xếp (Sorting Complexity)",
        subjectId: "sub-1",
        content: `1. Quick Sort: Trung bình O(n log n), xấu nhất O(n^2) khi chọn pivot tệ.
2. Merge Sort: Luôn luôn O(n log n) trong mọi trường hợp, tốn O(n) bộ nhớ phụ.
3. Heap Sort: O(n log n), không tốn thêm bộ nhớ.
4. Binary Search: O(log n) trên mảng đã sắp xếp.`,
        tags: ["thuat-toan", "ctdl", "on-thi"],
        isFavorite: true,
        createdAt: addDays(today, -3) + "T10:30:00"
      },
      {
        id: "note-2",
        title: "4 Tính chất trụ cột của Lập trình hướng đối tượng (OOP)",
        subjectId: "sub-2",
        content: `1. Đóng gói (Encapsulation): Che giấu chi tiết cài đặt bằng private/protected, cung cấp getter/setter.
2. Kế thừa (Inheritance): Lớp con tái sử dụng thuộc tính & phương thức của lớp cha.
3. Đa hình (Polymorphism): Nhiều hình thái thể hiện, ghi đè (Override) phương thức ảo virtual/abstract.
4. Trừu tượng (Abstraction): Tập trung vào hành vi cốt lõi, loại bỏ chi tiết rườm rà.`,
        tags: ["oop", "kien-thuc-co-ban"],
        isFavorite: true,
        createdAt: addDays(today, -5) + "T14:15:00"
      },
      {
        id: "note-3",
        title: "Các dạng chuẩn hóa CSDL quan hệ cần nhớ khi đi thi",
        subjectId: "sub-3",
        content: `* 1NF: Mọi giá trị trong cột phải là nguyên tử (Atomic).
* 2NF: Đạt 1NF và không có thuộc tính không khóa nào phụ thuộc một phần vào khóa chính.
* 3NF: Đạt 2NF và không có phụ thuộc bắc cầu (Transitive dependency).`,
        tags: ["csdl", "chuan-hoa"],
        isFavorite: false,
        createdAt: addDays(today, -7) + "T09:00:00"
      }
    ];

    // Save all to localStorage
    this.saveSettings(defaultSettings);
    this.saveSemesters(defaultSemesters);
    this.saveSubjects(defaultSubjects);
    this.saveTasks(defaultTasks);
    this.saveSchedule(defaultSchedule);
    this.saveStudyPlan(defaultStudyPlan);
    this.saveGoals(defaultGoals);
    this.saveSessions(defaultSessions);
    this.saveNotes(defaultNotes);

    return true;
  }
};

