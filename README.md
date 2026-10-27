# StudyTracker - Ứng Dụng Theo Dõi & Quản Lý Quá Trình Học Tập Cá Nhân

StudyTracker là một ứng dụng web Single Page Application (SPA) hiện đại, trực quan, chuyên nghiệp và hoạt động hoàn toàn độc lập trên trình duyệt để giúp học sinh, sinh viên quản lý toàn bộ quá trình học tập, lịch học, công việc, mục tiêu, điểm số và năng suất cá nhân.

---

## 🚀 1. Điểm nổi bật & Tính năng cốt lõi

* **Dashboard Tổng Quan**:
  * Trả lời tức thì 5 câu hỏi học tập cốt lõi của sinh viên.
  * Thống kê tổng môn, môn đang học, số giờ học hôm nay (% so sánh với hôm qua), GPA hiện tại, task chưa làm, deadline gần nhất.
  * **🔥 Study Streak**: Đếm chuỗi ngày học liên tục và kỷ lục dài nhất.
  * **Biểu đồ cột 7 ngày**: Số giờ học từ Thứ 2 đến Chủ nhật (Chart.js).
  * **Study Activity Heatmap**: Biểu đồ nhiệt hoạt động học tập tương tự GitHub.
  * **Weekly Study Report**: Tóm tắt hiệu suất học tập trong 7 ngày gần nhất.

* **Quản Lý Môn Học (Subjects)**:
  * CRUD đầy đủ theo từng học kỳ.
  * **Hỗ trợ số tín chỉ là số thực**: Cho phép nhập số thập phân như `2.5` tín chỉ, `1.5` tín chỉ, `3.0` tín chỉ,... phù hợp quy chế học chế tín chỉ các trường đại học.
  * Thẻ môn học với mã màu riêng, giảng viên, số tín chỉ, tiến độ và điểm số.
  * **Checklist chương học**: Tích chọn hoàn thành từng chương, hệ thống tự động tính toán tỷ lệ hoàn thành % môn học và cập nhật lên Dashboard.
  * **Cấu hình trọng số điểm**: Điểm chuyên cần, bài tập, giữa kỳ, cuối kỳ với công thức tính điểm tổng kết tự động.

* **Thời Khóa Biểu (Schedule)**:
  * Lịch học trong tuần trực quan theo thứ (Thứ 2 đến Chủ nhật) hoặc xem riêng ngày hôm nay.
  * Hiển thị khung giờ, mã màu môn học, phòng học và giảng viên phụ trách.

* **Quản Lý Công Việc & Deadline (Tasks)**:
  * Phân loại mức độ ưu tiên: Thấp, Trung bình, Cao, Khẩn cấp (Urgent).
  * Bộ lọc trạng thái: Tất cả, Hôm nay, Sắp tới, Đã quá hạn (Overdue 🔴), Đã hoàn thành.
  * Sắp xếp theo Deadline, Mức ưu tiên hoặc Tên công việc.

* **Kế Hoạch Học Tập & Tương Lai (Study Plan)**:
  * Kế hoạch hôm nay: Phân bổ theo từng khung giờ cụ thể (Timeline).
  * Kế hoạch tương lai: Đặt các cột mốc (Milestones) theo tháng và theo học kỳ.

* **Mục Tiêu Học Tập (Goals)**:
  * Phân loại mục tiêu: Ngắn hạn, Trung hạn, Dài hạn.
  * Thanh tiến độ % có thể tùy chỉnh, hạn chót và mô tả chiến lược đạt mục tiêu.

* **Đồng Hồ Học Tập Pomodoro (Study Timer)**:
  * Chế độ Pomodoro (25/5, 50/10 tùy chỉnh).
  * Chạy/Tạm dừng/Đặt lại/Kết thúc phiên học.
  * Ghi nhận phiên học: Chọn môn, nội dung đã học, đánh giá độ tập trung (1-5 sao), ghi chú -> Tự động lưu vào **Study History**, tính vào Streak và vẽ biểu đồ.
  * Phát âm thanh chuông báo hiệu khi hết giờ qua Web Audio API.

* **Lịch Sử Học Tập (Study History)**:
  * Danh sách chi tiết các phiên học, lọc theo môn học, hiển thị thời lượng và số sao tập trung.

