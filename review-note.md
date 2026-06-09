# Review Note

## Summary of Findings

### Server (`server.js`)
- **Inconsistent sanitization**: `PUT /api/admin/content` sanitizes all string values, but `POST /api/admin/courses` and `PUT /api/admin/courses/:id` do **not**. This leaves those endpoints vulnerable to XSS injection.
- **Potential DB errors**: `DELETE /api/admin/courses/:id` and `DELETE /api/admin/schedule/:id` pass `req.params.id` directly to the query. While parameterised, a non‑numeric ID could trigger a DB error and return a 500.
- **JWT secret regeneration**: When `JWT_SECRET` is missing or too short, a new secret is generated on each start, invalidating all existing admin tokens silently.
- **Cache race condition**: The in‑memory content cache is shared across requests. Simultaneous updates could cause stale data to be served for a brief window.
- **Logging of raw bodies**: `console.log` statements on course and schedule updates expose full payloads, which may contain sensitive data.

### Database (`database.js`)
- **Admin password generation mismatch**: Documentation (`PROJECT.md`) states the default admin password is `admin123`, but the seed generates a random password each run. This can confuse new developers.
- **Seed‑order coupling**: Schedule seeding links `schedule.course_id` to courses by positional index. If the order changes, schedule entries could be linked to the wrong course.
- **Repeated migrations on every start**: `ALTER TABLE … IF NOT EXISTS` runs on each server start, adding unnecessary overhead.

### Admin Frontend (`public/admin/admin.js`)
- **Redirect race**: The script redirects to `login.html` synchronously, then continues to call API functions. In rare cases the API call may fire before the redirect completes.
- **`checkAuth` misuse**: Some API responses are not wrapped with `checkAuth`, so a 401 could be ignored silently.
- **Base64 image storage**: Uploading logos or photos stores large base64 strings in the `settings` table, inflating DB size and payloads.

### Public Landing Page (`public/index.html`)
- **Dead script**: `public/app.js` is never loaded; the landing page contains all JS inline, making `app.js` dead code.
- **Phone formatting edge case**: Input formatter can produce 11 characters while the HTML `maxlength` is 13 – functional but may cause cursor‑jump issues.

## Recommendations
1. **Sanitize/whitelist all admin‑side POST/PUT endpoints** (courses, schedule, etc.) consistently.
2. **Validate numeric IDs** for delete routes and return a clear error for invalid formats.
3. **Persist a fixed `JWT_SECRET`** in `.env` for production; avoid auto‑generation.
4. **Synchronize admin credential docs** with the actual seed logic or provide a deterministic default password.
5. **Decouple schedule seeding from course order** – explicitly reference course identifiers.
6. **Adjust admin JS redirect flow** to `return` after setting `window.location` or wrap subsequent calls in a guard.
7. **Remove dead `public/app.js`** or switch the landing page to load it for better modularity.
8. **Consider storing images as files** (e.g., on disk or a CDN) rather than base64 in the DB.
9. **Add unit/integration tests** for the API endpoints to catch regression of sanitization and auth handling.

## Bugs Fixed (Tiến trình sửa lỗi)

### Đã sửa ✅

#### 1. POST /api/admin/schedule (DONE)
- **File:** `server.js`
- **Ghi nhận:** Đã thêm sanitizeStr() cho tất cả các trường (class_name, time_slot, days, status, status_text)
- **Thêm validation:** parseInt cho sort_order, parseInt cho course_id (fallback null)
- **Trạng thái:** ✅ HOÀN THÀNH

#### 2. Log cleanup cho POST /api/admin/courses (DONE)
- **File:** `server.js`
- **Ghi nhận:** Đưa log sau vào guard `if (process.env.DEBUG === 'true')`
- **Trạng thái:** ✅ HOÀN THÀNH

#### 3. PUT /api/admin/schedule/:id (DONE)
- **File:** `server.js`
- **Ghi nhận:** Thêm sanitizeStr cho tất cả input, validate numeric ID
- **Trạng thái:** ✅ HOÀN THÀNH

#### 4. PUT /api/admin/courses/:id (DONE)
- **File:** `server.js`
- **Ghi nhận:** Thêm sanitize cho color, status (với whitelist), validate numeric ID, thay error message lộ err.message bằng thông báo chung, đưa log vào DEBUG flag
- **Trạng thái:** ✅ HOÀN THÀNH

