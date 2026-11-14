# AIVORA — Backend Server

Production-ready Node.js, Express, and MongoDB backend for the **AIVORA** AI Education Platform.

## Features
- **Authentication & Authorization**: JWT + HTTP-Only cookies, bcrypt password hashing, email verification, password reset, and role-based access control (`student` & `admin`).
- **Course & Curriculum Engine**: Full CRUD for Courses, Categories, Modules, Lessons, and downloadable resources with protected video URL redaction for non-enrolled users.
- **Secure Payments**: Paystack & Flutterwave integration with backend verification and HMAC-SHA512 webhook verification (`POST /api/v1/payments/webhook/paystack`).
- **Admin CMS & Analytics**: Complete dashboard stats, 12-month revenue/enrollment charts, student management, manual access grant/revoke with `AdminActivityLog` audit trails, review moderation, support tickets, coupons, and dynamic site settings.
- **Transactional Emails**: Branded HTML emails via Nodemailer (`src/services/email.service.js`).
- **Media Storage**: Cloudinary image & video upload pipelines.

## Setup Instructions

1. **Install dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Configure environment variables**
   Copy `.env.example` to `.env` and fill in your MongoDB Atlas URI, JWT secret, Paystack keys, Cloudinary credentials, and SMTP credentials:
   ```bash
   cp .env.example .env
   ```

3. **Seed initial administrator & demonstration content**
   ```bash
   npm run seed
   ```

4. **Start the server**
   - Development: `npm run dev`
   - Production: `npm start`

## Key Endpoints
- `GET /health` — Health check
- `POST /api/v1/auth/register` / `POST /api/v1/auth/login` / `GET /api/v1/auth/me`
- `GET /api/v1/courses` / `GET /api/v1/courses/featured` / `GET /api/v1/courses/:slug`
- `POST /api/v1/payments/initialize` / `GET /api/v1/payments/verify/:ref` / `POST /api/v1/payments/webhook/paystack`
- `GET /api/v1/enrollments/my` / `PATCH /api/v1/enrollments/progress`
- `GET /api/v1/certificates/my` / `POST /api/v1/certificates/generate/:courseId` / `GET /api/v1/certificates/verify/:certificateId`
- `GET /api/v1/admin/stats` (and full `/api/v1/admin/*` management suite)
