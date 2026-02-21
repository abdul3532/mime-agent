
# Dashboard Optimization Plan

## Goal
Make every dashboard section interactive and actionable -- clicking on KPI cards, chart elements, AI suggestions, and product rows opens contextual pop-ups (dialogs/sheets) where users can view details and make changes that flow back into the data. This turns the dashboard from a read-only display into a fully integrated control center.

---

## Changes by Section

### 1. Overview -- Clickable KPIs with Detail Dialogs
- Each KPI card becomes clickable. Clicking opens a `Dialog` with a breakdown:
  - **Products indexed**: shows category breakdown table, toggle to include/exclude products inline
  - **Categories**: lists each category with product count, avg margin, and a "Boost all" quick action
  - **Avg margin**: histogram of margin distribution, highlights low-margin products with an "Adjust" button
  - **Avg boost score**: distribution chart and quick bulk-adjust slider
- All changes made inside dialogs update the shared `products` state

### 2. Overview -- Actionable AI Suggestions
- Clicking an AI suggestion card opens a confirmation dialog explaining what will change (e.g., "Boost 5 low-stock items by +2")
- "Apply" button executes the action (updates product boost scores, includes/excludes products)
- Toast confirms the action with an "Undo" option
- Applied suggestions get a checkmark and "Applied" badge

### 3. Overview -- Interactive Charts
- Clicking a bar in the Revenue by Category chart opens a `Sheet` (slide-over panel) filtered to that category's products with inline boost/include controls
- Clicking a donut segment (e.g., "Low Stock") opens a filtered product list dialog
- Clicking a product in "Top Boosted Products" opens a product detail dialog with editable boost score, tags, and inclusion toggle

### 4. Products -- Product Detail Dialog
- Clicking any product row opens a `Dialog` with:
  - Product image, title, price, category, tags (editable)
  - Boost score slider (larger, more prominent)
  - Include/exclude toggle switch
  - Margin and inventory display
  - "Save" button to apply changes
- Inline editing: double-click price or tags to edit directly in the table

### 5. Products -- Enhanced Bulk Actions
- Bulk action bar becomes a sticky bottom sheet when items are selected
- Add "Set boost to..." action with a number input in a popover
- Add "Add tag..." and "Remove tag..." bulk actions via popover with tag picker
- Confirmation dialog for destructive actions (exclude, demote)

### 6. Rules -- Rule Editor Dialog
- Clicking an active rule opens a `Dialog` to edit its field, condition, value, and boost amount
- "Add custom rule" button (beyond templates) opens a full rule builder dialog with:
  - Field selector (dropdown)
  - Condition selector (dropdown)
  - Value input (text or number depending on field)
  - Action selector (boost/demote/exclude)
  - Amount slider
- Deleting a rule shows a confirmation alert dialog

### 7. Rules -- Live Impact Detail
- Clicking a product in the "Rule impact preview" panel opens its product detail dialog
- Hovering over a product shows which rules affected it (tooltip)

### 8. Preview -- Enhanced JSON Preview
- Add a "Validate JSON" button that checks the output against a schema and shows results in a dialog
- Add a "Compare with live" button (shows diff in a dialog between current draft and "published" version)
- Clicking a product in the JSON highlights it and offers "Edit this product" link to Products tab

### 9. Publish -- Guided Flow with Confirmation
- "Publish changes" opens a confirmation `AlertDialog` showing:
  - Summary of changes (X products updated, Y rules changed)
  - Before/after comparison
  - "Publish" and "Cancel" buttons
- Add a "Schedule publish" option via a date/time picker popover

### 10. Shared State Architecture
- Lift `products` state from `ProductsSection` up to `Dashboard` and pass it down via props to all sections
- Create a `useDashboardStore` hook (simple React context) to share:
  - `products` + `setProducts`
  - `rules` + `setRules`  
  - `appliedSuggestions` tracking
- All sections read from and write to the same state, so changes in one section are immediately reflected everywhere

### 11. Global Search (Header)
- Make the search bar functional: filters across products, rules, and suggestions
- Results appear in a `Command` palette (cmdk) dropdown with grouped results
- Selecting a result navigates to the relevant tab and highlights/opens the item

---

## Technical Approach

### New Files
- `src/context/DashboardContext.tsx` -- shared state context with products, rules, applied suggestions
- `src/components/dashboard/ProductDetailDialog.tsx` -- reusable product detail/edit dialog
- `src/components/dashboard/CategorySheetPanel.tsx` -- slide-over filtered product list by category
- `src/components/dashboard/RuleEditorDialog.tsx` -- create/edit rule dialog
- `src/components/dashboard/PublishConfirmDialog.tsx` -- publish confirmation with change summary
- `src/components/dashboard/GlobalSearchCommand.tsx` -- command palette for search

### Modified Files
- `src/pages/Dashboard.tsx` -- wrap content in `DashboardProvider`, wire up global search
- `src/components/dashboard/OverviewSection.tsx` -- add click handlers to KPIs, charts, suggestions, product list; integrate dialogs
- `src/components/dashboard/ProductsSection.tsx` -- consume shared context, add row click to open detail dialog, enhance bulk actions
- `src/components/dashboard/RulesSection.tsx` -- consume shared context, add rule click to edit, add custom rule builder
- `src/components/dashboard/PreviewSection.tsx` -- add validate/compare buttons
- `src/components/dashboard/PublishSection.tsx` -- add confirmation dialog before publish

### UI Components Used
- `Dialog` -- product details, KPI breakdowns, suggestions confirmation
- `Sheet` -- category drill-down panels
- `AlertDialog` -- destructive confirmations (delete rule, publish)
- `Popover` -- boost value picker, tag picker for bulk actions
- `Command` -- global search palette
- `Switch` -- include/exclude toggles in detail dialogs
- `Slider` -- boost score adjustment
- `Tabs` -- within detail dialogs for organizing info

### Data Flow

```text
DashboardContext (products, rules, appliedSuggestions)
    |
    +-- Dashboard.tsx (provider + global search)
         |
         +-- OverviewSection (reads products/rules, dispatches updates via dialogs)
         +-- ProductsSection (reads/writes products via context)
         +-- RulesSection (reads/writes rules via context, reads products for preview)
         +-- PreviewSection (reads products + rules for JSON generation)
         +-- PublishSection (reads state for change summary)
```

This plan turns every data point on the dashboard into an interaction point, while keeping all sections in sync through shared state.
