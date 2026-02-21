
# Make the Demo Work End-to-End

## What's Broken

1. **Auth blocks everything** - Dashboard requires login, but sessions aren't persisting in the preview. The ProtectedRoute redirects to /auth every time.
2. **Scraping limited to 30 products** - The edge function caps at 30 URLs (`slice(0, 30)`), but you want ALL products scraped.
3. **Wizard Step 3 blocks on auth** - StepCrawl won't run without a logged-in user.
4. **No visual feedback of logged-in state** - No profile indicator or persistent session awareness on the landing page.

## The Plan

### 1. Remove auth gate for the demo flow

Make the wizard work without requiring login. The scraping edge function still needs auth (for DB writes), so we'll handle this by:

- **Remove the `ProtectedRoute` wrapper** from the dashboard route -- make it publicly accessible
- **In DashboardContext**, if no user is present, work with local state only (no DB reads/writes) -- the seedDemoProducts function will just load mockProducts into React state without touching the DB
- **In StepCrawl**, remove the auth gate entirely -- if the user is logged in, scrape and save to DB; if not, simulate a scan using demo data

### 2. Scrape ALL products (remove the 30-page cap)

Update the `scrape-products` edge function:
- Increase the URL limit from 30 to **all discovered product URLs** (up to the Firecrawl map limit of 200)
- Remove the restrictive URL filter that only matches `/product|item|shop|collecti|p\//` -- instead, scrape all discovered URLs and let the AI decide what's a product
- This ensures small stores get complete coverage

### 3. Add logged-in state awareness to landing page

- In the **Navbar**, show the user's email/avatar when logged in, with a "Dashboard" link and "Sign out" option
- In the **wizard StepCrawl**, show "Signed in as [email]" instead of the auth gate when logged in

### 4. Make dashboard work without auth (demo mode)

- When no user session exists, the dashboard loads **demo products from mockProducts** directly into state
- All dashboard features (boost sliders, rules, preview JSON, etc.) work on this local data
- A subtle banner says "Demo mode -- sign in to save your data"
- The "Load demo data" button works regardless of auth state

## Files to Modify

- **`src/App.tsx`** -- Remove ProtectedRoute from /dashboard, keep it optional
- **`src/context/DashboardContext.tsx`** -- Support "demo mode" when no user: load mockProducts into state, skip DB calls
- **`src/components/landing/steps/StepCrawl.tsx`** -- Remove auth gate; if no user, simulate scan with demo data
- **`src/pages/Dashboard.tsx`** -- Add "demo mode" banner when not authenticated
- **`src/components/landing/Navbar.tsx`** -- Show logged-in state (email, dashboard link)
- **`supabase/functions/scrape-products/index.ts`** -- Remove the 30-product cap, scrape all discovered URLs

## Technical Details

### DashboardContext demo mode
When `user` is null, instead of returning empty state and waiting:
- Set `loading = false` immediately
- Load `mockProducts` into `products` state
- `seedDemoProducts` just sets state directly (no DB)
- `saveProducts`/`saveRules` show a toast saying "Sign in to save"

### StepCrawl without auth
When no user is logged in:
- Run a simulated scan (progress through stages with timers)
- Load mockProducts as the "result" (show counts from mock data)
- Skip the actual edge function call
- User can still proceed to Step 4

### Edge function: remove product cap
Change `slice(0, 30)` to scrape all URLs (up to 200 from the map). Process in larger AI batches.

### Navbar auth state
Use `useAuth()` to check if user is logged in. Show email chip + "Dashboard" button instead of "Start demo" when authenticated.
