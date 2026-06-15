# Lop Van Hoan — Landing Page + Admin CMS

Vietnamese tutoring class website built with **Node.js + Express + PostgreSQL**. Features a public landing page and an admin dashboard for managing courses, schedules, and registrations.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Frontend | HTML, CSS (Tailwind CDN), Vanilla JS |
| Auth | JWT + bcrypt |
| File Upload | Multer (disk storage, 2MB limit) |
| Security | express-rate-limit, XSS sanitization |

## Features

- **Public Landing Page** — Hero, courses, schedule, teacher info, registration form, footer
- **Admin Dashboard** — 8 tabs: Content, General, Titles, Teacher, Courses, Schedule, Registrations, Password
- **Course Management** — CRUD with sort order, visibility toggle, status (available/almost_full/full)
- **Schedule Management** — Linked to courses, with time slots and availability status
- **Registration System** — Parent/student signup with phone validation
- **Content Editing** — Live-editable site content via admin panel
- **Title Styles** — Customizable heading styles (color, size, weight)
- **File Upload** — Drag & drop image upload (logo, teacher photo) via Multer
- **Password Change** — With strength meter, requirements checklist, auto-redirect

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Installation

```bash
# Clone the repository
git clone https://github.com/quangpt21088/fcc-claudecode.git
cd fcc-claudecode

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database URL and JWT_SECRET

# Start the server
npm start
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | Yes |
| `PORT` | Server port (default: 3000) | No |
| `NODE_ENV` | `development` or `production` | No |
| `DEBUG` | Set to `true` to enable debug logging | No |

### Default Admin Credentials

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

> **Important:** Change the default password after first login!

## API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/content` | Get all landing page content |
| POST | `/api/register` | Submit registration |

### Admin (requires Bearer token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/settings` | Get all settings |
| PUT | `/api/admin/content` | Update site content |
| GET | `/api/admin/courses` | List all courses |
| POST | `/api/admin/courses` | Create course |
| PUT | `/api/admin/courses/:id` | Update course |
| DELETE | `/api/admin/courses/:id` | Delete course |
| GET | `/api/admin/schedule` | List all schedule |
| POST | `/api/admin/schedule` | Create schedule entry |
| PUT | `/api/admin/schedule/:id` | Update schedule entry |
| DELETE | `/api/admin/schedule/:id` | Delete schedule entry |
| GET | `/api/admin/approach` | List approach items |
| PUT | `/api/admin/approach` | Update approach items |
| GET | `/api/admin/why` | List why items |
| PUT | `/api/admin/why` | Update why items |
| GET | `/api/admin/title-styles` | Get title styles |
| PUT | `/api/admin/title-styles` | Save title styles |
| GET | `/api/admin/registrations` | List registrations |
| PUT | `/api/admin/registrations/:id` | Update registration status |
| POST | `/api/admin/upload` | Upload image file (multipart, 2MB max) |
| POST | `/api/admin/change-password` | Change admin password |

## Project Structure

```
fcc-claudecode/
├── server.js              # Main server — all API endpoints
├── database.js            # PostgreSQL pool, tables, migrations, seeds
├── package.json           # Dependencies
├── .env                   # Environment variables (not in git)
├── .env.example           # Example environment file
├── public/
│   ├── index.html         # Landing page (inline JS)
│   ├── admin/
│   │   ├── login.html     # Admin login page (dark glass)
│   │   ├── dashboard.html # Admin dashboard (sidebar + dark)
│   │   └── admin.js       # Admin logic (upload, pwd strength)
│   └── uploads/           # Uploaded images (Multer)
└── review-note.md         # Bug review notes
```

## Security Features

- XSS sanitization on all user inputs
- Parameterized SQL queries (prevents SQL injection)
- JWT authentication with 24h expiry
- Rate limiting (100 req/15min API, 10 req/15min login)
- Password hashing with bcrypt (10 rounds)
- Input length validation
- Numeric ID validation on all routes

## License

MIT
