# Static vs Full-Stack Analysis

**Date:** 2025-10-25
**Purpose:** Identify unnecessary files/dependencies for GitHub Pages static deployment

---

## Current Architecture

Your app is **HYBRID** - it has both server-side and client-side code:

```
App Structure:
├── client/ (src/)        ← React app (runs in browser)
├── server/               ← Express API (needs Node.js server)
├── database.db           ← SQLite database (needs server)
└── package.json          ← Has BOTH client + server dependencies
```

---

## Deployment Method: GitHub Pages

**GitHub Pages = Static Files Only**
- ✅ Serves HTML, CSS, JS, images
- ❌ Cannot run Node.js server
- ❌ Cannot access databases
- ❌ Cannot handle API requests

**Result:** Server code will not work on GitHub Pages!

---

## Critical Issue: API Calls That Will Fail

### ❌ **API Endpoints That Won't Work on GitHub Pages:**

1. **`/api/scenarios`** (home.tsx:399, 427)
   - Tries to save/load user scenarios to database
   - Will fail with 404 on GitHub Pages

2. **`/api/pension-plans`** (home.tsx:407)
   - Tries to save pension plan data
   - Will fail with 404 on GitHub Pages

3. **`/api/info-content`** (DynamicInfoBox.tsx:66)
   - Tries to fetch dynamic content from server
   - Will fail with 404 on GitHub Pages

4. **`/api/pension-plans/:id/update-values`** (use-realtime-updates.ts:41)
   - Tries to update saved plans
   - Will fail with 404 on GitHub Pages

5. **`/api/calculate-instant`** (use-realtime-updates.ts:50)
   - Tries to calculate on server
   - Will fail with 404 on GitHub Pages

### ✅ **Only This Works:**

- **`/api/simulate`** - Has client-side fallback (queryClient.ts:16-49)
  - Will automatically use client-side calculations when server unavailable

---

## Unnecessary Files for Static GitHub Pages

### 🗑️ **Server Files (36KB) - NOT NEEDED:**
```
server/
├── index.ts              ← Express server startup
├── routes.ts             ← API endpoints (won't work)
├── db.ts                 ← Database connection
├── storage.ts            ← Database queries
├── vite.ts               ← Dev server setup
└── services/             ← Server-side calculations
```

### 🗑️ **Database (32KB) - NOT NEEDED:**
```
database.db               ← SQLite database (can't access on GitHub Pages)
```

### 🗑️ **Server Dependencies in package.json - NOT NEEDED:**

**Runtime Dependencies (unnecessary for static site):**
```json
{
  "express": "^4.21.2",                    ← Web server framework
  "express-session": "^1.18.1",            ← Session management
  "passport": "^0.7.0",                    ← Authentication
  "passport-local": "^1.0.0",              ← Local auth strategy
  "connect-pg-simple": "^10.0.0",          ← PostgreSQL session store
  "memorystore": "^1.6.7",                 ← In-memory session store
  "ws": "^8.18.0",                         ← WebSocket server
  "@neondatabase/serverless": "^0.10.4",   ← Neon database client
  "postgres": "^3.4.7",                    ← PostgreSQL client
  "drizzle-orm": "^0.39.3",                ← Database ORM
  "drizzle-zod": "^0.7.0",                 ← Database schema validation
  "dotenv": "^17.2.2"                      ← Server environment variables (client uses import.meta.env)
}
```

**Dev Dependencies (unnecessary for static site):**
```json
{
  "@types/better-sqlite3": "^7.6.13",
  "@types/express": "4.17.21",
  "@types/express-session": "^1.18.0",
  "@types/passport": "^1.0.16",
  "@types/passport-local": "^1.0.38",
  "@types/connect-pg-simple": "^7.0.3",
  "@types/ws": "^8.5.13",
  "drizzle-kit": "^0.30.4",
  "tsx": "^4.19.1"                         ← TypeScript executor (for server)
}
```

**Total:** ~15 unnecessary dependencies

### 🗑️ **Build Scripts - PARTIALLY UNNECESSARY:**

