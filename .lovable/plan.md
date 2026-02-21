

# Web Scraping Pipeline for Product Import

## Overview
Build a real web scraping system that takes a store URL, crawls it for product pages, extracts structured product data using AI, and populates the database. This replaces the current fake animation in StepCrawl and the no-op Re-scan button.

## Architecture

```text
User enters URL
      |
      v
Frontend calls edge function "scrape-products"
      |
      v
Edge function: Firecrawl MAP (discover product URLs)
      |
      v
Edge function: Firecrawl SCRAPE top N product pages (markdown)
      |
      v
Edge function: Lovable AI (Gemini Flash) extracts structured product JSON
      |
      v
Edge function: INSERT products into DB, return summary
      |
      v
Frontend updates dashboard with real products
```

## Steps

### 1. Connect Firecrawl
Link the existing Firecrawl connection (already in workspace) to this project so the `FIRECRAWL_API_KEY` secret is available in edge functions.

### 2. Create `scrape-products` Edge Function
A single edge function at `supabase/functions/scrape-products/index.ts` that:

- Accepts `{ url: string, user_id: string }` (auth required via JWT)
- **Step 1 - Map**: Calls Firecrawl `/v1/map` with `search: "product"` to discover product page URLs (limit 50)
- **Step 2 - Scrape**: Batch-scrapes the top 30 product URLs using Firecrawl `/v1/scrape` with `formats: ['markdown']` and `onlyMainContent: true`
- **Step 3 - Extract**: Sends each page's markdown to Lovable AI (Gemini 2.5 Flash) with a prompt to extract structured product data: title, price, currency, category, availability, image URL, tags, inventory estimate
- **Step 4 - Persist**: Deletes existing products for the user, then bulk-inserts the extracted products into the `products` table
- Returns `{ success: true, products_found: N, categories: [...], pages_scanned: N }`

Config in `supabase/config.toml`:
```toml
[functions.scrape-products]
verify_jwt = false
```

### 3. Create `src/lib/api/scrapeProducts.ts`
A thin client helper that calls the edge function via `supabase.functions.invoke('scrape-products', { body: { url } })` and returns the result.

### 4. Update `StepCrawl` Component
Replace the fake timer animation with a real API call:
- On mount, call the scrape edge function with `storeUrl`
- Stream progress updates via polling or staged callbacks (map -> scrape -> extract -> done)
- Show real counters (pages scanned, products found, categories) from the API response
- On completion, the user's dashboard will have real products

### 5. Update Dashboard Re-scan Button
Wire the "Re-scan" button in `Dashboard.tsx` to call the same scrape function, then reload products from the database via the DashboardContext.

### 6. Update `DashboardContext` to Reload After Scrape
Add a `reloadProducts()` function that re-fetches products from the database, so the dashboard reflects newly scraped data.

## Technical Details

- **Firecrawl** is used for URL discovery (map) and content extraction (scrape). No need to build a custom crawler.
- **Lovable AI** (Gemini 2.5 Flash) handles the unstructured-to-structured conversion -- parsing markdown product pages into typed JSON. This requires no API key from the user.
- The edge function authenticates the user via the Authorization header and uses `auth.uid()` to scope products.
- Products are upserted per-user -- a re-scan replaces existing products for that user.
- Rate limiting is handled naturally by processing pages sequentially in batches.

