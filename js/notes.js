/**
 * NOTES.JS - Academic Notes, Subject Tagging, Favorites & Search
 * StudyTracker Application
 */

const NotesModule = {
  searchQuery: "",
  onlyFavorites: false,

  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    const btnAdd = document.getElementById("btn-add-note");
    if (btnAdd) {
      btnAdd.addEventListener("click", () => this.openAddModal());
    }

    const form = document.getElementById("form-note");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveNote();
      });
    }

    const searchInput = document.getElementById("notes-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.render();
      });
    }

    const filterFav = document.getElementById("btn-notes-filter-fav");
    if (filterFav) {
      filterFav.addEventListener("click", () => {
        this.onlyFavorites = !this.onlyFavorites;
        filterFav.classList.toggle("active", this.onlyFavorites);
        this.render();
      });
    }
  },

  render() {
    const container = document.getElementById("notes-list-container");
    if (!container) return;

    let notes = StorageService.getNotes();

    // Filter Favorites
    if (this.onlyFavorites) {
      notes = notes.filter(n => n.isFavorite);
    }

    // Filter Search
    if (this.searchQuery) {
      notes = notes.filter(n =>
        n.title.toLowerCase().includes(this.searchQuery) ||
        n.content.toLowerCase().includes(this.searchQuery) ||
        (n.tags || []).some(t => t.toLowerCase().includes(this.searchQuery))
      );
    }

    if (notes.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <i class="fa-regular fa-note-sticky empty-state-icon"></i>
          <div class="empty-state-title">Chưa có ghi chú nào</div>
          <p class="empty-state-desc">Lưu lại các công thức, thuật toán quan trọng hoặc mẹo làm bài tại đây.</p>
          <button class="btn btn-primary btn-sm" onclick="NotesModule.openAddModal()">
            <i class="fa-solid fa-plus"></i> Tạo ghi chú mới
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = notes.map(n => {
      const sub = StorageService.getSubjectById(n.subjectId);
      const tags = n.tags || [];

      return `
        <div class="card" style="padding:1.25rem;display:flex;flex-direction:column;justify-content:space-between;gap:0.75rem;">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.4rem;">
              <h3 style="font-size:1.05rem;font-weight:700;color:var(--text-primary);line-height:1.3;">
                ${n.title}
              </h3>
              <button class="btn btn-icon btn-sm" onclick="NotesModule.toggleFavorite('${n.id}')" title="Đánh dấu quan trọng" style="color:${n.isFavorite ? 'var(--warning)' : 'var(--text-muted)'};font-size:1.1rem;">
                <i class="${n.isFavorite ? 'fa-solid' : 'fa-regular'} fa-star"></i>
              </button>
            </div>

            ${sub ? `
              <div style="font-size:0.775rem;font-weight:600;color:${sub.color};margin-bottom:0.5rem;">
                <i class="fa-solid fa-book"></i> ${sub.name}
              </div>
            ` : ''}

            <div style="font-size:0.875rem;color:var(--text-secondary);white-space:pre-wrap;line-height:1.5;max-height:180px;overflow-y:auto;background-color:var(--bg-subtle);padding:0.75rem;border-radius:var(--radius-sm);border:1px solid var(--border-light);font-family:inherit;">
              ${n.content}
            </div>
          </div>

          <div>
            ${tags.length > 0 ? `
              <div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-bottom:0.75rem;">
                ${tags.map(t => `<span class="badge badge-priority-low" style="font-size:0.7rem;">#${t}</span>`).join("")}
              </div>
            ` : ''}

            <div style="display:flex;justify-content:space-between;align-items:center;padding-top:0.6rem;border-top:1px solid var(--border-light);font-size:0.775rem;color:var(--text-muted);">
              <span>${n.createdAt ? new Date(n.createdAt).toLocaleDateString("vi-VN") : ''}</span>
              <div style="display:flex;gap:0.3rem;">
                <button class="btn btn-secondary btn-icon btn-sm" onclick="NotesModule.openEditModal('${n.id}')" title="Sửa">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn btn-secondary btn-icon btn-sm" onclick="NotesModule.deleteNote('${n.id}')" title="Xóa">
                  <i class="fa-solid fa-trash-can" style="color:var(--danger);"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");
  },

  openAddModal() {
    document.getElementById("modal-note-title").textContent = "Tạo ghi chú mới";
    document.getElementById("form-note").reset();
    document.getElementById("note-id-input").value = "";
    this.populateSubjectSelect();
    App.openModal("modal-note");
  },

  openEditModal(id) {
    const notes = StorageService.getNotes();
    const note = notes.find(n => n.id === id);
    if (!note) return;

    document.getElementById("modal-note-title").textContent = "Chỉnh sửa ghi chú";
    document.getElementById("note-id-input").value = note.id;
    document.getElementById("note-title-input").value = note.title;
    document.getElementById("note-content-input").value = note.content;
    document.getElementById("note-tags-input").value = (note.tags || []).join(", ");
    this.populateSubjectSelect(note.subjectId);
    App.openModal("modal-note");
  },

  populateSubjectSelect(selectedId = null) {
    const select = document.getElementById("note-subject-select");
    if (!select) return;
    const subjects = StorageService.getSubjects();
    select.innerHTML = `<option value="">-- Chọn môn học liên quan (tùy chọn) --</option>` +
      subjects.map(s => `<option value="${s.id}" ${s.id === selectedId ? 'selected' : ''}>${s.name}</option>`).join("");
  },

  saveNote() {
    const id = document.getElementById("note-id-input").value;
    const title = document.getElementById("note-title-input").value.trim();
    const subjectId = document.getElementById("note-subject-select").value || null;
    const content = document.getElementById("note-content-input").value.trim();
    const tagsRaw = document.getElementById("note-tags-input").value.trim();
    const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : [];

    if (!title || !content) {
      NotificationService.showToast("Vui lòng nhập tiêu đề và nội dung ghi chú!", "warning");
      return;
    }

    const notes = StorageService.getNotes();

    if (id) {
      const idx = notes.findIndex(n => n.id === id);
      if (idx !== -1) {
        notes[idx] = { ...notes[idx], title, subjectId, content, tags };
        NotificationService.showToast("✓ Đã cập nhật ghi chú!", "success");
      }
    } else {
      const newNote = {
        id: "note-" + Date.now(),
        title,
        subjectId,
        content,
        tags,
        isFavorite: false,
        createdAt: new Date().toISOString()
      };
      notes.unshift(newNote);
      NotificationService.showToast("✓ Đã thêm ghi chú mới!", "success");
    }

    StorageService.saveNotes(notes);
    App.closeModal();
    this.render();
  },

  toggleFavorite(id) {
    const notes = StorageService.getNotes();
    const note = notes.find(n => n.id === id);
    if (note) {
      note.isFavorite = !note.isFavorite;
      StorageService.saveNotes(notes);
      this.render();
    }
  },

  deleteNote(id) {
    App.confirm("Bạn có muốn xóa ghi chú này?", () => {
      let notes = StorageService.getNotes();
      notes = notes.filter(n => n.id !== id);
      StorageService.saveNotes(notes);
      NotificationService.showToast("✓ Đã xóa ghi chú", "info");
      this.render();
    });
  }
};

