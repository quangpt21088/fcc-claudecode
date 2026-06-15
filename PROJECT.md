# Dự án: lopvancohoan

## 1. Tổng quan
- **Tên dự án:** lopvancohoan
- **Mục đích:** Website giới thiệu lớp văn hoàn — landing page + admin CMS
- **Đối tượng:** Phụ huynh tìm lớp học cho con
- **URL:** [Cập nhật sau khi deploy]

## 2. Công nghệ
- **Frontend:** HTML5 + Tailwind CSS (CDN) + Vanilla JS
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (Railway)
- **Auth:** JWT + bcrypt
- **File Upload:** Multer (disk storage, 2MB limit)
- **Deploy:** Railway

## 3. Cấu trúc thư mục
```
lopvancohoan/
├── server.js            # API endpoints + bảo mật
├── database.js          # Kết nối PostgreSQL + init tables
├── package.json         # Dependencies
├── .env                 # Biến môi trường local
├── PROJECT.md           # File này
└── public/
    ├── index.html       # Landing Page (nội dung động từ DB)
    ├── uploads/         # Ảnh upload (logo, teacher photo)
    └── admin/
        ├── login.html   # Đăng nhập Admin (dark glass)
        ├── dashboard.html # Quản lý nội dung, lịch học, học sinh (sidebar + dark)
        └── admin.js     # Gọi API admin (upload, password strength)
```

## 4. API Endpoints

| Method | Route | Quyền | Chức năng |
|--------|-------|-------|-----------|
| GET | /api/content | Công khai | Lấy nội dung trang chủ |
| POST | /api/register | Công khai | Đăng ký học |
| POST | /api/admin/login | Công khai | Đăng nhập admin → JWT |
| PUT | /api/admin/content | Admin | Cập nhật nội dung trang chủ |
| GET | /api/admin/settings | Admin | Lấy tất cả settings |
| GET | /api/admin/courses | Admin | Danh sách khóa học |
| POST | /api/admin/courses | Admin | Tạo khóa học |
| PUT | /api/admin/courses/:id | Admin | Cập nhật khóa học |
| DELETE | /api/admin/courses/:id | Admin | Xóa khóa học |
| GET | /api/admin/schedule | Admin | Danh sách lịch học |
| POST | /api/admin/schedule | Admin | Tạo lịch học |
| PUT | /api/admin/schedule/:id | Admin | Cập nhật lịch học |
| DELETE | /api/admin/schedule/:id | Admin | Xóa lịch học |
| GET | /api/admin/approach | Admin | Danh sách phương pháp |
| PUT | /api/admin/approach | Admin | Cập nhật phương pháp |
| GET | /api/admin/why | Admin | Danh sách tại sao |
| PUT | /api/admin/why | Admin | Cập nhật tại sao |
| GET | /api/admin/title-styles | Admin | Lấy style tiêu đề |
| PUT | /api/admin/title-styles | Admin | Lưu style tiêu đề |
| GET | /api/admin/registrations | Admin | Danh sách đăng ký |
| PUT | /api/admin/registrations/:id | Admin | Cập nhật trạng thái đăng ký |
| POST | /api/admin/upload | Admin | Upload ảnh (multipart, 2MB max) |
| POST | /api/admin/change-password | Admin | Đổi mật khẩu |

## 5. Database Tables
- **settings** — nội dung trang chủ (hero, teacher, stats)
- **courses** — lớp học (tên, học phí, lịch, trạng thái)
- **schedule** — lịch học (thuộc khóa học nào)
- **approach** — phương pháp học
- **why_items** — lý do chọn lớp
- **registrations** — đăng ký từ phụ huynh
- **admins** — tài khoản quản trị

## 6. Tài khoản mặc định
- **Username:** admin
- **Password:** admin123

## 7. Ghi chú
- 2026-06-04 — Khởi tạo dự án
- 2026-06-15 — Redesign toàn bộ: Editorial Dark theme, sidebar dashboard, file upload, password strength