```json
{
  "dev": "tsx server/index.ts",            ← Runs server (not needed for GitHub Pages)
  "build": "vite build && esbuild server/index.ts...",  ← Builds server (unnecessary)
  "start": "node dist/index.js",           ← Runs server in production (not used)
  "db:push": "drizzle-kit push"            ← Database migrations (not needed)
}
```

**Keep:**
```json
{
  "build:client": "vite build",            ← ✅ Used by GitHub Actions
  "preview": "vite preview",               ← ✅ Useful for local testing
  "check": "tsc",                          ← ✅ Type checking
  "lint": "eslint ."                       ← ✅ Linting
}
```

---

## Size Impact

```
Unnecessary files:     ~68 KB (server + database)
Unnecessary deps:      ~50 MB in node_modules (estimated)
Total savings:         ~50+ MB
```

---

## Two Options for You

### **Option A: Pure Static Site (Recommended for GitHub Pages)**

**What to do:**
1. ✅ Remove server/ folder
2. ✅ Remove database.db
3. ✅ Remove server dependencies from package.json
4. ✅ Update client code to:
   - Remove scenario saving feature (or use localStorage only)
   - Remove API calls that have no fallback
   - Make ALL calculations client-side
5. ✅ Update build scripts to only build client

**Result:**
- ✅ App works 100% on GitHub Pages
- ✅ No broken API calls
- ✅ Faster builds
- ✅ Smaller codebase

**Cons:**
- ❌ Can't save scenarios to database
- ❌ No user accounts/authentication
- ❌ All data stored in browser (localStorage)

---

### **Option B: Full-Stack App (Need Different Hosting)**

**What to do:**
1. ❌ Don't remove server code
2. ✅ Deploy to platform that supports Node.js servers:
   - **Vercel** (serverless functions)
   - **Netlify** (serverless functions)
   - **Railway** (full server)
   - **Render** (full server)
   - **Replit** (full server)
3. ✅ Keep using GitHub for code
4. ✅ Connect hosting platform to GitHub repo

**Result:**
- ✅ Full feature set works
- ✅ Save scenarios to database
- ✅ User authentication possible
- ✅ Server-side calculations

**Cons:**
- ❌ Need to pay for hosting (or use free tier with limits)
- ❌ More complex deployment
- ❌ Need to manage database

---

## Recommendation

Based on your request to **remove Vercel config**, I assume you want **Option A (Static Site)**.

### Immediate Next Steps:

**Critical Issues to Fix First:**
1. **Fix broken API calls** - They will show errors in browser console
2. **Remove scenario saving** - Or implement with localStorage
3. **Remove DynamicInfoBox API calls** - Or hardcode the content

**Then Clean Up:**
4. Remove server folder
5. Remove server dependencies
6. Update package.json scripts

Would you like me to:
- **A)** Convert the app to pure static (remove all server code)?
- **B)** Keep server code but fix deployment setup?
- **C)** Just document what's unnecessary but don't remove anything yet?

---

## Current Status

✅ **Working on GitHub Pages:**
- Main calculator (uses client-side fallback)
- Onboarding flow
- Charts and visualizations
- PDF generation

❌ **Broken on GitHub Pages:**
- Scenario saving to database
- Loading saved scenarios
- Dynamic info content
- Plan updates via API

---

## Technical Details

### Current Build Process (GitHub Actions):
```yaml
build: npm run build:client    # Only builds React app
output: dist/                  # Static files
deploy: GitHub Pages           # Static hosting only
```

### Server Code (Ignored in Production):
```typescript
// server/index.ts - This file never runs on GitHub Pages!
const app = express();
app.listen(5000);  // ← Never executes
```

### Client Fallback (Works!):
```typescript
// src/lib/queryClient.ts
if (url === '/api/simulate') {
  try {
    return await fetch(url);  // Try server
  } catch {
    return calculateClient();  // Fallback to client
  }
}
```

---

**Bottom Line:** You're deploying a full-stack app to a static-only host. The server code is dead weight.
