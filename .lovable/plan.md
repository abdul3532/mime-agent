

# Rework: Products belong to Storefronts, not Users

## Problem

Currently, products are linked to users via `user_id`. There is no `storefronts` table -- storefront identity is spread across `profiles` (store_id, store_name, domain) and `storefront_files`. When a crawl runs, products are inserted with only `user_id`, making it impossible to have multiple storefronts or to cleanly scope products to a specific storefront.

## New Data Model

```text
profiles (unchanged, keeps user settings)
    |
    | user_id
    v
storefronts (NEW table)
    - id (uuid, PK)
    - user_id (uuid, NOT NULL)
    - store_id (text, unique public slug)
    - store_name (text)
    - store_url (text)
    - domain (text)
    - store_logo_url (text)
    - created_at, updated_at
    |
    | storefront_id (FK)
    v
products (add storefront_id column)
    - storefront_id (uuid, FK -> storefronts.id)
    - user_id (uuid, kept for RLS but optional for queries)
    
storefront_files (change to reference storefronts.id)
    - storefront_id (uuid, FK -> storefronts.id)
    
rules (add storefront_id column)
    - storefront_id (uuid, FK -> storefronts.id)

scrape_progress (add storefront_id column)
    - storefront_id (uuid, FK -> storefronts.id)
```

## Step-by-step Plan

### 1. Database Migration

Create a `storefronts` table and add `storefront_id` columns:

- **Create `storefronts` table** with columns: `id`, `user_id`, `store_id` (unique), `store_name`, `store_url`, `domain`, `store_logo_url`, `created_at`, `updated_at`
- **Add `storefront_id` (nullable initially)** to `products`, `rules`, `scrape_progress`, `storefront_files`
- **Add foreign keys** from those tables to `storefronts.id`
- **Migrate existing data**: create storefront rows from `profiles` where `store_id` is set, then backfill `storefront_id` on existing products/rules/etc.
- **RLS policies** on `storefronts`: users can CRUD their own rows (via `user_id = auth.uid()`)
- **Update RLS** on products/rules to also allow access via storefront ownership

### 2. Update `scrape-products` Edge Function

- Accept `storefront_id` (or create a new storefront) at the start of the crawl
- The flow becomes: **create/find storefront first** -> insert products with `storefront_id`
- Remove domain-based scoping of product deletion; instead delete by `storefront_id`
- Pass `storefront_id` to `generate-llms-txt`

### 3. Update `generate-llms-txt` Edge Function

- Accept `storefront_id` parameter
- Load products by `storefront_id` instead of `user_id`
- Load storefront metadata from `storefronts` table instead of `profiles`
- Upsert `storefront_files` with `storefront_id`

### 4. Update `serve-agent-json` Edge Function

- Look up `store_id` in `storefronts` table (not `profiles`)
- Fetch products by `storefront_id` (not `user_id`)
- Load rules by `storefront_id` (or `user_id` as fallback)

### 5. Update `serve-llms-txt` Edge Function

- Look up `store_id` in `storefronts` table
- Fetch `storefront_files` by `storefront_id`

### 6. Update Frontend: StepCrawl

- Before starting the crawl, create a storefront record (or find existing one by URL)
- Pass `storefront_id` to the `scrape-products` function
- Remove the profile update logic (store_id/domain on profiles)

### 7. Update Frontend: DashboardContext

- Load products scoped to the active storefront (by `storefront_id`)
- The dashboard needs to know which storefront is active (from localStorage or URL param)
- `reloadProducts`, `saveProducts`, `saveRules`, `deleteStoreData` all use `storefront_id`

### 8. Update Frontend: Dashboard page

- Load storefront metadata from `storefronts` table instead of localStorage
- Pass `storefront_id` to `PreviewSection`, `PublishSection`
- Re-scan uses `storefront_id`

### 9. Update remaining components

- `PreviewSection`, `PublishSection`: use `storefront_id` for endpoint URLs
- `ProductsSection`, `RulesSection`: no changes needed (they read from context)

## Technical Details

### Migration SQL (key parts)

```text
CREATE TABLE storefronts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  store_id text UNIQUE NOT NULL,
  store_name text,
  store_url text,
  domain text,
  store_logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ADD COLUMN storefront_id uuid REFERENCES storefronts(id);
ALTER TABLE rules ADD COLUMN storefront_id uuid REFERENCES storefronts(id);
ALTER TABLE scrape_progress ADD COLUMN storefront_id uuid REFERENCES storefronts(id);
ALTER TABLE storefront_files ADD COLUMN storefront_id uuid REFERENCES storefronts(id);

-- Migrate existing data from profiles
INSERT INTO storefronts (user_id, store_id, store_name, store_url, domain, store_logo_url)
SELECT user_id, store_id, store_name, store_url, domain, store_logo_url
FROM profiles WHERE store_id IS NOT NULL;

-- Backfill storefront_id on products
UPDATE products SET storefront_id = s.id
FROM storefronts s WHERE s.user_id = products.user_id;

-- RLS on storefronts
ALTER TABLE storefronts ENABLE ROW LEVEL SECURITY;
-- SELECT/INSERT/UPDATE/DELETE policies where auth.uid() = user_id
```

### Crawl Flow (new)

```text
1. User enters URL in wizard
2. StepCrawl creates storefront row (or finds existing by domain)
3. Calls scrape-products with { url, runId, storefrontId }
4. scrape-products inserts products with storefront_id + user_id
5. scrape-products calls generate-llms-txt with { storefrontId }
6. Storefront is fully populated
```

### Files to modify

- 1 new migration SQL
- `supabase/functions/scrape-products/index.ts`
- `supabase/functions/generate-llms-txt/index.ts`
- `supabase/functions/serve-agent-json/index.ts`
- `supabase/functions/serve-llms-txt/index.ts`
- `src/components/landing/steps/StepCrawl.tsx`
- `src/context/DashboardContext.tsx`
- `src/pages/Dashboard.tsx`
- `src/components/dashboard/PreviewSection.tsx`
- `src/components/dashboard/PublishSection.tsx`
- `src/lib/api/scrapeProducts.ts`

