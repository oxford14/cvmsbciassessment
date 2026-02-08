# CVMSBCI Church Assessment System

Next.js application for collecting and managing church assessment forms from member associations of the **Convention in Visayas and Mindanao of Southern Baptist Churches, Inc.** Data is stored in **Supabase**; admin users are stored in a table (not Supabase Auth).

## Features

- **Main page (Assessment Form)** – Public form at `/` for associations to submit church messenger attendance. Share this link with submitters.
- **Batches & associations** – Each submission is stored as a batch with full association and contact details.
- **Admin dashboard** – Protected at `/admin`; table-based login (no Supabase Auth).
- **Consolidated report** – Single view and CSV export of all batches and churches at `/admin/consolidated`.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Admin auth:** Custom (admin users in `admin_users` table, JWT session cookie)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the contents of **`supabase/migrations/001_initial_schema.sql`** to create:
   - `admin_users` – admin login (table-based)
   - `assessment_batches` – one row per form submission (association + contact)
   - `assessment_churches` – church rows per batch
   - `consolidated_report` – view joining batches and churches for reporting
   - RLS policies (public insert for batches/churches; read only via service role)

### 3. Environment variables

Copy `.env.local.example` to `.env.local` and set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_SESSION_SECRET=at-least-32-character-random-secret
```

Get the URL and keys from Supabase: Project Settings → API.

### 4. Create the first admin user

From the project root (with `.env.local` loaded):

```bash
# Option A: env vars
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=yourSecurePassword npm run create-admin

# Option B: arguments (use a script that passes them, or run with node)
# First compile: npx tsc scripts/create-admin.ts --outDir scripts (or use ts-node)
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/create-admin.ts admin@example.com yourSecurePassword
```

Or insert directly in Supabase (SQL or Table Editor) into `admin_users` with a bcrypt hash of the password (e.g. generate hash in Node: `require('bcryptjs').hashSync('yourPassword', 10)`).

### 5. Run the app

```bash
npm run dev
```

- **Assessment form (main page):** http://localhost:3000  
- **Admin login:** http://localhost:3000/admin/login  
- **Admin dashboard:** http://localhost:3000/admin (after login)  
- **Consolidated report:** http://localhost:3000/admin/consolidated  

## Routes

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Church assessment form | Public |
| `/admin/login` | Admin login | Public |
| `/admin` | Dashboard (batches, search, export CSV) | Admin only |
| `/admin/consolidated` | Consolidated report (all data) | Admin only |
| `/api/admin/export-csv` | Download CSV of consolidated data | Admin only (session required) |

## Schema summary

- **assessment_batches** – Association name, region, address, contact person, position, phone, email, submitted_at. One batch = one form submission.
- **assessment_churches** – church_name, ga_2023, ga_2024, ga_2025, remarks; `batch_id` links to a batch.
- **admin_users** – email, password_hash, full_name, is_active (table-based admin, not Supabase Auth).
- **consolidated_report** – View: one row per church with batch and association fields for reporting/export.

## Deployment

1. Set the same env vars in your host (Vercel, etc.).
2. Run the Supabase migration once (e.g. via Supabase SQL Editor or CLI).
3. Create at least one admin user (see above).
4. Use the root URL (e.g. `https://your-app.vercel.app`) as the assessment form link for associations.

## Organization

**Convention in Visayas and Mindanao of Southern Baptist Churches, Inc.**  
Libby Road, Puan, Toril District, Davao City
