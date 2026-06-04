const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Khởi tạo bảng nếu chưa có
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Bảng settings: lưu nội dung trang chủ
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Bảng courses: lớp học + lịch học
    await client.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL DEFAULT '',
        grade VARCHAR(20) NOT NULL DEFAULT '',
        price VARCHAR(50) NOT NULL DEFAULT '',
        day_of_week VARCHAR(20) NOT NULL DEFAULT '',
        time_slot VARCHAR(50) NOT NULL DEFAULT '',
        status VARCHAR(20) NOT NULL DEFAULT 'available',
        hidden BOOLEAN NOT NULL DEFAULT false,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Bảng registrations: đăng ký từ phụ huynh
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

    // Bảng admins: tài khoản quản trị
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Migration: thêm cột hidden nếu chưa có (DB cũ)
    await client.query(`
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT false;
    `);

    // Seed dữ liệu mặc định cho settings
    const defaultSettings = [
      ['hero_title', 'Lớp Văn Hoàn'],
      ['hero_subtitle', 'Khơi nguồn tư duy — Bứt phá điểm số'],
      ['stat_years', '10+'],
      ['stat_students', '500+'],
      ['stat_rating', '4.9'],
      ['teacher_name', 'Thầy/Nguyễn Văn A'],
      ['teacher_bio', 'Giáo viên có hơn 10 năm kinh nghiệm giảng dạy...'],
    ];

    for (const [key, value] of defaultSettings) {
      await client.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO NOTHING`,
        [key, value]
      );
    }

    // Seed dữ liệu mặc định cho courses
    const defaultCourses = [
      { name: 'Lớp Văn 6', grade: '6', price: '500.000đ/tháng', day_of_week: 'Thứ 2, 4, 6', time_slot: '19:00 - 20:30', status: 'available', sort_order: 1 },
      { name: 'Lớp Văn 7', grade: '7', price: '550.000đ/tháng', day_of_week: 'Thứ 3, 5, 7', time_slot: '19:00 - 20:30', status: 'available', sort_order: 2 },
      { name: 'Lớp Văn 8', grade: '8', price: '600.000đ/tháng', day_of_week: 'Thứ 2, 4, 6', time_slot: '20:30 - 22:00', status: 'available', sort_order: 3 },
      { name: 'Lớp Văn 9', grade: '9', price: '650.000đ/tháng', day_of_week: 'Thứ 3, 5, 7', time_slot: '20:30 - 22:00', status: 'full', sort_order: 4 },
    ];

    const { rows: existingCourses } = await client.query('SELECT COUNT(*) FROM courses');
    if (parseInt(existingCourses[0].count) === 0) {
      for (const c of defaultCourses) {
        await client.query(
          `INSERT INTO courses (name, grade, price, day_of_week, time_slot, status, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [c.name, c.grade, c.price, c.day_of_week, c.time_slot, c.status, c.sort_order]
        );
      }
    }

    // Seed admin mặc định (password: admin123)
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
