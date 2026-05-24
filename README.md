# AIECP Feedback System

A React + Vite feedback application with Supabase backend for collecting and managing AIECP class and program feedback across devices and browsers. Features protected admin dashboard with daily and overall report exports.

Features:
- Collect student name, class topic, rating, comments, and suggestions.
- Capture program feedback on enjoyed features, favorite topics, and cohort expectations.
- Save reviews to Supabase for real-time cross-device access.
- Separate admin dashboard for exports and review management.
- Protect admin access with env-configured email/password and a login route.
- Export daily and overall reports as JSON or CSV for both class and program feedbacks.
- Real-time feedback storage accessible from any device or browser.

Quick start:

```bash
cp .env.example .env
npm install
npm run dev
```

Environment configuration:

Add these to your `.env` file:

```
VITE_ADMIN_EMAIL=your-admin-email@example.com
VITE_ADMIN_PASSWORD=your-strong-password
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Setup Supabase:

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. In the SQL editor, run:

```sql
CREATE TABLE class_reviews (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  student TEXT NOT NULL,
  topic TEXT NOT NULL,
  rating INTEGER,
  comments TEXT NOT NULL,
  suggestions TEXT,
  submitted_at TIMESTAMP NOT NULL
);

CREATE TABLE program_reviews (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  student TEXT NOT NULL,
  favoriteFeatures TEXT NOT NULL,
  favoriteTopic TEXT NOT NULL,
  dreamClass TEXT NOT NULL,
  overallComments TEXT,
  submitted_at TIMESTAMP NOT NULL
);
```

4. Copy your project URL and anon key from Settings > API
5. Paste them into `.env`

Usage:

- Student form: http://localhost:5173/
- Admin login: http://localhost:5173/login
- Admin dashboard: http://localhost:5173/admin

The admin dashboard displays:
- Today's class and program reviews
- All-time class and program reviews
- Daily and overall report exports (JSON/CSV)
- Review counts for each section
- Clear all data option

All feedback is stored in Supabase and accessible across browsers and devices.
