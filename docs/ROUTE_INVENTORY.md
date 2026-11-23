# Route Inventory — Development Increment 4

| Route family | Local coverage | Status |
|---|---|---|
| `/` | Homepage | Implemented initial |
| `/collections/all` | All Products | Implemented, 234 customer-facing listings |
| `/collections/fabulous-cakes` | Fabulous Cakes | Implemented, 23 captured listings |
| `/collections/take-out-nook` | Baked Goodies | Implemented, product-type subcategories |
| `/collections/restaurant-menu` | Restaurant Menu | Implemented, product-type subcategories |
| `/collections/large-food-order` | Food Trays | Implemented, product-type subcategories |
| `/collections/{restaurant-menu,large-food-order,take-out-nook}/{subcategory}` | Restaurant Menu, Food Trays and Baked Goodies subcategories | Implemented with direct-entry route shells and image-led category tiles |
| `/collections/large-food-order/packed-meals/{snack-sets,lunch-sets}` | Packed Meals nested categories | Implemented, 8 listings in each set |
| `/collections/latest-products` | What's New | Implemented cross-list from source membership |
| `/collections/cake-accessories` | Cake Accessories | Implemented as a Baked Goodies subcategory |
| `/products/{id}/` | 234 current product route shells | Implemented, image gallery, variant options, wishlist and cart controls from local JSON |
| `/cart/` | Cart | Implemented local simulation |
| `/checkout/` | Checkout and payment sandbox | Implemented local simulation |
| `/search/` | Search | Implemented local search |
| `/pages/wishlist` | Saved products | Implemented browser-local wishlist |
| `/account`, `/account/login`, `/account/register` | Demo account | Basic local simulation |
| `/pages/our-story` | Our Story | Expanded source-based story with official sisters photograph |
| `/pages/services` | Services overview | Implemented; links to ordering, delivery, dine-in, Take-Out Nook, catering and venues |
| `/pages/restaurant-menu` | Restaurant menu | Collection view |
| `/pages/take-out-nook` | Take-Out Nook | Collection view |
| `/pages/large-food-orders` | Large food orders | Collection view |
| `/pages/delivery`, `/pages/dine-in`, `/pages/catering`, `/pages/celebration-venues` | Service information | Initial source-based summaries |
| `/pages/contact` | Contact | Partial |
| `/pages/order-history` | Demo order history | Implemented |
| `/pages/order-tracking` | Tracking simulator | Implemented |
| `/pages/order-receipt` | Downloadable demo receipt | Implemented |
| `/pages/order-confirmation` | Demo confirmation | Implemented |
| `/tools/locations`, `/tools/locations/directory` | Branch search and regional coverage | 102 captured locations represented by 16 region and city summaries; 3 source-verified local branch records |
| `/tools/locations/countries/philippines` | Country locator entry | Route shell |
| `/tools/locations/regions/laguna` | Laguna coverage summary | Initial |
| `/tools/locations/locations/san-pablo-mainstreet` | San Pablo Mainstreet branch | Source-linked summary |
| `/a/self-faq` | Help Center | Partial FAQ sample |
| `/policies/privacy-policy`, `/policies/terms-of-service` | Legal pages | Link to official copy; local text not yet captured |

This is an implementation route map, not proof that all live Shopify URLs or dynamically generated routes have been discovered.
