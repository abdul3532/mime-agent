

# Implementation Plan

## Overview
Three features: (1) delete store data, (2) comparison view (raw vs optimized), and (3) generate a Semly-style `llms.txt` file describing the website with links to the product JSON feed.

---

## Feature 1: Delete Store Data

Add a "Delete store data" button in the Products tab with a confirmation dialog.

**Changes:**
- **DashboardContext.tsx** -- Add `deleteStoreData()` that deletes from `products`, `rules`, `agent_events`, and `scrape_progress` for the current user, then reloads
- **ProductsSection.tsx** -- Add a red "Delete all products" button (visible when products exist) with an `AlertDialog` confirmation before executing

---

## Feature 2: Comparison View (Raw HTML vs Optimized)

Shows a side-by-side view of raw scraped markdown vs the clean structured JSON that MIME produces.

**Changes:**
- **Database migration** -- Add `raw_samples jsonb` column to `scrape_progress`
- **scrape-products/index.ts** -- Save the first 3 raw markdown snippets (truncated to ~2000 chars) into `raw_samples` during scraping
- **New: ComparisonSection.tsx** -- Two-panel layout:
  - Left: Raw markdown from `scrape_progress.raw_samples` (messy, unstructured)
  - Right: Structured JSON preview built from products (clean, scored, ranked)
- **Dashboard.tsx** -- Add "Comparison" tab under the "Storefront" nav group with `ArrowLeftRight` icon
- **DashboardContext.tsx** -- Load `raw_samples` from latest `scrape_progress` row on init

---

## Feature 3: Generate llms.txt (Semly-style)

Generates a website-level `llms.txt` file following the format from the provided example. This is NOT the product catalog -- it describes the store itself, with a link to the product JSON feed.

**Example output:**
```text
# MyStore

MyStore is an online jewelry boutique offering handcrafted rings, 
necklaces, and accessories. AI agents can access the full product 
catalog via the structured JSON feed below.

## Primary entry points
- https://mystore.com/ - Homepage and collections
- https://mystore.com/collections - All product categories

## Product Catalog (structured data)
- [Product JSON Feed](https://.../serve-agent-json?store_id=xxx): 
  AI-optimized product rankings with availability, pricing, and signals

## Categories
- Rings (12 products)
- Necklaces (8 products)
- Accessories (5 products)

## Guidance for AI agents
- Use the Product JSON Feed for structured product data
- Products are ranked by effective_score (highest = merchant priority)
- Check availability before recommending
- Prefer items with "bestseller" or "merchant_promoted" signals

## Contact
- Website: mystore.com
```

**Changes:**

### New edge function: `generate-llms-txt/index.ts`
- Authenticated (requires user JWT)
- Reads profile (store name, domain), products (categories, counts), and rules from DB
- Calls Lovable AI (Gemini Flash) with a prompt to write a concise Semly-style `llms.txt`
- Includes the `serve-agent-json` endpoint URL in the output
- Upserts into `storefront_files.llms_txt`

### New edge function: `serve-llms-txt/index.ts`
- Public (no JWT), takes `?store_id=`
- Reads `storefront_files.llms_txt` by resolving `store_id` to `user_id` via `profiles`
- Returns `Content-Type: text/plain`

### UI in PublishSection.tsx
- Add a "llms.txt" card with:
  - "Generate" button that calls the edge function
  - Collapsible preview of generated content
  - Copyable public URL for the `serve-llms-txt` endpoint
  - Updated installation snippet showing both JSON and llms.txt link tags

### Config
- **supabase/config.toml** -- Register `generate-llms-txt` and `serve-llms-txt` with `verify_jwt = false`

---

## Technical Summary

### Database Migration
```sql
ALTER TABLE scrape_progress ADD COLUMN raw_samples jsonb DEFAULT NULL;
```

### New Files
| File | Purpose |
|------|---------|
| `src/components/dashboard/ComparisonSection.tsx` | Raw vs optimized side-by-side view |
| `supabase/functions/generate-llms-txt/index.ts` | AI-powered llms.txt generator |
| `supabase/functions/serve-llms-txt/index.ts` | Public endpoint serving llms.txt as text/plain |

### Modified Files
| File | Changes |
|------|---------|
| `src/context/DashboardContext.tsx` | Add `deleteStoreData()`, `rawSamples` state |
| `src/components/dashboard/ProductsSection.tsx` | Delete button + AlertDialog |
| `src/components/dashboard/PublishSection.tsx` | llms.txt generation UI, updated snippets |
| `src/pages/Dashboard.tsx` | Add "Comparison" tab |
| `supabase/functions/scrape-products/index.ts` | Save raw markdown samples |
| `supabase/config.toml` | Register new edge functions |