#### 5. POST /api/admin/courses (DONE)
- **File:** `server.js`
- **Ghi nhận:** Thêm whitelist cho color và status, validate sort_order, thay error message lộ err.message bằng thông báo chung
- **Trạng thái:** ✅ HOÀN THÀNH

#### 6. DELETE /api/admin/courses/:id (DONE)
- **File:** `server.js`
- **Ghi nhận:** Validate numeric ID trước khi query
- **Trạng thái:** ✅ HOÀN THÀNH

#### 7. DELETE /api/admin/schedule/:id (DONE)
- **File:** `server.js`
- **Ghi nhận:** Validate numeric ID trước khi query
- **Trạng thái:** ✅ HOÀN THÀNH

#### 8. PUT /api/admin/registrations/:id (DONE)
- **File:** `server.js`
- **Ghi nhận:** Validate numeric ID trước khi query
- **Trạng thái:** ✅ HOÀN THÀNH

#### 9. Error message leakage (DONE)
- **File:** `server.js`
- **Ghi nhận:** Thay `'Lỗi server: ' + err.message` bằng `'Lỗi server'` chung cho cả PUT và POST courses
- **Trạng thái:** ✅ HOÀN THÀNH

#### 10. Logging sensitive data trong change-password (DONE)
- **File:** `server.js`
- **Ghi nhận:** Đưa log vào guard `process.env.NODE_ENV !== 'production'`, xóa log rowCount
- **Trạng thái:** ✅ HOÀN THÀNH

#### 11. JWT secret auto-generation (DONE)
- **File:** `server.js`
- **Ghi nhận:** Trong production, fail-fast với `process.exit(1)` nếu thiếu JWT_SECRET; chỉ auto-generate trong development
- **Trạng thái:** ✅ HOÀN THÀNH

#### 12. Redirect race trong admin.js (DONE)
- **File:** `public/admin/admin.js`
- **Ghi nhận:** Thêm `throw new Error('NO_TOKEN')` sau redirect để dừng thực thi
- **Trạng thái:** ✅ HOÀN THÀNH

#### 13. checkAuth misuse trong admin.js (DONE)
- **File:** `public/admin/admin.js`
- **Ghi nhận:** Thêm `if (checkAuth(res)) return;` ngay sau mỗi `await API(...)` trong loadData, loadRegistrations, và status toggle handler
- **Trạng thái:** ✅ HOÀN THÀNH

#### 14. Seed-order coupling (DONE)
- **File:** `database.js`
- **Ghi nhận:** Map schedule.course_id bằng short_name thay vị positional index
- **Trạng thái:** ✅ HOÀN THÀNH

#### 15. Repeated migrations mỗi lần start (DONE)
- **File:** `database.js`
- **Ghi nhận:** Thêm schema_version tracking, chỉ chạy ALTER TABLE khi version < target
- **Trạng thái:** ✅ HOÀN THÀNH

#### 16. Admin password doc mismatch (DONE)
- **File:** `database.js`
- **Ghi nhận:** Đổi random password thành static `admin123` để khớp với PROJECT.md
- **Trạng thái:** ✅ HOÀN THÀNH

#### 17. Phone formatting cursor jump (DONE)
- **File:** `public/index.html`
- **Ghi nhận:** Lưu và khôi phục caret position sau khi format
- **Trạng thái:** ✅ HOÀN THÀNH

#### 18. Dead public/app.js (DONE)
- **File:** `public/app.js`
- **Ghi nhận:** Đã xóa file
- **Trạng thái:** ✅ HOÀN THÀNH

### Chưa sửa ❌ (Theo thứ tự ưu tiên)

#### 19. Base64 image storage (TODO) - MEDIUM
- **File:** `public/admin/admin.js` (logo & teacher photo upload handlers)
- **Vấn đề:** Lưu base64 vào DB, làm phình to dữ liệu
- **Cần làm (dài hạn):** Thêm endpoint upload file (multer), lưu file vào `public/uploads/`, chỉ lưu URL trong DB
- **Ghi chú:** Cần cài thêm dependency `multer`, tạo thư mục uploads, cấu hình static serving

## Tiến trình tổng thể
- Tổng số bugs/tối ưu: **19**
- Đã sửa: **18** (94.7%)
- Chưa sửa: **1** (5.3%)
- Ngày bắt đầu: 2026‑06‑09
- Trạng thái: Gần hoàn thành