* **Điểm Số, GPA & Dự Đoán Điểm (Grades)**:
  * Tự động tính GPA thang điểm 4.0 và Điểm trung bình thang 10 có trọng số tín chỉ.
  * **Hỗ trợ mức điểm A+**: Bảng quy đổi có đầy đủ mức `A+` (>= 9.0, GPA 4.0), `A`, `B+`, `B`, `C+`, `C`, `D+`, `D`, `F` và cho phép tùy chỉnh ngưỡng điểm quy đổi linh hoạt.
  * **Công cụ Target Grade**: Nhập điểm hiện tại, điểm mục tiêu và % bài thi còn lại để tính chính xác số điểm tối thiểu cần đạt ở bài thi cuối kỳ.

* **Ghi Chú Học Tập (Notes)**:
  * Quản lý công thức, ghi chép học tập theo thẻ môn, gắn `#tags`, đánh dấu quan trọng (Favorite) và tìm kiếm tức thì.

* **Hệ Thống Tiện Ích Toàn Ứng Dụng**:
  * **Đăng nhập Gmail & Đồng bộ Đa thiết bị (Cloud Sync)**:
    * Đăng nhập bằng tài khoản Google (Gmail).
    * Đồng bộ dữ liệu học tập tự động 2 chiều giữa **Laptop, Máy tính bảng và Điện thoại**.
    * Hoạt động theo mô hình Offline-First: Vừa lưu cực nhanh vào `localStorage`, vừa đồng bộ lên Đám mây (Firebase Firestore) khi có mạng.
  * **Tìm kiếm toàn cục (Global Search)**: Nhấn `Ctrl + K` hoặc gõ trên thanh tìm kiếm để tìm nhanh môn học, công việc, mục tiêu, ghi chú.
  * **Thông báo nội bộ (In-app Alerts & Toasts)**: Cảnh báo công việc quá hạn, deadline khẩn cấp < 48 giờ.
  * **Dark Mode / Light Mode**: Chuyển đổi giao diện sáng/tối mượt mà, lưu trạng thái vào `localStorage`.
  * **Sao lưu & Khôi phục Dữ liệu (Backup)**: Xuất dữ liệu ra file JSON (`Export`) và nhập lại file JSON (`Import`) với modal xác nhận an toàn.
  * **Nạp lại dữ liệu mẫu**: Khôi phục dữ liệu mẫu sinh viên CNTT phong phú bất cứ lúc nào.

---

## 💻 2. Công nghệ sử dụng

* **HTML5**: Cấu trúc ngữ nghĩa chuẩn, hỗ trợ đầy đủ thiết bị di động.
* **CSS3**: CSS Variables (Design Tokens), Flexbox, CSS Grid, Transitions, Keyframe Animations, Glassmorphism nhẹ.
* **Vanilla JavaScript (ES6+)**: Module hóa rõ ràng, không sử dụng React, Vue, Angular hay framework cồng kềnh.
* **Lưu trữ**: 100% Client-side bằng `localStorage`.
* **Thư viện CDN trợ lực**:
  * [Chart.js 4.4.1](https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js) để vẽ biểu đồ tương tác mượt mà.
  * [Font Awesome 6.5.2](https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css) cho hệ thống icon đồng bộ.

---

## 📱 3. Thiết kế Responsive Design

Ứng dụng đáp ứng chuẩn mực trên mọi kích thước màn hình:
* **Desktop (> 1024px)**: Sidebar trái tiện lợi, Header tìm kiếm nhanh, Dashboard 2 cột tối ưu không gian.
* **Tablet (768px - 1024px)**: Co giãn thông minh các lưới thống kê và thời khóa biểu.
* **Mobile (< 768px down to 360px)**:
  * Sidebar chuyển thành **Hamburger menu trượt** kèm backdrop làm mờ.
  * Tích hợp thanh **Bottom Navigation Bar** ở đáy màn hình giúp thao tác ngón cái dễ dàng.
  * Thứ tự hiển thị Dashboard được tối ưu: *Tiến độ -> Giờ học -> Deadline -> Việc cần làm -> Môn học -> Biểu đồ*.
  * Tuyệt đối không bị lỗi tràn viền ngang (no horizontal overflow).

---

