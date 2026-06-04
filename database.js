const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ─── Settings: key-value store ───
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ─── Courses: lớp học ───
    await client.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL DEFAULT '',
        short_name VARCHAR(50) NOT NULL DEFAULT '',
        emoji VARCHAR(10) NOT NULL DEFAULT '📖',
        color VARCHAR(20) NOT NULL DEFAULT 'blue',
        sub VARCHAR(100) NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        features JSONB DEFAULT '[]',
        duration VARCHAR(50) NOT NULL DEFAULT '2h/buổi',
        max_students VARCHAR(50) NOT NULL DEFAULT 'Tối đa 10',
        sessions VARCHAR(50) NOT NULL DEFAULT '2 buổi/tuần',
        price VARCHAR(50) NOT NULL DEFAULT '',
        status VARCHAR(20) NOT NULL DEFAULT 'available',
        hidden BOOLEAN NOT NULL DEFAULT false,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ─── Schedule: lịch học ───
    await client.query(`
      CREATE TABLE IF NOT EXISTS schedule (
        id SERIAL PRIMARY KEY,
        class_name VARCHAR(100) NOT NULL DEFAULT '',
        time_slot VARCHAR(50) NOT NULL DEFAULT '',
        days VARCHAR(50) NOT NULL DEFAULT '',
        status VARCHAR(20) NOT NULL DEFAULT 'available',
        status_text VARCHAR(50) NOT NULL DEFAULT '🟢 Còn chỗ',
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ─── Approach: phương pháp ───
    await client.query(`
      CREATE TABLE IF NOT EXISTS approach (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ─── Why items: tại sao chọn ───
    await client.query(`
      CREATE TABLE IF NOT EXISTS why_items (
        id SERIAL PRIMARY KEY,
        icon VARCHAR(10) NOT NULL DEFAULT '🏆',
        title VARCHAR(200) NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ─── Registrations ───
    await client.query(`
      CREATE TABLE IF NOT EXISTS registrations (
        id SERIAL PRIMARY KEY,
        parent_name VARCHAR(200) NOT NULL DEFAULT '',
        phone VARCHAR(20) NOT NULL DEFAULT '',
        child_name VARCHAR(200) NOT NULL DEFAULT '',
        grade VARCHAR(20) NOT NULL DEFAULT '',
        note TEXT DEFAULT '',
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ─── Admins ───
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ─── Migrations cho DB cũ ───
    await client.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT false;`);
    await client.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS short_name VARCHAR(50) NOT NULL DEFAULT '';`);
    await client.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS emoji VARCHAR(10) NOT NULL DEFAULT '📖';`);
    await client.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS color VARCHAR(20) NOT NULL DEFAULT 'blue';`);
    await client.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS sub VARCHAR(100) NOT NULL DEFAULT '';`);
    await client.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';`);
    await client.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]';`);
    await client.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration VARCHAR(50) NOT NULL DEFAULT '2h/buổi';`);
    await client.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS max_students VARCHAR(50) NOT NULL DEFAULT 'Tối đa 10';`);
    await client.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS sessions VARCHAR(50) NOT NULL DEFAULT '2 buổi/tuần';`);

    // ─── Seed Settings ───
    const defaultSettings = [
      ['site_name', 'Ngữ Văn'],
      ['site_name_accent', 'THCS'],
      ['hero_badge', 'Đang nhận học viên mới'],
      ['hero_title1', 'Khơi nguồn tư duy'],
      ['hero_title2', 'Bứt phá điểm số'],
      ['hero_desc', 'Lớp Ngữ Văn THCS với phương pháp giảng dạy hiện đại, giúp học sinh hiểu sâu, nhớ lâu và đạt kết quả cao trong kỳ thi.'],
      ['hero_stat1_value', '10+'],
      ['hero_stat1_label', 'Năm kinh nghiệm'],
      ['hero_stat2_value', '500+'],
      ['hero_stat2_label', 'Học sinh'],
      ['hero_stat3_value', '4.9/5'],
      ['hero_stat3_label', 'Đánh giá'],
      ['teacher_name', 'Thầy/Cô [Tên]'],
      ['teacher_label', 'Giới thiệu giáo viên'],
      ['teacher_photo', ''],
      ['teacher_photo_alt', 'Giáo viên Ngữ Văn THCS'],
      ['teacher_bio', 'Với hơn 10 năm kinh nghiệm giảng dạy Ngữ Văn THCS, đã hỗ trợ hàng trăm học sinh đạt điểm 9-10 trong các kỳ thi quan trọng.'],
      ['satisfaction_value', '98%'],
      ['satisfaction_label', 'Học sinh hài lòng'],
      ['courses_section_title', 'Chọn lớp phù hợp'],
      ['courses_section_desc', 'Tất cả các khung chương trình Ngữ Văn THCS từ Lớp 6 đến Lớp 9'],
      ['schedule_section_title', 'Lịch học tuần này'],
      ['schedule_section_desc', 'Cập nhật liên tục, đảm bảo học viên nắm rõ lịch trình'],
      ['form_section_title', 'Đăng ký ngay hôm nay'],
      ['form_section_desc', 'Điền thông tin bên dưới, chúng tôi sẽ liên hệ trong 24h'],
      ['footer_brand', 'Ngữ Văn'],
      ['footer_brand_accent', 'THCS'],
      ['footer_desc', 'Khơi nguồn tư duy, bứt phá điểm số. Lớp học Ngữ Văn THCS chất lượng cao với hơn 10 năm kinh nghiệm.'],
      ['footer_hotline', '0xxx.xxx.xxx'],
      ['footer_address', '[Địa chỉ cụ thể của lớp học]'],
      ['footer_map', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.5!2d106.7!3d10.8!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDAJzQ4JzAwLjAiTiAxMDbKwDQyJzAwLjAiRQ!5e0!3m2!1svi!2s!4v1234567890'],
      ['zalo_url', '#'],
      ['hotline_number', '+84123456789'],
    ];

    for (const [key, value] of defaultSettings) {
      await client.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO NOTHING`,
        [key, value]
      );
    }

    // ─── Seed Courses ───
    const { rows: existingCourses } = await client.query('SELECT COUNT(*) FROM courses');
    if (parseInt(existingCourses[0].count) === 0) {
      const defaultCourses = [
        { name: 'Ngữ Văn Lớp 6', short_name: 'LỚP 6', emoji: '📖', color: 'blue', sub: 'Nền tảng vững chắc', description: 'Xây dựng nền tảng ngữ văn vững chắc cho học sinh lớp 6.', features: ['Phân tích văn bản', 'Luyện viết cảm thụ', 'Ôn tập kiểm tra'], duration: '2h/buổi', max_students: 'Tối đa 12', sessions: '2 buổi/tuần', status: 'available', sort_order: 1 },
        { name: 'Ngữ Văn Lớp 7', short_name: 'LỚP 7', emoji: '✍️', color: 'green', sub: 'Phát triển tư duy', description: 'Phát triển tư duy phản biện và kỹ năng phân tích văn bản.', features: ['Tư duy phản biện', 'Phân tích tác phẩm', 'Luyện viết nghị luận'], duration: '2h/buổi', max_students: 'Tối đa 12', sessions: '2 buổi/tuần', status: 'available', sort_order: 2 },
        { name: 'Ngữ Văn Lớp 8', short_name: 'LỚP 8', emoji: '📚', color: 'purple', sub: 'Chuẩn bị bước nhảy', description: 'Chuẩn bị kiến thức vững vàng cho học sinh lớp 8.', features: ['Văn học dân gian', 'Văn học hiện thực', 'Kỹ năng thi cử'], duration: '2h/buổi', max_students: 'Tối đa 10', sessions: '2 buổi/tuần', status: 'available', sort_order: 3 },
        { name: 'Ngữ Văn Lớp 9', short_name: 'LỚP 9', emoji: '🎯', color: 'orange', sub: 'Ôn thi tốt nghiệp', description: 'Ôn tập toàn diện, luyện đề chuyên sâu cho kỳ thi tốt nghiệp THCS.', features: ['Ôn tập toàn diện', 'Luyện đề chuyên sâu', 'Phương pháp làm bài'], duration: '2.5h/buổi', max_students: 'Tối đa 10', sessions: '3 buổi/tuần', status: 'full', sort_order: 4 },
      ];
      for (const c of defaultCourses) {
        await client.query(
          `INSERT INTO courses (name, short_name, emoji, color, sub, description, features, duration, max_students, sessions, status, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12)`,
          [c.name, c.short_name, c.emoji, c.color, c.sub, c.description, JSON.stringify(c.features), c.duration, c.max_students, c.sessions, c.status, c.sort_order]
        );
      }
    }

    // ─── Seed Schedule ───
    const { rows: existingSchedule } = await client.query('SELECT COUNT(*) FROM schedule');
    if (parseInt(existingSchedule[0].count) === 0) {
      const defaultSchedule = [
        { class_name: 'Lớp 6A', time_slot: '18:00 - 20:00', days: 'Thứ 2, 4, 6', status: 'available', status_text: '🟢 Còn chỗ', sort_order: 1 },
        { class_name: 'Lớp 6B', time_slot: '18:00 - 20:00', days: 'Thứ 3, 5, 7', status: 'available', status_text: '🟢 Còn chỗ', sort_order: 2 },
        { class_name: 'Lớp 7', time_slot: '18:00 - 20:00', days: 'Thứ 2, 4, 6', status: 'almost_full', status_text: '🟡 Sắp đầy', sort_order: 3 },
        { class_name: 'Lớp 8', time_slot: '19:00 - 21:00', days: 'Thứ 3, 5, 7', status: 'available', status_text: '🟢 Còn chỗ', sort_order: 4 },
        { class_name: 'Lớp 9', time_slot: '19:00 - 21:30', days: 'Thứ 2, 4, 6', status: 'full', status_text: '🔴 Đầy', sort_order: 5 },
      ];
      for (const s of defaultSchedule) {
        await client.query(
          `INSERT INTO schedule (class_name, time_slot, days, status, status_text, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [s.class_name, s.time_slot, s.days, s.status, s.status_text, s.sort_order]
        );
      }
    }

    // ─── Seed Approach ───
    const { rows: existingApproach } = await client.query('SELECT COUNT(*) FROM approach');
    if (parseInt(existingApproach[0].count) === 0) {
      const defaultApproach = [
        { title: 'Phương pháp Socratic', description: 'Đặt câu hỏi dẫn dắt để học sinh tự khám phá ý nghĩa văn bản.', sort_order: 1 },
        { title: 'Học qua dự án', description: 'Học sinh thực hành qua các dự án sáng tạo.', sort_order: 2 },
        { title: 'Cá nhân hóa lộ trình', description: 'Mỗi học sinh có lộ trình học tập riêng theo trình độ.', sort_order: 3 },
      ];
      for (const a of defaultApproach) {
        await client.query(
          `INSERT INTO approach (title, description, sort_order) VALUES ($1, $2, $3)`,
          [a.title, a.description, a.sort_order]
        );
      }
    }

    // ─── Seed Why ───
    const { rows: existingWhy } = await client.query('SELECT COUNT(*) FROM why_items');
    if (parseInt(existingWhy[0].count) === 0) {
      const defaultWhy = [
        { icon: '🏆', title: '10+ năm kinh nghiệm', description: 'Đội ngũ giáo viên giàu kinh nghiệm, tận tâm.', sort_order: 1 },
        { icon: '📈', title: '98% học sinh tiến bộ', description: 'Học sinh đạt kết quả cao trong các kỳ thi.', sort_order: 2 },
        { icon: '👨‍👩‍👧', title: 'Phụ huynh tin tưởng', description: 'Cập nhật tiến độ học tập thường xuyên.', sort_order: 3 },
        { icon: '💡', title: 'Phương pháp hiện đại', description: 'Giảng dạy sinh động, gần gũi, dễ hiểu.', sort_order: 4 },
      ];
      for (const w of defaultWhy) {
        await client.query(
          `INSERT INTO why_items (icon, title, description, sort_order) VALUES ($1, $2, $3, $4)`,
          [w.icon, w.title, w.description, w.sort_order]
        );
      }
    }

    // ─── Seed Admin ───
    const { rows: existingAdmins } = await client.query('SELECT COUNT(*) FROM admins');
    if (parseInt(existingAdmins[0].count) === 0) {
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('admin123', 10);
      await client.query(
        `INSERT INTO admins (username, password_hash) VALUES ($1, $2)`,
        ['admin', hash]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Database initialized');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Init DB error:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
