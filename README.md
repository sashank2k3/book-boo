# 📖 Book Boo — The Alchemist

A private book club app for two — Harshuu & Sashank. Read together, discuss together.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Backend | FastAPI (Python) |
| Database | Supabase (PostgreSQL) |
| Real-time | Supabase Realtime |
| Storage | Supabase Storage (PDF) |
| Hosting | Vercel (both frontend + API) |

---

## Setup (Step by step)

### 1. Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In **SQL Editor**, run `supabase/schema.sql` (copy-paste the entire file)
3. In **Authentication > Users**, create two users:
   - Email: `harshuu@bookboo.app` — set a password
   - Email: `sashank@bookboo.app` — set a password
4. In **Storage**, you'll see the `books` bucket was created by the SQL script
5. In **Database > Replication**, enable realtime for the `threads` and `replies` tables
6. Copy your **Project URL** and **anon key** from Settings > API

### 2. Upload the PDF

Option A — via Supabase dashboard:
- Go to Storage > books bucket
- Upload your PDF and rename it to `the-alchemist.pdf`

Option B — via the API endpoint (local only):
```bash
curl -X POST http://localhost:8000/api/upload-pdf \
  -F "file=@/path/to/the-alchemist.pdf"
```

### 3. Frontend env file

Create `frontend/.env` (copy from `.env.example`):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run locally

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Backend:**
```bash
pip install -r requirements.txt
uvicorn api.index:app --reload --port 8000
```

### 5. Deploy to Vercel

1. Push this repo to GitHub
2. Import the project in [vercel.com](https://vercel.com)
3. Set the following **Environment Variables** in Vercel project settings:
   - `SUPABASE_URL` — your Supabase project URL
   - `SUPABASE_SERVICE_KEY` — your Supabase **service role** key (from Settings > API)
   - `ALLOWED_ORIGINS` — your Vercel app URL (e.g. `https://book-boo.vercel.app`)
4. Also set in Vercel for the frontend build:
   - `VITE_SUPABASE_URL` — same Supabase URL
   - `VITE_SUPABASE_ANON_KEY` — the anon key (NOT the service key)
5. Deploy!

---

## How to use the app

1. Open the app URL
2. Tap your name (Harshuu or Sashank)
3. Enter your password — your session is saved, won't need to login again
4. Tap **Continue Reading** to open the book
5. **To comment on selected text:** select any text → tap "💬 Comment on selection"
6. **To comment on the whole page:** tap "✏️ Note" in the bottom bar
7. **To see discussions:** tap 💬 in the top right, or go to "All Discussions" from the home screen
8. Reply to each other in threads — messages update in real-time

---

## Project Structure

```
book-boo/
├── frontend/           React app
│   ├── src/
│   │   ├── pages/      LoginPage, HomePage, ReaderPage, ThreadsPage
│   │   ├── components/ ThreadPanel, NewThreadModal
│   │   ├── hooks/      useAuth, useDiscussions
│   │   └── lib/        supabase.js, constants.js
│   └── package.json
├── api/
│   └── index.py        FastAPI backend
├── supabase/
│   └── schema.sql      Database schema
├── requirements.txt    Python dependencies
├── vercel.json         Vercel deployment config
└── README.md
```