## 📂 4. Cấu trúc thư mục

```text
Theo Dõi Quá Trình Học Tập/
│
├── index.html                  # Giao diện chính SPA (Sidebar, Header, 11 Views, Modals)
│
├── css/
│   ├── themes.css              # Bảng màu, biến CSS tokens cho Light Mode & Dark Mode
│   ├── style.css               # Phong cách cốt lõi, components, cards, forms, modals, buttons
│   └── responsive.css          # Tối ưu hóa Tablet, Mobile (<768px) và màn hình nhỏ 360px
│
├── js/
│   ├── storage.js              # Engine LocalStorage, Schema, Sample Data seeding, Export/Import JSON
│   ├── notifications.js        # Toasts UI, In-app Alert Center quét deadline & Web Audio API
│   ├── auth.js                 # Đăng nhập Gmail (Google Auth), Cloud Sync đa thiết bị
│   ├── timer.js                # Pomodoro / Custom timer engine, ghi nhận phiên học
│   ├── dashboard.js            # Tính toán chỉ số tổng thể, streak, biểu đồ 7 ngày, heatmap
│   ├── subjects.js             # Quản lý môn học, checklist chương học %, tính điểm thành phần
│   ├── tasks.js                # Quản lý công việc, deadline, priority, filter All/Today/Upcoming/Overdue
│   ├── schedule.js             # Thời khóa biểu tuần/ngày, phòng học, giảng viên
│   ├── study-plan.js           # Kế hoạch học tập hôm nay và cột mốc tương lai
│   ├── goals.js                # Mục tiêu ngắn, trung, dài hạn & thanh tiến độ
│   ├── statistics.js           # Biểu đồ năng suất Chart.js, quản lý lịch sử học tập (History)
│   ├── grades.js               # Tính GPA hệ 4 & hệ 10, bảng quy đổi điểm chữ, công cụ Target Grade
│   ├── notes.js                # Quản lý sổ tay ghi chú, tags, tìm kiếm thời gian thực
│   ├── settings.js             # Cài đặt Profile, mục tiêu giờ học, quản lý học kỳ, sao lưu dữ liệu
│   └── app.js                  # Nhạc trưởng SPA router, theme toggle, Global Search, modal manager
│
├── assets/
│   └── favicon.svg             # Favicon học thuật hiện đại SVG
│
└── README.md                   # Tài liệu hướng dẫn sử dụng và thông số kỹ thuật
```

---

## 🏃 5. Hướng dẫn chạy ứng dụng

### Cách 1: Sử dụng VS Code + Live Server (Khuyên dùng)
1. Mở thư mục `d:\Theo Dõi Quá Trình Học Tập` bằng **Visual Studio Code**.
2. Nhấp chuột phải vào tệp `index.html`.
3. Chọn **Open with Live Server** (hoặc nhấn tổ hợp phím `Alt + L, Alt + O`).
4. Trình duyệt sẽ tự động mở tại địa chỉ `http://127.0.0.1:5500`.

### Cách 2: Mở trực tiếp bằng trình duyệt
* Nhấp đúp chuột trực tiếp vào file `index.html` trong File Explorer để mở bằng Chrome, Edge, Firefox, Safari. Toàn bộ tính năng `localStorage`, timer và biểu đồ hoạt động hoàn hảo mà không cần web server chuyên dụng.

---

## 💡 6. Dữ liệu mẫu (Sample Data)
Ứng dụng được tích hợp sẵn bộ dữ liệu mẫu sinh viên CNTT thực tế và sinh động ngay trong lần đầu mở:
* 5 môn học đại cương & chuyên ngành CNTT (Cấu trúc dữ liệu, OOP, CSDL, Lập trình Web, Tiếng Nhật IT) kèm theo các chương học chi tiết và trọng số điểm.
* Các công việc sắp đến hạn và đã hoàn thành.
* Lịch học hàng tuần và kế hoạch khung giờ hôm nay.
* Chuỗi ngày học (Study Streak) hoạt động với các phiên học trong 14 ngày gần nhất để biểu đồ tuần và heatmap hiển thị sinh động.
* Bạn hoàn toàn có thể thêm, sửa, xóa hoặc nạp lại dữ liệu mẫu trong mục **Cài đặt**.

