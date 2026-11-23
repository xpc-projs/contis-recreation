# Dependency Inventory — Initial Audit

## Required local dependency supplied

| Dependency | Version | Local files | Status |
|---|---|---|---|
| Bootstrap | 5.3.9 | `bootstrap-5.3.9-dist/css/bootstrap.min.css`; `bootstrap-5.3.9-dist/js/bootstrap.bundle.min.js` | Supplied archive inspected; exact files present |

The supplied archive contains 48 entries and includes the required minified CSS and bundle JS paths. The distribution should be extracted unchanged into the project root.

## Required implementation stack

- HTML5.
- CSS3.
- Bootstrap 5.3.9.
- Vanilla JavaScript.
- Browser `localStorage` / `sessionStorage` for local demo state.

## Proposed dependency policy

- No React, Vue, Angular, Tailwind, Next.js or backend framework.
- No npm/Node requirement for normal operation.
- Use local Bootstrap first.
- CDN fallback only if local Bootstrap resource fails; verify official CDN integrity values before adding SRI attributes.
- Any third-party script detected during the full audit must be recorded with source, purpose, necessity, offline impact and replacement/limitation notes.

## External integrations discovered / suspected

- Shopify storefront/cart/catalog platform.
- Help Center provider (Willdesk branding visible).
- Google Tag Manager iframe.
- Careers destination at `careers.eight8ate.ph`.
- Store locator map provider not yet identified.
- Payment provider named iPay88 in FAQ; project implementation must not connect to production payment.
