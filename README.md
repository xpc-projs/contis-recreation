# Conti's Bakeshop & Restaurant — Static Website Recreation

**Current status:** Development increment 4 - Final Recreation Phase. A larger local catalog, direct product/collection entry points, and region coverage data have been added. This remains an academic recreation, not an official Conti's service or a complete one-to-one reproduction.

## Run locally
1. Extract the project folder.
2. Open `contis-recreation` in Visual Studio Code.
3. Enable the Live Server extension if it is not already installed.
4. Right-click the root `index.html` and choose **Open with Live Server**.
5. Browse the local pages and test the cart / checkout / tracking simulations.

Use the root `index.html` with Live Server or another static server. Do not open with `file://`, because the app loads its JSON data with `fetch()`.

## What's included
- Responsive homepage, header, navigation and footer shell. The Menu label opens the full catalog directly, with category dropdowns retained on hover.
- Local Bootstrap 5.3.9 distribution (no framework build step required).
- 234 customer-facing product records from the public Shopify catalog, excluding the internal cart-customization entry. The five official menu pathways are What's New, Restaurant Menu, Food Trays, Fabulous Cakes and Baked Goodies.
- Individual direct-entry product pages for all 234 catalog items, with image galleries, desktop hover zoom and click-to-enlarge, selectable variants, allergen details, quantity controls, wishlist actions and related products.
- Subcategory landing pages and direct routes for Restaurant Menu, Food Trays and Baked Goodies, including Food Trays → Packed Meals → Snack Sets / Lunch Sets.
- Hover/focus quick actions on product cards, touch-friendly controls, a reference-style horizontal list view and saved 2–6-column grids, search, category dividers and price sorting.
- Expandable header search with live product previews; a browser-local wishlist and order schedule.
- Local cart and Recently Viewed Products.
- Local checkout with a payment-success confirmation, order history and order tracking simulator.
- Downloadable order receipt.
- Basic demo account interface, Help Center FAQ, contact and service pages.
- Searchable coverage for all 102 captured stores across 16 regions and their listed cities, plus source-verified local branch samples and links to the official locator.
- Services overview with delivery, pick-up, dine-in, Take-Out Nook, catering and celebration venue links.
- Route, content, feature, dependency, asset and discrepancy documentation under `docs/`.

## Important limitations
- This is a front-end academic demonstration. It is not operated by Conti's.
- No real order, payment, delivery, account authentication, email, or message is submitted.
- The catalog is a snapshot of Conti's public Shopify listings and may change. It includes the 234 customer-facing records in the captured All collection; the internal cart-customization entry is intentionally excluded.
- Category totals are a navigation taxonomy: exact source memberships are retained, and remaining All-collection products are assigned by official product type (or product tags when the type is missing). The What's New collection is a cross-list.
- Variant options and prices are retained where supplied by the catalog. Displayed prices and availability can change by branch or ordering channel.
- All 232 products with source photos use local primary images, and product gallery images are local as well; 96 unique official Shopify CDN images have been mirrored for offline use. Two listings without a source image retain neutral placeholders. The homepage banner remains unavailable; the Our Story page links to the official Conti sisters photograph. No unrelated stock or generated images are substituted. See `docs/ASSET_MANIFEST.md`.
- The local store view includes all captured regional and city counts, but not every individual branch address. Use the linked official locator for current branch details.
- Legal pages currently direct users to official text rather than reproducing unverified legal copy.
- Full browser visual QA and full route-by-route comparison against the live site remain outstanding.

## Additional local features
Recently Viewed Products, a browser-local wishlist, product image gallery, configurable catalog layouts, and Order Tracking Simulator and Downloadable Order Receipt are local-only features. No comparison, gift/product finder, or server-backed save-for-later service is included.

## Safety and demo data
Use fictional customer details only. The local demo account is not secure authentication. Payment choices are simulation-only and must not be used to enter real card or wallet credentials.

## Project structure
- `index.html` — homepage shell
- `css/styles.css` — project styling
- `js/app.js` — client-side routing and interactions
- `data/` — local JSON catalog, collections and branch data
- `products/`, `collections/`, `pages/`, `tools/`, etc. — direct-entry route shells
- `bootstrap-5.3.9-dist/` — supplied local Bootstrap distribution
- `docs/` — inventories, asset placeholders, discrepancies and test report

## Current development metrics
- 234 current product records; 7 collection records
- 234 individual current product entry points; old unmatched route shells may remain
- 7 collection entry points
- 16 regional branch coverage records
- Catalog integrity checks and browser smoke checks passed for representative routes, filtering, search, product variants, cart updates and menu navigation
