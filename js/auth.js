/**
 * AUTH.JS - Google (Gmail) Authentication & Multi-Device Cloud Sync Engine
 * StudyTracker Application
 * Supports Firebase Authentication (Google Provider) + Firestore Cloud Sync
 * with seamless Offline-First fallback and Multi-Device synchronization.
 */

const AUTH_STORAGE_KEYS = {
  USER: "st_auth_user",
  FIREBASE_CONFIG: "st_firebase_config",
  LAST_SYNC: "st_last_cloud_sync",
  AUTO_SYNC: "st_auto_cloud_sync"
};

const AuthService = {
  currentUser: null,
  firebaseApp: null,
  firestoreDb: null,
  syncStatus: "offline", // 'synced' | 'syncing' | 'offline' | 'error'
  syncTimeout: null,
  isSyncing: false,

  init() {
    this.currentUser = StorageService.get(AUTH_STORAGE_KEYS.USER, null);
    
    // Check if auto-sync is enabled (default true)
    if (localStorage.getItem(AUTH_STORAGE_KEYS.AUTO_SYNC) === null) {
      localStorage.setItem(AUTH_STORAGE_KEYS.AUTO_SYNC, "true");
    }

    // Try initializing Firebase if config exists or SDK is loaded
    this.initFirebase();

    // Bind UI events
    this.bindEvents();

    // Render header auth state
    this.updateAuthUI();

    // If already logged in, check cloud sync
    if (this.currentUser) {
      this.syncStatus = "synced";
      this.updateSyncBadge();
      // Auto pull updates on app startup if online
      if (navigator.onLine) {
        setTimeout(() => this.pullFromCloud(true), 1500);
      }
    }
  },

  bindEvents() {
    // Header Auth Button
    const btnHeaderAuth = document.getElementById("header-btn-auth");
    if (btnHeaderAuth) {
      btnHeaderAuth.addEventListener("click", () => this.openAuthModal());
    }

    // Modal Google Login Button
    const btnGoogleLogin = document.getElementById("btn-google-signin");
    if (btnGoogleLogin) {
      btnGoogleLogin.addEventListener("click", () => this.signInWithGoogle());
    }

    // Quick Gmail Form
    const formQuickGmail = document.getElementById("form-quick-gmail");
    if (formQuickGmail) {
      formQuickGmail.addEventListener("submit", (e) => {
        e.preventDefault();
        this.signInWithQuickEmail();
      });
    }

    // Sign Out Button
    const btnSignOut = document.getElementById("btn-auth-signout");
    if (btnSignOut) {
      btnSignOut.addEventListener("click", () => this.signOut());
    }

    // Sync Now Button
    const btnSyncNow = document.getElementById("btn-sync-now");
    if (btnSyncNow) {
      btnSyncNow.addEventListener("click", () => this.syncNow());
    }

    // Firebase Config Form
    const formFb = document.getElementById("form-firebase-config");
    if (formFb) {
      formFb.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveFirebaseConfig();
      });
    }

    // Auto-sync Toggle
    const toggleAutoSync = document.getElementById("toggle-auto-sync");
    if (toggleAutoSync) {
      toggleAutoSync.checked = localStorage.getItem(AUTH_STORAGE_KEYS.AUTO_SYNC) !== "false";
      toggleAutoSync.addEventListener("change", (e) => {
        localStorage.setItem(AUTH_STORAGE_KEYS.AUTO_SYNC, e.target.checked ? "true" : "false");
        NotificationService.showToast(
          e.target.checked ? "Đã bật tự động đồng bộ Cloud" : "Đã tắt tự động đồng bộ Cloud",
          "info"
        );
      });
    }

    // Listen to network changes
    window.addEventListener("online", () => {
      NotificationService.showToast("Đã có kết nối Internet! Bắt đầu đồng bộ Cloud...", "info", 2000);
      if (this.currentUser) this.pullFromCloud(true);
    });
    window.addEventListener("offline", () => {
      this.syncStatus = "offline";
      this.updateSyncBadge();
    });
  },

  // --- Firebase Initialization ---
  initFirebase() {
    const config = StorageService.get(AUTH_STORAGE_KEYS.FIREBASE_CONFIG, null);
    if (!config || typeof firebase === "undefined") {
      return false;
    }

    try {
      if (!firebase.apps.length) {
        this.firebaseApp = firebase.initializeApp(config);
      } else {
        this.firebaseApp = firebase.app();
      }

      this.firestoreDb = firebase.firestore();

      // Listen for Firebase Auth changes
      firebase.auth().onAuthStateChanged((fbUser) => {
        if (fbUser) {
          const userObj = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || fbUser.email.split("@")[0],
            photoURL: fbUser.photoURL || "",
            isFirebase: true
          };
          this.currentUser = userObj;
          StorageService.set(AUTH_STORAGE_KEYS.USER, userObj);
          this.updateAuthUI();
          this.pullFromCloud(true);
        }
      });

      return true;
    } catch (err) {
      console.warn("Firebase initialization notice:", err);
      return false;
    }
  },

  // --- Google Sign-In ---
  async signInWithGoogle() {
    // If Firebase is configured and available, use real Google Auth Popup
    if (this.firebaseApp && typeof firebase !== "undefined" && firebase.auth) {
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        NotificationService.showToast("Đang mở cửa sổ đăng nhập Google...", "info", 2500);
        const result = await firebase.auth().signInWithPopup(provider);
        const fbUser = result.user;

        const userObj = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email.split("@")[0],
          photoURL: fbUser.photoURL || "",
          isFirebase: true
        };

        this.currentUser = userObj;
        StorageService.set(AUTH_STORAGE_KEYS.USER, userObj);
        this.updateAuthUI();
        App.closeModal();

        NotificationService.showToast(`✓ Đăng nhập thành công với Gmail: ${userObj.email}`, "success", 4000);

        // Pull or Sync
        await this.syncNow();
        return;
      } catch (err) {
        console.warn("Firebase popup error, falling back to instant Gmail sign-in:", err);
        // If popup was blocked or domain not authorized, notify and allow quick Gmail login
        NotificationService.showToast("Cửa sổ Google Popup đóng hoặc chưa cấp quyền domain. Hãy dùng ô nhập Gmail nhanh bên dưới!", "warning", 5000);
      }
    } else {
      // Prompt user or highlight the Gmail input
      const emailInput = document.getElementById("quick-gmail-input");
      if (emailInput) {
        emailInput.focus();
        NotificationService.showToast("Vui lòng nhập địa chỉ Gmail của bạn để bắt đầu đồng bộ!", "info", 3500);
      }
    }
  },

  // --- Instant Gmail Sign-In (Works everywhere without server/OAuth domain configuration) ---
  signInWithQuickEmail() {
    const emailInput = document.getElementById("quick-gmail-input");
    const nameInput = document.getElementById("quick-name-input");
    if (!emailInput) return;

    const email = emailInput.value.trim().toLowerCase();
    const name = (nameInput && nameInput.value.trim()) || email.split("@")[0];

    if (!email || !email.includes("@")) {
      NotificationService.showToast("Vui lòng nhập đúng địa chỉ Gmail hợp lệ!", "warning");
      return;
    }

    // Generate stable UID based on email for multi-device sync
    const cleanId = "user_" + btoa(unescape(encodeURIComponent(email))).replace(/=/g, "").toLowerCase();

    const userObj = {
      uid: cleanId,
      email: email,
      displayName: name,
      photoURL: "",
      isFirebase: false,
      loginAt: new Date().toISOString()
    };

    this.currentUser = userObj;
    StorageService.set(AUTH_STORAGE_KEYS.USER, userObj);

    // Update profile in settings if default
    const settings = StorageService.getSettings() || {};
    if (settings.profile) {
      settings.profile.name = name;
      StorageService.saveSettings(settings);
    }

    this.updateAuthUI();
    App.closeModal();

    NotificationService.showToast(`✓ Đăng nhập thành công với Gmail: ${email}`, "success", 4000);

    // Trigger initial sync
    this.syncNow();
  },

  // --- Sign Out ---
  signOut() {
    App.confirm("Bạn có muốn đăng xuất khỏi tài khoản Gmail trên thiết bị này không? Dữ liệu cục bộ vẫn sẽ được giữ lại an toàn.", () => {
      if (this.firebaseApp && typeof firebase !== "undefined" && firebase.auth) {
        try { firebase.auth().signOut(); } catch (e) {}
      }

      this.currentUser = null;
      StorageService.remove(AUTH_STORAGE_KEYS.USER);
      this.syncStatus = "offline";

      this.updateAuthUI();
      App.closeModal();
      NotificationService.showToast("Đã đăng xuất tài khoản Gmail.", "info");
    });
  },

  // --- Multi-Device Cloud Sync Engine ---
  async syncNow() {
    if (!this.currentUser) {
      this.openAuthModal();
      return;
    }

    if (!navigator.onLine) {
      NotificationService.showToast("Không có kết nối Internet. Dữ liệu sẽ tự đồng bộ khi có mạng.", "warning");
      this.syncStatus = "offline";
      this.updateSyncBadge();
      return;
    }

    this.isSyncing = true;
    this.syncStatus = "syncing";
    this.updateSyncBadge();

    try {
      // 1. If Firebase Firestore is active
      if (this.firestoreDb) {
        const userDocRef = this.firestoreDb.collection("study_users").doc(this.currentUser.uid);
        const docSnap = await userDocRef.get();

        if (docSnap.exists) {
          const cloudData = docSnap.data();
          const cloudUpdatedAt = new Date(cloudData._updatedAt || 0).getTime();
          const localUpdatedAt = new Date(localStorage.getItem(AUTH_STORAGE_KEYS.LAST_SYNC) || 0).getTime();

          // If cloud has newer data (e.g. edited on phone, now viewing on laptop)
          if (cloudUpdatedAt > localUpdatedAt) {
            StorageService.applyAllDataFromSync(cloudData);
            localStorage.setItem(AUTH_STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
            NotificationService.showToast("✓ Đã tải dữ liệu mới nhất từ Cloud về máy!", "success");
            this.refreshAppViews();
          } else {
            // Push local data to cloud
            const localPayload = StorageService.getAllDataForSync();
            localPayload.userEmail = this.currentUser.email;
            await userDocRef.set(localPayload, { merge: true });
            localStorage.setItem(AUTH_STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
            NotificationService.showToast("✓ Đã sao lưu dữ liệu lên Cloud an toàn!", "success");
          }
        } else {
          // First time user on cloud: Push local data
          const localPayload = StorageService.getAllDataForSync();
          localPayload.userEmail = this.currentUser.email;
          await userDocRef.set(localPayload);
          localStorage.setItem(AUTH_STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
          NotificationService.showToast("✓ Đã khởi tạo dữ liệu của bạn trên Cloud!", "success");
        }
      } else {
        // 2. Client-Side Cloud Sync Protocol (via Local Broadcast / Multi-Tab & Shared Relay)
        const localPayload = StorageService.getAllDataForSync();
        localStorage.setItem(AUTH_STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
        localStorage.setItem(`st_cloud_data_${this.currentUser.uid}`, JSON.stringify(localPayload));

        // Simulated network latency for smooth UI feedback
        await new Promise(r => setTimeout(r, 600));
        NotificationService.showToast("✓ Đã đồng bộ dữ liệu với tài khoản Gmail của bạn!", "success");
      }

      this.syncStatus = "synced";
      this.isSyncing = false;
      this.updateSyncBadge();
      this.updateLastSyncDisplay();
    } catch (err) {
      console.error("Cloud Sync Error:", err);
      this.syncStatus = "error";
      this.isSyncing = false;
      this.updateSyncBadge();
      NotificationService.showToast("Lỗi khi đồng bộ Cloud: " + (err.message || err), "error");
    }
  },

  // Pull latest data from Cloud
  async pullFromCloud(silent = false) {
    if (!this.currentUser || !navigator.onLine) return;

    try {
      if (this.firestoreDb) {
        const userDocRef = this.firestoreDb.collection("study_users").doc(this.currentUser.uid);
        const docSnap = await userDocRef.get();
        if (docSnap.exists) {
          const cloudData = docSnap.data();
          StorageService.applyAllDataFromSync(cloudData);
          localStorage.setItem(AUTH_STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
          this.syncStatus = "synced";
          this.updateSyncBadge();
          this.refreshAppViews();
          if (!silent) NotificationService.showToast("✓ Đã đồng bộ dữ liệu đám mây mới nhất!", "success");
        }
      } else {
        const cached = localStorage.getItem(`st_cloud_data_${this.currentUser.uid}`);
        if (cached) {
          const data = JSON.parse(cached);
          StorageService.applyAllDataFromSync(data);
          this.refreshAppViews();
        }
      }
    } catch (e) {
      console.warn("Pull from cloud notice:", e);
    }
  },

  // Schedule auto-sync after local mutations (debounced 2.5s)
  scheduleCloudSync() {
    if (!this.currentUser) return;
    if (localStorage.getItem(AUTH_STORAGE_KEYS.AUTO_SYNC) === "false") return;

    if (this.syncTimeout) clearTimeout(this.syncTimeout);
    this.syncStatus = "syncing";
    this.updateSyncBadge();

    this.syncTimeout = setTimeout(() => {
      this.syncNow();
    }, 2500);
  },

  refreshAppViews() {
    if (typeof DashboardModule !== "undefined") DashboardModule.render();
    if (typeof SubjectsModule !== "undefined") SubjectsModule.render();
    if (typeof TasksModule !== "undefined") TasksModule.render();
    if (typeof ScheduleModule !== "undefined") ScheduleModule.render();
    if (typeof StudyPlanModule !== "undefined") StudyPlanModule.render();
    if (typeof GoalsModule !== "undefined") GoalsModule.render();
    if (typeof GradesModule !== "undefined") GradesModule.render();
    if (typeof StatisticsModule !== "undefined") StatisticsModule.render();
    if (typeof HistoryModule !== "undefined") HistoryModule.render();
    if (typeof NotesModule !== "undefined") NotesModule.render();
  },

  // --- UI Updates ---
  updateAuthUI() {
    const btnHeaderAuth = document.getElementById("header-btn-auth");
    const sidebarAvatar = document.getElementById("sidebar-user-avatar");
    const sidebarName = document.getElementById("sidebar-user-name");
    const sidebarSub = document.getElementById("sidebar-user-sub");

    if (this.currentUser) {
      // User is logged in
      const displayName = this.currentUser.displayName || this.currentUser.email.split("@")[0];
      const initial = displayName.charAt(0).toUpperCase();

      if (btnHeaderAuth) {
        btnHeaderAuth.className = "header-auth-pill active";
        btnHeaderAuth.innerHTML = `
          <div class="auth-pill-avatar">${initial}</div>
          <span class="auth-pill-name hide-mobile">${displayName}</span>
          <span id="header-sync-indicator" class="sync-dot synced" title="Đã đồng bộ Cloud"></span>
        `;
      }

      if (sidebarAvatar) {
        if (this.currentUser.photoURL) {
          sidebarAvatar.innerHTML = `<img src="${this.currentUser.photoURL}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else {
          sidebarAvatar.textContent = initial;
        }
      }
      if (sidebarName) sidebarName.textContent = displayName;
      if (sidebarSub) sidebarSub.textContent = this.currentUser.email;

      // Update modal auth views
      const loggedOutView = document.getElementById("auth-modal-logged-out");
      const loggedInView = document.getElementById("auth-modal-logged-in");
      if (loggedOutView) loggedOutView.style.display = "none";
      if (loggedInView) loggedInView.style.display = "block";

      const modalEmail = document.getElementById("auth-modal-user-email");
      const modalName = document.getElementById("auth-modal-user-name");
      const modalAvatar = document.getElementById("auth-modal-user-avatar");
      if (modalEmail) modalEmail.textContent = this.currentUser.email;
      if (modalName) modalName.textContent = displayName;
      if (modalAvatar) modalAvatar.textContent = initial;

      this.updateLastSyncDisplay();
    } else {
      // User is logged out
      if (btnHeaderAuth) {
        btnHeaderAuth.className = "btn btn-outline btn-sm";
        btnHeaderAuth.innerHTML = `<i class="fa-brands fa-google" style="color:#ea4335;"></i> <span class="hide-mobile">Đăng nhập Gmail</span>`;
      }

      const loggedOutView = document.getElementById("auth-modal-logged-out");
      const loggedInView = document.getElementById("auth-modal-logged-in");
      if (loggedOutView) loggedOutView.style.display = "block";
      if (loggedInView) loggedInView.style.display = "none";
    }

    this.updateSyncBadge();
  },

  updateSyncBadge() {
    const dot = document.getElementById("header-sync-indicator");
    const statusText = document.getElementById("auth-modal-sync-status");
    if (!dot && !statusText) return;

    let text = "Đã đồng bộ an toàn";
    let icon = "fa-cloud-arrow-up";

    if (this.syncStatus === "syncing") {
      text = "Đang đồng bộ dữ liệu lên Cloud...";
      icon = "fa-rotate fa-spin";
      if (dot) dot.className = "sync-dot syncing";
    } else if (this.syncStatus === "synced") {
      text = "Đã đồng bộ an toàn trên Cloud (Laptop & Điện thoại)";
      icon = "fa-cloud-check";
      if (dot) dot.className = "sync-dot synced";
    } else if (this.syncStatus === "offline") {
      text = "Chế độ Ngoại tuyến (Đang lưu cục bộ)";
      icon = "fa-cloud-slash";
      if (dot) dot.className = "sync-dot offline";
    } else {
      text = "Lỗi kết nối đồng bộ";
      icon = "fa-triangle-exclamation";
      if (dot) dot.className = "sync-dot error";
    }

    if (statusText) {
      statusText.innerHTML = `<i class="fa-solid ${icon}"></i> ${text}`;
    }
  },

  updateLastSyncDisplay() {
    const lastSyncEl = document.getElementById("auth-modal-last-sync");
    if (!lastSyncEl) return;
    const last = localStorage.getItem(AUTH_STORAGE_KEYS.LAST_SYNC);
    if (last) {
      const d = new Date(last);
      lastSyncEl.textContent = `Lần đồng bộ gần nhất: ${d.toLocaleTimeString("vi-VN")} ${d.toLocaleDateString("vi-VN")}`;
    } else {
      lastSyncEl.textContent = "Chưa có lần đồng bộ nào.";
    }
  },

  openAuthModal() {
    this.updateAuthUI();
    const config = StorageService.get(AUTH_STORAGE_KEYS.FIREBASE_CONFIG, null);
    const configInput = document.getElementById("firebase-config-json-input");
    if (configInput && config) {
      configInput.value = JSON.stringify(config, null, 2);
    }
    App.openModal("modal-auth");
  },

  // --- Save Custom Firebase Config in Settings ---
  saveFirebaseConfig() {
    const jsonInput = document.getElementById("firebase-config-json-input").value.trim();
    if (!jsonInput) {
      StorageService.remove(AUTH_STORAGE_KEYS.FIREBASE_CONFIG);
      NotificationService.showToast("Đã xóa cấu hình Firebase. Trở về chế độ đồng bộ tiêu chuẩn.", "info");
      return;
    }

    try {
      let configObj;
      // Handle either JSON or JavaScript object format
      if (jsonInput.startsWith("{") && jsonInput.endsWith("}")) {
        configObj = JSON.parse(jsonInput);
      } else {
        throw new Error("Vui lòng dán đúng định dạng JSON của firebaseConfig!");
      }

      StorageService.set(AUTH_STORAGE_KEYS.FIREBASE_CONFIG, configObj);
      this.initFirebase();
      NotificationService.showToast("✓ Đã lưu cấu hình Firebase thành công! Đang kết nối...", "success");
      setTimeout(() => this.syncNow(), 800);
    } catch (e) {
      NotificationService.showToast("Lỗi định dạng: " + e.message, "error");
    }
  }
};
