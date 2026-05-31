# Mô tả dự án: Infobyme

## 1. Tổng quan
📖 TỔNG HỢP DỰ ÁN — WEBSITE LỚP NGỮ VĂN THCS

🎯 Tổng quan

• Công nghệ: HTML5 + Tailwind CSS v4 + Vanilla JS — 1 file duy nhất index.html
• Server: http://localhost:5173
• Mục tiêu: Cung cấp thông tin khóa học + lịch học + đăng ký (chưa có thanh toán)

───

🧩 7 Module đã xây dựng

| # | Module       | Chức năng chính                                                                                                 |
| --- | ------------ | --------------------------------------------------------------------------------------------------------------- |
| 1 | Header       | Fixed, thu nhỏ khi scroll, mobile hamburger menu, CTA "Đăng ký ngay"                                            |
| 2 | Hero         | Gradient text "Khơi nguồn tư duy — Bứt phá điểm số", trust badges (10+ năm • 500+ HS • 4.9⭐️), floating card 98% |
| 3 | Courses Grid | 4 card Lớp 6→9, grid 1→2→4 cột, badge riêng, thông số buổi học, micro-interaction scale-[1.02]                  |
| 4 | Schedule     | Bảng lịch 5 lớp, 3 trạng thái màu (🟢 Còn chỗ / 🟡 Sắp đầy / 🔴 Đủ sĩ số), nút ĐK bị disable nếu hết chỗ        |
| 5 | Form         | 4 trường bắt buộc + validate (SĐT 10 số, auto-format), gửi Google Sheets qua Apps Script, modal thành công      |
| 6 | Footer       | Địa chỉ, hotline, Google Maps nhúng, quick links                                                                |
| 7 | FABs         | 2 nút tròn góc dưới phải: 💬 Zalo (pulse) + 📞 Gọi điện (float)                                                 |

───

⚙️ Yêu cầu kỹ thuật đã áp dụng

| Yêu cầu                                              | Trạng thái       |
| ---------------------------------------------------- | ---------------- |
| grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 | ✅ Đúng spec      |
| hover:scale-[1.02] transition-all duration-300       | ✅ Trên cả 4 card |
| Header shrink + backdrop-blur khi scroll             | ✅                |
| Scroll reveal animation (IntersectionObserver)       | ✅                |
| Responsive: mobile / tablet / desktop                | ✅                |
| Form validate + Google Sheets webhook                | ✅ (cần nhập URL) |

───

📋 TODO để deploy thật

| # | Việc                                         | Mức độ      |
| --- | -------------------------------------------- | ----------- |
| 1 | Tạo Google Apps Script → gán APPS_SCRIPT_URL | 🔴 Bắt buộc |
| 2 | Thay [Tên] bằng tên thật                     | 🔴 Bắt buộc |
| 3 | Cập nhật SĐT thật (hotline, Zalo, FAB)       | 🔴 Bắt buộc |
| 4 | Thay Google Maps iframe địa chỉ thật         | 🟡 Nên làm  |
| 5 | Thay ảnh giáo viên trong Hero                | 🟡 Nên làm  |
