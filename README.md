# AIVORA — AI Creative Education & Course Platform

**AIVORA** is an international, full-stack AI creative education and course marketplace platform designed to teach creators, filmmakers, and digital entrepreneurs how to master modern AI tools—including **AI Video Creation**, **Consent-Based AI Character Transformation & Digital Avatars**, **AI Voice Cloning & Narration**, **Image-to-Video Animation**, **AI Short Film Production**, and **Social Media AI Growth**.

---

## 1. Platform Architecture

AIVORA is architected as a decoupled full-stack JavaScript monorepo:

```text
Aivora/
├── client/                     # React 18 + Vite 5 + Tailwind CSS 3 Frontend (SPA)
│   ├── public/                 # Static assets, robots.txt, sitemap.xml
│   ├── src/
│   │   ├── api/                # Axios instance & typed service wrappers
│   │   ├── components/         # Reusable UI primitives, Navigation, Course cards, Modals
│   │   ├── hooks/              # Custom hooks (scroll management, debounce, etc.)
│   │   ├── layouts/            # MainLayout, DashboardLayout, AdminLayout
│   │   ├── pages/              # Public, Auth, Student Dashboard, Legal, and Admin pages
│   │   ├── store/              # Zustand state stores (Auth, Cart/Wishlist, Theme)
│   │   └── utils/              # Formatting, validation, and helper utilities
│   └── vercel.json             # Vercel SPA routing & security headers configuration
├── server/                     # Node.js + Express + MongoDB (Mongoose 8) REST API
│   ├── src/
│   │   ├── config/             # MongoDB & Cloudinary connection modules
│   │   ├── controllers/        # Route handlers (Auth, Courses, Payments, Progress, Admin)
│   │   ├── middleware/         # JWT Auth, RBAC, Multer uploads, Validation, Error handling
│   │   ├── models/             # 11 Mongoose schemas (User, Course, Module, Lesson, Order, etc.)
│   │   ├── routes/             # Modular Express v1 routers (/api/v1/*)
│   │   └── utils/              # Email sender, Paystack client, Certificate generator, Seed script
│   └── .env.example            # Server environment variable template
└── render.yaml                 # Render Blueprint for automated backend deployment
```

### Core Tech Stack
- **Frontend**: React 18, Vite 5, Tailwind CSS 3, Framer Motion, Zustand, TanStack React Query, React Hook Form + Zod, Lucide Icons, React Player, React Helmet Async.
- **Backend**: Node.js (ESM), Express 4, MongoDB Atlas + Mongoose 8, JWT Authentication, Bcryptjs, Express Validator, Helmet, Express Rate Limit, Mongo Sanitize, XSS Clean.
- **Integrations**:
  - **Paystack**: Checkout initialization, transaction verification, and cryptographic HMAC-SHA512 webhook fulfillment.
  - **Cloudinary**: Cloud storage and CDN delivery for course thumbnails, preview videos, lesson videos, avatars, and PDF resources.
  - **Nodemailer (SMTP)**: Transactional emails for account verification, password resets, order receipts, and support tickets.

---

## 2. Environment Variables

### Backend (`server/.env`)

Copy `server/.env.example` to `server/.env` and configure the following values:

```ini
# Server
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/aivora

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES=7

# Cloudinary Media Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Transactional Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@aivora.com
EMAIL_FROM_NAME=AIVORA

# Paystack Payment Gateway
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_WEBHOOK_SECRET=your_paystack_webhook_secret

# Default Admin Credentials (used by npm run seed)
ADMIN_EMAIL=admin@aivora.com
ADMIN_DEFAULT_PASSWORD=ChangeThisStrongPassword123!
```

### Frontend (`client/.env`)

Copy `client/.env.example` to `client/.env`:

```ini
VITE_API_URL=http://localhost:5000/api/v1
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
VITE_APP_NAME=AIVORA
VITE_APP_URL=http://localhost:5173
```

---

## 3. Local Development Setup

### Prerequisites
- **Node.js** v18.18+ or v20+ LTS
- **MongoDB** (Local instance or MongoDB Atlas cluster)

