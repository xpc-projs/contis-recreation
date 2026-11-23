# Content Inventory — Product Catalog Snapshot

## Local product catalog
`data/products.json` contains 234 customer-facing listings from Conti's public Shopify All collection, excluding the internal `item-customizations-1` cart-customization entry. Current primary menu counts:

- Restaurant Menu: 86
- Food Trays: 69
- Baked Goodies: 56
- Fabulous Cakes: 23

What's New is an overlapping cross-list (8 captured products), not a primary category. The five official menu collection membership counts at capture were: What's New 8, Restaurant Menu 41, Food Trays / Large Food Order 50, Fabulous Cakes 23, and Baked Goodies / Take-Out Nook 46. The union of these collections is 164 unique products; the remaining All-collection listings are assigned to a primary pathway using their official product type or, when that is missing, product tags. Exact original memberships are retained in each product's `sourceCollections`; `collections` also includes its primary navigation pathway.

Restaurant Menu, Food Trays and Baked Goodies have subcategory filters using the source product types. Every record retains its source URL, descriptions, tags, variant titles, variant prices and availability. 32 product records are matched to supplied local photos. Old product IDs are retained as aliases when the existing record name could be matched.

The public catalog is dynamic; product listings, wording, prices, variants, categories and availability can change. Treat this local JSON as a snapshot, not an inventory guarantee.

## Branch coverage
`data/branch-coverage.json` contains 16 regions and city/municipality counts from the supplied content reference. These are coverage counts only, not individual address records. `data/branches.json` contains the existing sample branch records.

## Key company details in the supplied reference
- Customer care: wecare@contis.ph
- Hotline: 8580-8888
- Official site: https://www.contis.ph/
- Help Center: https://www.contis.ph/a/self-faq
