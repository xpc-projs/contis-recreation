# Asset Manifest

## Asset handling rule
Only use authentic Conti's assets that can be sourced and verified. Until verified original files are available, the recreation uses explicit neutral placeholders. No stock or AI-generated replacement product photography is used.

## Expected local folders
- `assets/images/brand/contis-logo.png` — supplied official logo, used in the shared site header
- `assets/images/banners/` — official homepage / campaign banners (not yet collected/verified)
- `assets/images/products/{product-id}.*` — authentic product photos sourced from official product listings and stored locally for offline catalog use
- `assets/images/stores/` — official branch imagery, if present on source pages (not yet collected/verified)

## Current status
- Official logo: available and displayed in the shared site header
- Homepage hero / promotional banners: pending
- Product images: all 232 listings with source photos use local primary images. The 96 unique official Shopify images previously loaded remotely are now stored locally, including gallery images; two source listings without images retain neutral placeholders.
- Branch / service images: pending
- Conti sisters story photograph: linked from the official Conti's Our Story image CDN; requires an internet connection
- Fonts: CSS uses system-safe Georgia/Arial fallbacks; official webfont identity not yet verified

## Documentation placeholders
When an original file cannot be acquired, record the intended asset path, source page, retrieval status and reason in `ASSET_CREDITS.md`. Keep placeholders in the running site until a verified original is available.