### Step 1: Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 2: Seed the Database (Admin User, Categories, Flagship Courses & Site Settings)

From the `server` directory, run the database seed script:

```bash
cd server
npm run seed
```

This idempotent script populates:
- **Default Admin Account** (`admin@aivora.com` / password from `ADMIN_DEFAULT_PASSWORD`)
- **7 AI Learning Categories** (AI Video Creation, AI Character Transformation, AI Voice Cloning, Image to Video, AI Talking Avatars, AI Short Film Production, AI Content Creation)
- **6 Flagship Courses** complete with structured modules, video lessons, outcomes, and downloadable resources
- **Default Site Settings & Promotional Coupons** (`WELCOME20`, `AICREATOR50`)

### Step 3: Start Development Servers

Run the backend and frontend in two separate terminals:

```bash
# Terminal 1 — Backend API (http://localhost:5000)
cd server
npm run dev
```

```bash
# Terminal 2 — Vite React Client (http://localhost:5173)
cd client
npm run dev
```

---

## 4. Paystack Payment & Webhook Configuration

AIVORA supports both instant redirect verification and asynchronous webhook fulfillment via Paystack:

1. Log in to your [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developers).
2. Copy your **Public Key** (`pk_test_...` or `pk_live_...`) and **Secret Key** (`sk_test_...` or `sk_live_...`) into `server/.env` and `client/.env`.
3. Set your **Callback URL** in Paystack Dashboard (or rely on the dynamic callback sent by the API):
   - Local: `http://localhost:5173/dashboard/purchases`
   - Production: `https://your-domain.com/dashboard/purchases`
4. Configure your **Webhook URL** in Paystack Dashboard:
   - Production Webhook Endpoint: `https://your-api-domain.onrender.com/api/v1/payments/webhook`
5. The backend verifies `x-paystack-signature` using HMAC-SHA512 (`PAYSTACK_WEBHOOK_SECRET` or `PAYSTACK_SECRET_KEY`) and automatically provisions course enrollments, updates order status, and sends a receipt email upon `charge.success`.

---

## 5. Production Deployment (Render + Vercel)

### Deploying the Backend API to Render
1. Push this repository to GitHub/GitLab.
2. In the [Render Dashboard](https://dashboard.render.com/), click **New +** → **Blueprint** and select your repository.
3. Render will automatically detect `render.yaml` at the root of the project (`rootDir: server`, `buildCommand: npm install`, `startCommand: npm start`, `healthCheckPath: /health`).
4. Fill in the prompted secret environment variables (`MONGODB_URI`, `CLIENT_URL`, `CLOUDINARY_*`, `PAYSTACK_*`, `SMTP_*`, `ADMIN_DEFAULT_PASSWORD`).
5. Once deployed, verify the health check at `https://<your-render-service>.onrender.com/health`.

### Deploying the Frontend SPA to Vercel
1. In the [Vercel Dashboard](https://vercel.com/new), import your Git repository.
2. Set the **Root Directory** to `client`.
3. Framework Preset: **Vite** (`npm run build`, output directory `dist`).
4. Add the production Environment Variables:
   - `VITE_API_URL=https://<your-render-service>.onrender.com/api/v1`
   - `VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxx`
   - `VITE_APP_NAME=AIVORA`
   - `VITE_APP_URL=https://aivora.com`
5. Click **Deploy**. `client/vercel.json` automatically configures SPA rewrites (`/(.*) -> /index.html`) and security headers so all React Router paths (`/courses`, `/dashboard`, `/admin`, `/terms`, `/privacy`, `/refund`, `/disclaimer`) resolve cleanly on refresh.

---

## 6. Ethical AI & Legal Compliance

AIVORA includes dedicated legal and ethical AI policies accessible at:
- `/terms` — Terms of Service & Educational Licensing
- `/privacy` — Privacy Policy & Data Protection
- `/refund` (`/refund-policy`) — 7-Day Satisfaction Guarantee & Refund Policy
- `/disclaimer` — Third-Party AI Software & Likeness/Voice Consent Disclaimer
