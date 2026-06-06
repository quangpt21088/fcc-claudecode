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
    ├── app.js           # Tải nội dung + gửi form đăng ký
    └── admin/
        ├── login.html   # Đăng nhập Admin
        ├── dashboard.html # Quản lý nội dung, lịch học, học sinh
        └── admin.js     # Gọi API admin
```

## 4. API Endpoints

| Method | Route | Quyền | Chức năng |
|--------|-------|-------|-----------|
| GET | /api/content | Công khai | Lấy nội dung trang chủ |
| POST | /api/register | Công khai | Đăng ký học |
| POST | /api/admin/login | Công khai | Đăng nhập admin → JWT |
| PUT | /api/admin/content | Admin | Cập nhật nội dung trang chủ |
| PUT | /api/admin/schedule | Admin | Cập nhật lịch học, trạng thái |
| GET | /api/admin/registrations | Admin | Danh sách đăng ký |
| PUT | /api/admin/registrations/:id | Admin | Cập nhật trạng thái đăng ký |
| POST | /api/admin/change-password | Admin | Đổi mật khẩu |

## 5. Database Tables
- **settings** — nội dung trang chủ (hero, teacher, stats)
- **courses** — lớp học (tên, học phí, lịch, trạng thái)
- **registrations** — đăng ký từ phụ huynh
- **admins** — tài khoản quản trị

## 6. Tài khoản mặc định
- **Username:** admin
- **Password:** admin123

## 7. Ghi chú
- 2026-06-04 — Khởi tạo dự án
