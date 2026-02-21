

# Full Demo and Dashboard Fix Plan

## Problem Summary

The app has several issues preventing a complete working demo:

1. **Empty dashboard**: The user has 0 products in the database, so all KPIs show 0, charts are empty, and the products table is blank.
2. **No demo/seed data path**: New users who haven't scanned a store see a completely empty, uninviting dashboard with no guidance.
3. **Duplicate key warning**: The `WizardContainer` has an `AnimatePresence` wrapping multiple step divs with potential key collisions.
4. **Wizard doesn't gate auth early enough**: Step 3 (Crawl) requires auth but the user doesn't know until they reach it.

## Plan

### 1. Seed demo products for empty dashboards

When the dashboard loads and finds 0 products, show an "empty state" with a prominent option to either:
- **Load demo data** (insert mock products into the DB for this user so all dashboard features work)
- **Scan a store** (redirect to wizard or trigger re-scan)

This uses the existing `mockProducts` data, inserting them into the `products` table with the user's `user_id`.

**File**: `src/components/dashboard/OverviewSection.tsx` -- add empty state UI at the top when `products.length === 0`

**File**: `src/context/DashboardContext.tsx` -- add a `seedDemoProducts()` function that inserts mockProducts into the DB

### 2. Fix duplicate key warning in WizardContainer

The `AnimatePresence` in `WizardContainer.tsx` wraps all 4 step divs, but the conditional rendering means multiple `motion.div` elements can share the `key` attribute pattern. Fix by ensuring each step block has a unique, stable key and only the active one is inside the `AnimatePresence`.

**File**: `src/components/landing/WizardContainer.tsx` -- restructure the step rendering to use unique keys

### 3. Add empty states to Products and Rules sections

When there are 0 products, show a friendly empty state in:
- **ProductsSection**: "No products yet" with buttons to load demo data or scan a store
- **RulesSection**: Already has default rule templates, but show guidance when no products exist

**Files**: `src/components/dashboard/ProductsSection.tsx`, `src/components/dashboard/RulesSection.tsx`

### 4. Dashboard "no store connected" guidance

When `storeUrl` is empty in Dashboard, show a banner prompting the user to connect a store or load demo data, instead of silently showing "No store connected" in the header.

**File**: `src/pages/Dashboard.tsx` -- add a top banner when no store URL is set

## Technical Details

### seedDemoProducts function (DashboardContext)

```typescript
const seedDemoProducts = async () => {
  if (!user) return;
  const { mockProducts } = await import("@/data/mockProducts");
  const inserts = mockProducts.map((p) => ({
    user_id: user.id,
    title: p.title,
    price: p.price,
    currency: p.currency,
    availability: p.availability,
    category: p.category,
    tags: p.tags,
    inventory: p.inventory,
    url: p.url,
    image: p.image,
    boost_score: p.boostScore,
    included: p.included,
  }));
  await supabase.from("products").insert(inserts);
  await reloadProducts();
  toast({ title: "Demo loaded", description: "Sample products added to your dashboard." });
};
```

### WizardContainer key fix

Move the `AnimatePresence` to wrap only the active step content, not the entire step list. Each conditional block already has unique keys (`step1`, `step2`, etc.) but the parent divs (step refs) are all rendered simultaneously inside `AnimatePresence`, causing duplicate key issues.

### Empty state component pattern

A reusable empty state block with an illustration (Package icon), title, description, and action buttons (Load demo / Scan store).

### Files to modify

- `src/context/DashboardContext.tsx` -- add `seedDemoProducts` to context
- `src/components/dashboard/OverviewSection.tsx` -- add empty state when 0 products
- `src/components/dashboard/ProductsSection.tsx` -- add empty state when 0 products
- `src/components/landing/WizardContainer.tsx` -- fix duplicate key warning
- `src/pages/Dashboard.tsx` -- add store connection banner

