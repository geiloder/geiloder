# Open Food Facts Discovery Pipeline Design

## Goal

Build a non-affiliate discovery mode for "Geil oder?" that imports packaged fitness-adjacent food products from Open Food Facts, scores them for social-content potential, generates compliant product-check copy, and renders reviewable social slides without purchase links or affiliate claims.

## Source And Rights Model

Open Food Facts is the first MVP source because it offers reusable food-product data and product images under open licenses. Imported records must keep attribution data with the product:

- `source_name = openfoodfacts`
- `source_url` points to the Open Food Facts product page
- `image_license = CC BY-SA`
- `image_rights_status = open_data_reviewed`
- `monetization_type = none`

The app may show packaging photos from Open Food Facts, but it must not imply brand endorsement. Slides should frame the product as a "Produkt-Check" or "Gym-Fund", not as an official ad.

## Content Model

Existing affiliate deals remain supported. Open Food Facts imports use `content_type = product_discovery` and store nutrient facts in `product_facts`.

Discovery content does not require price, discount, coupon, or affiliate link. Existing required DB columns are kept compatible by storing `deal_preis = 0` and `affiliate_link = source_url`, while UI and copy branches hide deal/buy language for discovery items.

## Pipeline

The MVP pipeline has these steps:

1. Import products by keyword from Open Food Facts.
2. Normalize products into `deals` rows with discovery metadata.
3. Score products using social-content signals: image, known fitness brand, protein density, low sugar, category fit, and humor potential.
4. Generate discovery copy with Groq using factual nutrition data and no health claims.
5. Render 4 slides with existing HTML/Playwright templates, adjusted language for product checks.
6. Review in Admin before manual posting.

## Admin

Add `/admin/pipeline` as a lightweight operations page. It should explain the current pipeline, show the exact commands, and link to filtered deal lists for imported discovery products. Full in-browser job execution can be added later after the data model is stable.

## Compliance

Discovery posts must avoid:

- Affiliate disclosure when no affiliate link exists.
- "Jetzt kaufen" / "Deal sichern" language.
- Health promises such as muscle gain, fat burning, guaranteed results, or medical claims.
- Claims that require live price or availability.

Allowed language:

- "Unbezahlt recherchiert"
- "Kein Affiliate-Link"
- "Produkt-Check"
- "Würdest du probieren?"
- Facts directly available from Open Food Facts, such as protein, sugar, calories, quantity, brand, and barcode.
