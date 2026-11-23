# Page Inventory — Initial Audit

**Status:** Initial discovery, not complete.

| Page family | Confirmed content / components | Remaining inspection |
|---|---|---|
| Homepage | Catering inquiry strip, brochure link, cart count, hero/banner image slots, Most Loved Picks, category links, stores-near-you, service links, footer, newsletter, cart/account entry points | Inspect actual header/menu labels, hero image assets, mobile layout, interaction states and below-the-fold details |
| Collections | Product grid, product image, title, price/range, description, Order Now, category navigation, product count and pagination/“viewed X of Y” behavior | Enumerate all pages/products, filters, sort, card actions and page query state |
| Product detail | Product title, price, description, allergens, variants/sizes, image zoom, quantity/cart controls, COD note | Inspect all product-specific options, scheduling, selected store, stock states and image gallery |
| Restaurant menu page | Menu categories (rice bowls, breakfast, appetizers, salads, mains, pasta, vegetables, soups, sandwiches, noodles, desserts, drinks, coffee/beverages), brochure link | Capture every category and product listing and downloadable brochure |
| Large food orders page | Packed meals, set menu, salad entrees, appetizers, noodles, pasta, seafood, beef, pork/chicken, vegetables, rice, soups | Capture all products, variants, tray sizes and brochure |
| Take-Out Nook page | Service information and link to baked goodies assortment | Capture exact copy, images and collection cross-links |
| Store locator | Map/search, region filters, view directory | Inspect map provider, filter interactions, geolocation permission behavior and branch pin details |
| Store directory | Country total, regional counts and city groupings | Crawl every branch record and capture exact addresses/contact/hours/service options |
| Branch detail | Branch name, opening hours, address, phone, directions/call/website/email actions, service options | Capture every branch and verify map links |
| Help Center | Search field, topic categories, FAQ questions, feedback prompts, chat/email assistance | Capture all answers, search behavior, helpful/not-helpful feedback and chat behavior |
| Policies | Privacy policy; Terms of Service including delivery, delivery fees and order tracking | Capture complete terms and any additional policy routes |
| Service articles | Dine-in, delivery, drive-thru, take-out, celebration venues | Discover and capture all service pages and article images |
| Cart / checkout | Cart count and cart route confirmed; FAQ describes pickup/delivery, store, date/time, customer details, item selection, checkout and payment | Direct UI inspection required for all fields, validation, order summary and payment provider states |
| Account | Account entry point visible | Exact account pages and authentication states not yet verified |
| Careers | Footer external link to careers.eight8ate.ph; FAQ provides recruitment email | Verify destination and whether it is in scope for local recreation |

## Homepage observations

The live indexed homepage currently exposes three “Most Loved Picks”: Mango Bravo, Cheese Roll and Ube Custard. The home page also links to Fabulous Cakes, Baked Goodies, Restaurant Menu and Large Food Order, and includes store/service discovery and newsletter signup.

The page's indexed content has a discrepancy in category counts: homepage extraction reports “Fabulous Cakes 23” and zero for several other category badges, while collection pages expose separate category counts. Do not copy these badge counts without verifying their intended meaning in the live UI.
