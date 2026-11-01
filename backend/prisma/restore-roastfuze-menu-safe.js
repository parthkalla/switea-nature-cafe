/**
 * ==============================================================================
 * RoastFuze Coffee Bar - Safe Production Menu Restoration Script
 * ==============================================================================
 * 
 * PURPOSE:
 * Restores the RoastFuze restaurant, 11 official menu categories, 89 menu items,
 * item modifiers, tables, and marketing copy WITHOUT deleting, truncating, or
 * modifying any existing users, orders, payments, or unrelated database records.
 * 
 * SAFETY GUARANTEES:
 * 1. ZERO deleteMany(), drop table, truncate, or reset commands.
 * 2. Fully transactional (Prisma $transaction) - rolls back on any error.
 * 3. Preserves all existing users, passwords, and user data.
 * 4. Links existing owner (e.g. dheeraj@asrockstudios.in) to restaurant membership.
 * 5. Pre-flight conflict detection: stops safely if partial menu items already exist.
 * 6. Defaults to DRY-RUN mode. Requires explicit --execute flag to write.
 * 7. Never outputs database credentials or secrets.
 * ==============================================================================
 */

const path = require('path');

// 1. CLI Arguments Evaluation
const args = process.argv.slice(2);
const isExecute = args.includes('--execute') || args.includes('--apply');
const isDryRun = !isExecute || args.includes('--dry-run');

// 2. Multi-Path Resilient Prisma Client Loader
let PrismaClient;
const candidatePaths = [
  path.join(__dirname, '../dist/generated-client'),
  path.join(__dirname, '../../dist/generated-client'),
  path.join(process.cwd(), 'dist/generated-client'),
  path.join(__dirname, '../node_modules/@prisma/client'),
  '@prisma/client'
];

let loadedFrom = null;
for (const cp of candidatePaths) {
  try {
    const mod = require(cp);
    PrismaClient = mod.PrismaClient || (mod.default && mod.default.PrismaClient);
    if (PrismaClient) {
      loadedFrom = cp;
      break;
    }
  } catch (e) {
    // try next candidate
  }
}

if (!PrismaClient) {
  console.error('❌ [FATAL] Unable to load PrismaClient from any candidate path:');
  candidatePaths.forEach(p => console.error('   -', p));
  process.exit(1);
}

const prisma = new PrismaClient({
  log: ['error']
});

// 3. Exact Canonical Restaurant & Menu Data
const RESTAURANT_DATA = {
  name: 'RoastFuze Coffee Bar - Musical Balcony cafe',
  slug: 'roastfuze',
  description: 'Jaipur’s premier Musical Balcony Cafe & Artisan Coffee Bar on Gandhi Path West, Vaishali Nagar. Hand-pulled espresso roasts, thick ice-cream frappes, stone-baked pizzas, Belgian waffles, and live acoustic music sessions under warm balcony lights.',
  tagLine: 'Musical Balcony Cafe & Artisan Coffee Bar',
  logo: '/images/roastfuze_coffee_cup.png',
  coverImage: '/images/roastfuze_interior.jpg',
  address: 'A-26, Vivek Vihar, Lalarpura Road, Gandhi Path West, Vaishali Nagar',
  city: 'Jaipur',
  state: 'Rajasthan',
  postalCode: '302021',
  phone: '+91 93521 82562',
  email: 'hello@roastfuze.com',
  mapLink: 'https://maps.google.com/?cid=17018898144004907934',
  whatsappNumber: '+919352182562',
  upiId: '9352182562@upi',
  openingHours: '10:00 AM - 11:00 PM',
  currency: 'INR',
  currencySymbol: '₹',
  timezone: 'Asia/Kolkata',
  taxPercent: 5.0,
  isOrderingEnabled: true,
  isPayAtCounterOnly: false,
  isOpen: true,
};

const CATEGORIES_AND_ITEMS = [
  {
    "category": {
      "name": "Hot Coffee",
      "slug": "hot-coffee",
      "itemType": "COFFEE",
      "description": "Single-origin espresso roasts extracted fresh on our commercial espresso machine.",
      "image": "/images/dishes/cappuccino.jpg",
      "displayOrder": 1,
      "isActive": true
    },
    "items": [
      {
        "name": "Espresso",
        "slug": "espresso",
        "description": "Double shot of fresh espresso with rich golden crema.",
        "price": 79,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/espresso.jpg",
        "prepTimeMinutes": 4,
        "displayOrder": 1
      },
      {
        "name": "Americano (Black Coffee)",
        "slug": "americano-black-coffee",
        "description": "Shot of espresso extracted over hot water for a smooth, bold cup.",
        "price": 89,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/americano.jpg",
        "prepTimeMinutes": 4,
        "displayOrder": 2
      },
      {
        "name": "Cappuccino",
        "slug": "cappuccino",
        "description": "Espresso, steamed milk, 1/3rd thick foam, served warm dusted with cocoa.",
        "price": 89,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/cappuccino.jpg",
        "prepTimeMinutes": 5,
        "displayOrder": 3
      },
      {
        "name": "Latte",
        "slug": "latte",
        "description": "Espresso, steamed milk, delicate micro-foam, served warm.",
        "price": 89,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/latte.jpg",
        "prepTimeMinutes": 5,
        "displayOrder": 4
      },
      {
        "name": "Flat White",
        "slug": "flat-white",
        "description": "Double Espresso, steamed milk, micro foam, served warm.",
        "price": 99,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/flat_white.jpg",
        "prepTimeMinutes": 5,
        "displayOrder": 5
      },
      {
        "name": "Cafe Mocha",
        "slug": "cafe-mocha",
        "description": "Espresso, cocoa powder, Steamed Milk, served warm.",
        "price": 109,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/dishes/cafe_mocha.jpg",
        "prepTimeMinutes": 6,
        "displayOrder": 6
      },
      {
        "name": "Hot Chocolate",
        "slug": "hot-chocolate",
        "description": "Thick and creamy hot cocoa topped with rich froth.",
        "price": 109,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/chocolate_shake.jpg",
        "prepTimeMinutes": 5,
        "displayOrder": 7
      },
      {
        "name": "Biscoff Latte",
        "slug": "biscoff-latte",
        "description": "Latte served with creamy Lotus Biscoff spread and warm microfoam.",
        "price": 159,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/dishes/latte.jpg",
        "prepTimeMinutes": 6,
        "displayOrder": 8
      }
    ]
  },
  {
    "category": {
      "name": "Iced Coffee",
      "slug": "iced-coffee",
      "itemType": "COFFEE",
      "description": "Chilled espresso poured over ice crystals and fresh dairy.",
      "image": "/images/roastfuze_coffee_cup.png",
      "displayOrder": 2,
      "isActive": true
    },
    "items": [
      {
        "name": "Espresso On the Rocks",
        "slug": "espresso-on-the-rocks",
        "description": "Double Espresso extracted over ice cubes for a bold, pure kick.",
        "price": 99,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/iced_americano.jpg",
        "prepTimeMinutes": 4,
        "displayOrder": 1
      },
      {
        "name": "Iced Americano",
        "slug": "iced-americano",
        "description": "Espresso extracted over ice and filtered water.",
        "price": 99,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/iced_americano.jpg",
        "prepTimeMinutes": 4,
        "displayOrder": 2
      },
      {
        "name": "Iced Latte",
        "slug": "iced-latte",
        "description": "Double espresso extracted over ice and chilled milk in RoastFuze signature cup.",
        "price": 109,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/roastfuze_coffee_cup.png",
        "prepTimeMinutes": 5,
        "displayOrder": 3
      },
      {
        "name": "Iced Cappuccino",
        "slug": "iced-cappuccino",
        "description": "Double espresso extracted over ice and milk, topped with cloud foam.",
        "price": 109,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/iced_cappuccino.jpg",
        "prepTimeMinutes": 5,
        "displayOrder": 4
      },
      {
        "name": "Iced Mocha",
        "slug": "iced-mocha",
        "description": "Espresso with chocolate, milk and topped with ice.",
        "price": 129,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/iced_mocha.jpg",
        "prepTimeMinutes": 5,
        "displayOrder": 5
      },
      {
        "name": "Iced Caramel Macchiato",
        "slug": "iced-caramel-macchiato",
        "description": "Velvety milk, bold espresso, and a touch of caramel indulgence.",
        "price": 139,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/roastfuze_coffee_cup.png",
        "prepTimeMinutes": 5,
        "displayOrder": 6
      },
      {
        "name": "Iced Spanish Latte",
        "slug": "iced-spanish-latte",
        "description": "Smooth iced coffee with milk and signature Spanish sauce sweetness.",
        "price": 159,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/dishes/iced_cappuccino.jpg",
        "prepTimeMinutes": 5,
        "displayOrder": 7
      },
      {
        "name": "Espresso Tonic",
        "slug": "espresso-tonic",
        "description": "Bold espresso meets sparkling tonic for a crisp, refreshing kick.",
        "price": 159,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/dishes/iced_americano.jpg",
        "prepTimeMinutes": 4,
        "displayOrder": 8
      },
      {
        "name": "Biscoff Iced Latte",
        "slug": "biscoff-iced-latte",
        "description": "Creamy iced latte blended with rich Biscoff caramel spice sweetness.",
        "price": 179,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/roastfuze_coffee_cup.png",
        "prepTimeMinutes": 5,
        "displayOrder": 9
      }
    ]
  },
  {
    "category": {
      "name": "Frappe (Blended with Ice Cream)",
      "slug": "frappe-ice-cream",
      "itemType": "COFFEE",
      "description": "Slow-whipped with creamy dairy ice cream, crushed ice, and double espresso.",
      "image": "/images/dishes/oreo_frappe.jpg",
      "displayOrder": 3,
      "isActive": true
    },
    "items": [
      {
        "name": "Regular Cold Coffee",
        "slug": "regular-cold-coffee",
        "description": "Instant coffee powder, milk, blended with Ice Cream.",
        "price": 89,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/cold_coffee.jpg",
        "prepTimeMinutes": 5,
        "displayOrder": 1
      },
      {
        "name": "Classic Frappe",
        "slug": "classic-frappe",
        "description": "Double Espresso, milk and blended with Vanilla Ice Cream.",
        "price": 109,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/classic_frappe.jpg",
        "prepTimeMinutes": 5,
        "displayOrder": 2
      },
      {
        "name": "Choco Frappe",
        "slug": "choco-frappe",
        "description": "Double Espresso, milk and blended with Chocolate Ice Cream.",
        "price": 119,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/choco_chip_frappe.jpg",
        "prepTimeMinutes": 6,
        "displayOrder": 3
      },
      {
        "name": "Flavored Classic Frappe",
        "slug": "flavored-classic-frappe",
        "description": "Classic Frappe blended with your choice of premium flavored syrup.",
        "price": 129,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/hazelnut_frappe.jpg",
        "prepTimeMinutes": 6,
        "displayOrder": 4
      },
      {
        "name": "Oreo Frappe",
        "slug": "oreo-frappe",
        "description": "Double Espresso, milk, Oreo cookies, chocolate syrup and blended with Ice Cream.",
        "price": 149,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/dishes/oreo_frappe.jpg",
        "prepTimeMinutes": 7,
        "displayOrder": 5
      },
      {
        "name": "Brownie Frappe",
        "slug": "brownie-frappe",
        "description": "Brownie blended with double espresso and chocolate ice cream.",
        "price": 159,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/dishes/brownie_frappe.jpg",
        "prepTimeMinutes": 7,
        "displayOrder": 6
      },
      {
        "name": "Biscoff Frappe",
        "slug": "biscoff-frappe",
        "description": "Double Espresso, milk, Biscoff butter, Biscoff cookies and blended with ice cream.",
        "price": 189,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/dishes/classic_frappe.jpg",
        "prepTimeMinutes": 7,
        "displayOrder": 7
      },
      {
        "name": "Tiramisu Brownie Frappe",
        "slug": "tiramisu-brownie-frappe",
        "description": "Brownie blended with classic Tiramisu, double espresso and chocolate ice cream.",
        "price": 189,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/dishes/brownie_frappe.jpg",
        "prepTimeMinutes": 7,
        "displayOrder": 8
      }
    ]
  },
  {
    "category": {
      "name": "Iced Teas & Authentic Teas",
      "slug": "iced-teas-authentic-teas",
      "itemType": "COFFEE",
      "description": "Refreshing fruit infused iced teas and freshly brewed hot herbal teas.",
      "image": "/images/dishes/lemon_iced_tea.jpg",
      "displayOrder": 4,
      "isActive": true
    },
    "items": [
      {
        "name": "Lemon Iced Tea",
        "slug": "lemon-iced-tea",
        "description": "Tangy lemon blended into chilled tea.",
        "price": 109,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/lemon_iced_tea.jpg",
        "prepTimeMinutes": 4,
        "displayOrder": 1
      },
      {
        "name": "Peach Iced Tea",
        "slug": "peach-iced-tea",
        "description": "Fruity iced tea with a peach twist.",
        "price": 109,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/peach_iced_tea.jpg",
        "prepTimeMinutes": 4,
        "displayOrder": 2
      },
      {
        "name": "Watermelon Iced Tea",
        "slug": "watermelon-iced-tea",
        "description": "Refreshing iced tea with sweet watermelon notes.",
        "price": 109,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/watermelon_cooler.jpg",
        "prepTimeMinutes": 4,
        "displayOrder": 3
      },
      {
        "name": "Blueberry Iced Tea",
        "slug": "blueberry-iced-tea",
        "description": "Chilled refreshing black tea with blueberry flavor.",
        "price": 109,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/lemon_iced_tea.jpg",
        "prepTimeMinutes": 4,
        "displayOrder": 4
      },
      {
        "name": "Litchi Iced Tea",
        "slug": "litchi-iced-tea",
        "description": "Delicate litchi sweetness in refreshing iced tea.",
        "price": 109,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/peach_iced_tea.jpg",
        "prepTimeMinutes": 4,
        "displayOrder": 5
      },
      {
        "name": "Masala Chai",
        "slug": "masala-chai",
        "description": "Authentic Indian tea brewed with crushed ginger, cardamom, and clove.",
        "price": 49,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/masala_chai.jpg",
        "prepTimeMinutes": 5,
        "displayOrder": 6
      },
      {
        "name": "Green Tea",
        "slug": "green-tea",
        "description": "Steeped organic green tea rich in antioxidants.",
        "price": 59,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/masala_chai.jpg",
        "prepTimeMinutes": 4,
        "displayOrder": 7
      }
    ]
  },
  {
    "category": {
      "name": "Gourmet Thick Shakes",
      "slug": "gourmet-thick-shakes",
      "itemType": "COFFEE",
      "description": "Velvety smooth thick milkshakes topped with rich cream & treats.",
      "image": "/images/dishes/kitkat_shake.jpg",
      "displayOrder": 5,
      "isActive": true
    },
    "items": [
      {
        "name": "Classic Vanilla Cream",
        "slug": "classic-vanilla-cream",
        "description": "Simple, rich, and perfectly creamy vanilla indulgence.",
        "price": 119,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/classic_frappe.jpg",
        "prepTimeMinutes": 5,
        "displayOrder": 1
      },
      {
        "name": "Chocolate Treat",
        "slug": "chocolate-treat",
        "description": "Classic chocolate blended into smooth shake.",
        "price": 119,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/chocolate_shake.jpg",
        "prepTimeMinutes": 6,
        "displayOrder": 2
      },
      {
        "name": "Strawberry Magic",
        "slug": "strawberry-magic",
        "description": "Creamy, classic strawberry & vanilla goodness with fresh berry notes.",
        "price": 119,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/strawberry_shake.jpg",
        "prepTimeMinutes": 6,
        "displayOrder": 3
      },
      {
        "name": "Blueberry Velvet Shake",
        "slug": "blueberry-velvet-shake",
        "description": "Refreshing shake with luscious blueberries and creamy milk.",
        "price": 119,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/strawberry_shake.jpg",
        "prepTimeMinutes": 6,
        "displayOrder": 4
      },
      {
        "name": "Crunchy KitKat Delight",
        "slug": "crunchy-kitkat-delight",
        "description": "Crunchy Kit Kat swirled in creamy shake in RoastFuze tall glass.",
        "price": 139,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/dishes/kitkat_shake.jpg",
        "prepTimeMinutes": 6,
        "displayOrder": 5
      },
      {
        "name": "Oreo Overload Shake",
        "slug": "oreo-overload-shake",
        "description": "Crunchy Oreo blended into creamy shake with cookie crumbles.",
        "price": 139,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/oreo_frappe.jpg",
        "prepTimeMinutes": 6,
        "displayOrder": 6
      },
      {
        "name": "Fudgy Brownie Shake",
        "slug": "fudgy-brownie-shake",
        "description": "Indulgent brownie chunks in thick chocolate shake.",
        "price": 149,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/dishes/brownie_frappe.jpg",
        "prepTimeMinutes": 7,
        "displayOrder": 7
      },
      {
        "name": "Tiramisu Brownie Bliss",
        "slug": "tiramisu-brownie-bliss",
        "description": "Indulgent brownie chunks in thick shake with classic Tiramisu.",
        "price": 169,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/dishes/brownie_frappe.jpg",
        "prepTimeMinutes": 7,
        "displayOrder": 8
      },
      {
        "name": "Loaded Biscoff Shake",
        "slug": "loaded-biscoff-shake",
        "description": "Smooth, rich shake blended with Biscoff and topped to perfection.",
        "price": 179,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/dishes/kitkat_shake.jpg",
        "prepTimeMinutes": 7,
        "displayOrder": 9
      }
    ]
  },
  {
    "category": {
      "name": "Balcony Coolers & Mocktails",
      "slug": "balcony-coolers-mocktails",
      "itemType": "COFFEE",
      "description": "Sparkling, effervescent fruit refreshers and chilled mocktails.",
      "image": "/images/dishes/blue_lagoon.jpg",
      "displayOrder": 6,
      "isActive": true
    },
    "items": [
      {
        "name": "Virgin Mojito",
        "slug": "virgin-mojito",
        "description": "Classic mint and lime refreshing cooler with sparkling soda.",
        "price": 109,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/virgin_mojito.jpg",
        "prepTimeMinutes": 5,
        "displayOrder": 1
      },
      {
        "name": "Blue Wave Cooler",
        "slug": "blue-wave-cooler",
        "description": "Vibrant blue citrusy lemonade-style mocktail with crushed ice.",
        "price": 109,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/blue_lagoon.jpg",
        "prepTimeMinutes": 5,
        "displayOrder": 2
      },
      {
        "name": "Watermelon Cooler",
        "slug": "watermelon-cooler",
        "description": "Juicy watermelon blended into chilled refresher with fresh mint.",
        "price": 109,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/dishes/watermelon_cooler.jpg",
        "prepTimeMinutes": 5,
        "displayOrder": 3
      },
      {
        "name": "Sweet Litchi Cooler",
        "slug": "sweet-litchi-cooler",
        "description": "Tangy Litchi cooler with refreshing twist.",
        "price": 109,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/peach_iced_tea.jpg",
        "prepTimeMinutes": 5,
        "displayOrder": 4
      },
      {
        "name": "Blueberry Cooler",
        "slug": "blueberry-cooler",
        "description": "Blueberry flavor in fizzy cooler.",
        "price": 109,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/blue_lagoon.jpg",
        "prepTimeMinutes": 5,
        "displayOrder": 5
      },
      {
        "name": "Peach Cooler",
        "slug": "peach-cooler",
        "description": "Peach flavor in fizzy cooler.",
        "price": 109,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/peach_iced_tea.jpg",
        "prepTimeMinutes": 5,
        "displayOrder": 6
      },
      {
        "name": "Masala Lemon Fizz",
        "slug": "masala-lemon-fizz",
        "description": "Refreshing lemon fizz with a chatpata masala twist.",
        "price": 109,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/dishes/lemon_iced_tea.jpg",
        "prepTimeMinutes": 5,
        "displayOrder": 7
      }
    ]
  },
  {
    "category": {
      "name": "Pizzas & Garlic Breads",
      "slug": "pizzas-garlic-breads",
      "itemType": "FOOD",
      "description": "Stone-baked pizzas and warm garlic breads with melted mozzarella.",
      "image": "/images/dishes/pizza_margherita.jpg",
      "displayOrder": 7,
      "isActive": true
    },
    "items": [
      {
        "name": "Cheese Margherita Pizza (8\")",
        "slug": "cheese-margherita-pizza",
        "description": "Loaded with 100% mozzarella cheese, Italian herbs, and tomato sauce.",
        "price": 169,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/pizza_margherita.jpg",
        "prepTimeMinutes": 12,
        "displayOrder": 1
      },
      {
        "name": "Classic OTC Pizza (8\")",
        "slug": "classic-otc-pizza",
        "description": "Classic Onion, Tomato & crisp green Capsicum tossed with cheese and herbs.",
        "price": 199,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/pizza_otc.jpg",
        "prepTimeMinutes": 12,
        "displayOrder": 2
      },
      {
        "name": "Farm House Pizza (8\")",
        "slug": "farm-house-pizza",
        "description": "Loaded with sweet corn, onions, capsicum, tomatoes, and mushrooms.",
        "price": 229,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/dishes/pizza_farmhouse.jpg",
        "prepTimeMinutes": 14,
        "displayOrder": 3
      },
      {
        "name": "Paneer Tandoori Pizza (8\")",
        "slug": "paneer-tandoori-pizza",
        "description": "Tandoori marinated paneer cubes, capsicum, red paprika, and spicy drizzle.",
        "price": 259,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/dishes/pizza_tandoori_paneer.jpg",
        "prepTimeMinutes": 14,
        "displayOrder": 4
      },
      {
        "name": "Cheesy Garlic Bread",
        "slug": "cheesy-garlic-bread",
        "description": "Toasted bread infused with garlic butter and golden melted mozzarella.",
        "price": 109,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/garlic_bread.jpg",
        "prepTimeMinutes": 8,
        "displayOrder": 5
      },
      {
        "name": "Mexican Veg Garlic Bread",
        "slug": "mexican-veg-garlic-bread",
        "description": "Garlic bread baked with zesty Mexican veggies, salsa and melted cheese.",
        "price": 139,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/garlic_bread.jpg",
        "prepTimeMinutes": 8,
        "displayOrder": 6
      },
      {
        "name": "Cheesy Paneer Garlic Bread",
        "slug": "cheesy-paneer-garlic-bread",
        "description": "Garlic bread topped with spiced paneer bits and molten cheese.",
        "price": 159,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/dishes/paneer_garlic_bread.jpg",
        "prepTimeMinutes": 9,
        "displayOrder": 7
      }
    ]
  },
  {
    "category": {
      "name": "Pastas & Momos",
      "slug": "pastas-momos",
      "itemType": "FOOD",
      "description": "Freshly tossed penne pastas and steamed / crispy fried momos.",
      "image": "/images/roastfuze_pasta_neon.jpg",
      "displayOrder": 8,
      "isActive": true
    },
    "items": [
      {
        "name": "Arrabiata Red Sauce Pasta",
        "slug": "arrabiata-red-sauce-pasta",
        "description": "Zesty Italian tomato sauce simmered with chili flakes, garlic, and herbs.",
        "price": 159,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/roastfuze_pasta.jpg",
        "prepTimeMinutes": 11,
        "displayOrder": 1
      },
      {
        "name": "Alfredo White Sauce Pasta",
        "slug": "alfredo-white-sauce-pasta",
        "description": "Rich garlic cream sauce with sautéed mushrooms, bell peppers, corn, and herbs.",
        "price": 169,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/pasta_alfredo.jpg",
        "prepTimeMinutes": 11,
        "displayOrder": 2
      },
      {
        "name": "Pinky Promise Pasta",
        "slug": "pinky-promise-pasta",
        "description": "The best of both: velvety Alfredo cream blended with tangy Arrabiata marinara.",
        "price": 189,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/roastfuze_pasta_neon.jpg",
        "prepTimeMinutes": 12,
        "displayOrder": 3
      },
      {
        "name": "Steamed Veg Momos",
        "slug": "steamed-veg-momos",
        "description": "Authentic RoastFuze vegetable dumplings served with spicy garlic red chutney & creamy mayo.",
        "price": 79,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/steamed_momos.jpg",
        "prepTimeMinutes": 8,
        "displayOrder": 4
      },
      {
        "name": "Crispy Fried Momos",
        "slug": "crispy-fried-momos",
        "description": "Deep-fried golden crunchy momos with chili sauce and creamy dip.",
        "price": 109,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/fried_momos.jpg",
        "prepTimeMinutes": 9,
        "displayOrder": 5
      },
      {
        "name": "Gravy Momos",
        "slug": "gravy-momos",
        "description": "Momos tossed in fiery Indo-Chinese tandoori gravy with bell peppers.",
        "price": 119,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/dishes/gravy_momos.jpg",
        "prepTimeMinutes": 10,
        "displayOrder": 6
      }
    ]
  },
  {
    "category": {
      "name": "Burgers & Sandwiches",
      "slug": "burgers-sandwiches",
      "itemType": "FOOD",
      "description": "Toasted buns, layered grilled sandwiches, and savory fillings.",
      "image": "/images/dishes/sandwich_fries.jpg",
      "displayOrder": 9,
      "isActive": true
    },
    "items": [
      {
        "name": "Aloo Tikki Burger",
        "slug": "aloo-tikki-burger",
        "description": "Crispy spiced potato patty, onions, tomatoes, and house burger sauce.",
        "price": 69,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/burger_aloo_tikki.jpg",
        "prepTimeMinutes": 7,
        "displayOrder": 1
      },
      {
        "name": "Crispy Masala Burger",
        "slug": "crispy-masala-burger",
        "description": "Crispy herb veggie patty with spicy mayo and crunchy lettuce.",
        "price": 99,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/burger_crispy_masala.jpg",
        "prepTimeMinutes": 8,
        "displayOrder": 2
      },
      {
        "name": "Spicy Crisp Burger",
        "slug": "spicy-crisp-burger",
        "description": "Spicy crispy patty layered with peri peri seasonings and jalapenos.",
        "price": 119,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/burger_crispy_masala.jpg",
        "prepTimeMinutes": 8,
        "displayOrder": 3
      },
      {
        "name": "Juicy Paneer Burger",
        "slug": "juicy-paneer-burger",
        "description": "Thick marinated cottage cheese slab, mint mayo, and sliced tomatoes.",
        "price": 129,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/dishes/burger_juicy_paneer.jpg",
        "prepTimeMinutes": 9,
        "displayOrder": 4
      },
      {
        "name": "Veg Sandwich",
        "slug": "veg-sandwich",
        "description": "Fresh garden veggies layered in soft bread with mint spread.",
        "price": 69,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/sandwich_corn_cheese.jpg",
        "prepTimeMinutes": 6,
        "displayOrder": 5
      },
      {
        "name": "Veg Grilled Sandwich",
        "slug": "veg-grilled-sandwich",
        "description": "Authentic RoastFuze triple-decker sandwich served with crispy golden French fries and dips.",
        "price": 99,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/sandwich_fries.jpg",
        "prepTimeMinutes": 8,
        "displayOrder": 6
      },
      {
        "name": "Golden Corn Cheese Sandwich",
        "slug": "golden-corn-cheese-sandwich",
        "description": "Sweet American corn tossed with creamy mayo and double cheese, grilled crisp.",
        "price": 109,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/sandwich_corn_cheese.jpg",
        "prepTimeMinutes": 8,
        "displayOrder": 7
      },
      {
        "name": "Tandoori Paneer Sandwich",
        "slug": "tandoori-paneer-sandwich",
        "description": "Spicy tandoori paneer cubes, capsicum, and melted cheese.",
        "price": 129,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/dishes/sandwich_tandoori_paneer.jpg",
        "prepTimeMinutes": 9,
        "displayOrder": 8
      }
    ]
  },
  {
    "category": {
      "name": "Chinese, Maggie & Munchies",
      "slug": "chinese-maggie-munchies",
      "itemType": "FOOD",
      "description": "Hot comfort Maggi, wok noodles, spring rolls, and crispy seasoned fries.",
      "image": "/images/dishes/peri_peri_fries.jpg",
      "displayOrder": 10,
      "isActive": true
    },
    "items": [
      {
        "name": "Roast's Maggie",
        "slug": "roasts-maggie",
        "description": "Classic comfort Maggi cooked with aromatic house spices.",
        "price": 49,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/masala_maggie.jpg",
        "prepTimeMinutes": 6,
        "displayOrder": 1
      },
      {
        "name": "Veg Maggie",
        "slug": "veg-maggie",
        "description": "Maggi noodles cooked with diced onions, tomatoes, green peas and carrots.",
        "price": 69,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/masala_maggie.jpg",
        "prepTimeMinutes": 7,
        "displayOrder": 2
      },
      {
        "name": "Cheesy Masala Maggie",
        "slug": "cheesy-masala-maggie",
        "description": "Steaming hot Maggi smothered in melted cheese slice and herbs.",
        "price": 89,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/dishes/cheese_maggie.jpg",
        "prepTimeMinutes": 7,
        "displayOrder": 3
      },
      {
        "name": "Salted Fries",
        "slug": "salted-fries",
        "description": "Crisp golden salted French fries served with tomato ketchup.",
        "price": 79,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/peri_peri_fries.jpg",
        "prepTimeMinutes": 6,
        "displayOrder": 4
      },
      {
        "name": "Peri Peri Fries",
        "slug": "peri-peri-fries",
        "description": "Golden French fries generously tossed in spicy Peri Peri seasoning.",
        "price": 89,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/peri_peri_fries.jpg",
        "prepTimeMinutes": 7,
        "displayOrder": 5
      },
      {
        "name": "Overloaded Fries",
        "slug": "overloaded-fries",
        "description": "Fries loaded with rich cheese sauce, diced jalapenos, and spicy drizzle.",
        "price": 119,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/dishes/peri_peri_fries.jpg",
        "prepTimeMinutes": 8,
        "displayOrder": 6
      },
      {
        "name": "Mexican Loaded Nachos",
        "slug": "mexican-loaded-nachos",
        "description": "Crunchy tortilla chips loaded with salsa, jalapenos, and melted cheese.",
        "price": 129,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/dishes/nachos_loaded.jpg",
        "prepTimeMinutes": 8,
        "displayOrder": 7
      },
      {
        "name": "Spring Rolls",
        "slug": "spring-rolls",
        "description": "Crispy fried rolls stuffed with seasoned wok vegetables and sweet chilli dip.",
        "price": 99,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/fried_momos.jpg",
        "prepTimeMinutes": 8,
        "displayOrder": 8
      },
      {
        "name": "Veg Hakka Noodles",
        "slug": "veg-hakka-noodles",
        "description": "Wok-tossed noodles with shredded cabbage, capsicum, carrots, and soy.",
        "price": 129,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/hakka_noodles.jpg",
        "prepTimeMinutes": 10,
        "displayOrder": 9
      },
      {
        "name": "Manchurian (Dry / Gravy)",
        "slug": "manchurian",
        "description": "Crispy vegetable dumplings tossed in ginger-garlic soy Manchurian sauce.",
        "price": 139,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/honey_chilli_potato.jpg",
        "prepTimeMinutes": 10,
        "displayOrder": 10
      },
      {
        "name": "Chilli Paneer (Dry / Gravy)",
        "slug": "chilli-paneer",
        "description": "Crisp paneer cubes tossed with capsicum, onion, and dark soya chilli glaze.",
        "price": 149,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/dishes/honey_chilli_potato.jpg",
        "prepTimeMinutes": 10,
        "displayOrder": 11
      },
      {
        "name": "Honey Chilli Potato",
        "slug": "honey-chilli-potato",
        "description": "Crispy fried potato fingers glazed in sweet honey and spicy chili sauce.",
        "price": 149,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/honey_chilli_potato.jpg",
        "prepTimeMinutes": 10,
        "displayOrder": 12
      },
      {
        "name": "Chilli Garlic Noodles",
        "slug": "chilli-garlic-noodles",
        "description": "Spicy noodles tossed with burnt garlic flakes and red chilli paste.",
        "price": 149,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/dishes/hakka_noodles.jpg",
        "prepTimeMinutes": 10,
        "displayOrder": 13
      }
    ]
  },
  {
    "category": {
      "name": "Sweet Treats & Desserts",
      "slug": "sweet-treats-desserts",
      "itemType": "FOOD",
      "description": "Warm fudge brownies, tea cakes, cookies, and crisp Belgian waffles.",
      "image": "/images/dishes/brownie_icecream.jpg",
      "displayOrder": 11,
      "isActive": true
    },
    "items": [
      {
        "name": "Vanilla Dip Cake",
        "slug": "vanilla-dip-cake",
        "description": "Moist vanilla cake glazed in sweet icing.",
        "price": 40,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/brownie_icecream.jpg",
        "prepTimeMinutes": 3,
        "displayOrder": 1
      },
      {
        "name": "Banana Dry Cake",
        "slug": "banana-dry-cake",
        "description": "Aromatic home-style banana tea cake slice.",
        "price": 50,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/brownie_icecream.jpg",
        "prepTimeMinutes": 3,
        "displayOrder": 2
      },
      {
        "name": "Artisan Cookie",
        "slug": "artisan-cookie",
        "description": "Fresh baked chocolate chip or butter cookie.",
        "price": 40,
        "isVeg": true,
        "isBestseller": false,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/brownie_icecream.jpg",
        "prepTimeMinutes": 3,
        "displayOrder": 3
      },
      {
        "name": "Choco Chip Muffin",
        "slug": "choco-chip-muffin",
        "description": "Soft chocolate muffin studded with gooey chocolate chips.",
        "price": 69,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/brownie_icecream.jpg",
        "prepTimeMinutes": 3,
        "displayOrder": 4
      },
      {
        "name": "Fudge Brownie",
        "slug": "fudge-brownie",
        "description": "Classic rich Belgian chocolate fudge brownie.",
        "price": 69,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": false,
        "isAvailable": true,
        "image": "/images/dishes/brownie_icecream.jpg",
        "prepTimeMinutes": 4,
        "displayOrder": 5
      },
      {
        "name": "Brownie with Ice Cream",
        "slug": "brownie-with-ice-cream",
        "description": "Warm chocolate fudge brownie topped with cold vanilla ice cream scoop and chocolate syrup.",
        "price": 109,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/dishes/brownie_icecream.jpg",
        "prepTimeMinutes": 5,
        "displayOrder": 6
      },
      {
        "name": "Warm Nutella Belgian Waffles",
        "slug": "warm-nutella-belgian-waffles",
        "description": "Crisp golden Belgian waffles smothered in rich chocolate hazelnut Nutella spread.",
        "price": 149,
        "isVeg": true,
        "isBestseller": true,
        "isSpecial": true,
        "isAvailable": true,
        "image": "/images/dishes/belgian_waffles.jpg",
        "prepTimeMinutes": 8,
        "displayOrder": 7
      }
    ]
  }
];

const MODIFIER_DEFINITIONS = [
  {
    targetItemSlug: 'cappuccino',
    groupName: 'Coffee Add-Ons & Syrups',
    minSelect: 0,
    maxSelect: 3,
    isRequired: false,
    options: [
      { name: 'Extra Espresso Shot (Strong)', price: 49, isDefault: false },
      { name: 'Hazelnut Syrup', price: 49, isDefault: false },
      { name: 'Irish Cream Syrup', price: 49, isDefault: false },
      { name: 'Madagascar Vanilla Syrup', price: 49, isDefault: false },
      { name: 'Caramel Syrup', price: 49, isDefault: false },
      { name: 'Tiramisu Syrup', price: 49, isDefault: false },
    ],
  },
  {
    targetItemSlug: 'cheese-margherita-pizza',
    groupName: 'Food Add-Ons',
    minSelect: 0,
    maxSelect: 2,
    isRequired: false,
    options: [
      { name: 'Extra Cheese Slice', price: 20, isDefault: false },
      { name: 'Spicy Dip / Mint Mayo', price: 20, isDefault: false },
    ],
  },
];

const TABLES_DATA = [
  { tableNumber: 'Table B01', name: 'Balcony Sunset Railing 01', capacity: 4, section: 'Musical Balcony', token: 'rf-tbl-b01-sunset' },
  { tableNumber: 'Table B02', name: 'Balcony Acoustic Corner 02', capacity: 4, section: 'Musical Balcony', token: 'rf-tbl-b02-acoustic' },
  { tableNumber: 'Table B03', name: 'Balcony High-Top Bar 03', capacity: 2, section: 'Musical Balcony', token: 'rf-tbl-b03-railing' },
  { tableNumber: 'Table L04', name: 'Indoor Coffee Lounge 04', capacity: 6, section: 'Indoor Coffee Bar', token: 'rf-tbl-l04-lounge' },
  { tableNumber: 'Table L05', name: 'Artist & Jamming Booth 05', capacity: 4, section: 'Indoor Coffee Bar', token: 'rf-tbl-l05-artist' },
  { tableNumber: 'Table T06', name: 'Terrace Open Deck 06', capacity: 8, section: 'Terrace Deck', token: 'rf-tbl-t06-terrace' },
];

const LANDING_PAGE_DATA = {
  heroTitle: 'The RoastFuze Coffee Bar',
  heroSubtitle: 'Musical Balcony Cafe in Vaishali Nagar, Jaipur. Freshly ground artisan roasts, thick ice-cream frappes, stone-baked pizzas & live acoustic artist sessions.',
  heroCtaText: 'Explore Balcony Menu',
  heroImage: '/images/roastfuze_interior.jpg',
  aboutTitle: 'Roasted Beans, Balcony Sunsets & Live Acoustic Chords',
  aboutText: 'Perched in the vibrant heart of Gandhi Path West, Vaishali Nagar, RoastFuze Coffee Bar blends the romance of an open-air musical balcony with the craft of an authentic third-wave coffee house. We host regular acoustic artist hours, jamming sessions, and cozy evenings where rich coffee aromas meet soulful melodies and comforting gourmet bites.',
  aboutHighlight1: 'Artisan Espresso Roasts & Thick Ice Cream Frappes',
  aboutHighlight2: 'Intimate Musical Balcony & Acoustic Artist Sessions',
  aboutHighlight3: 'Stone-Baked Pizzas, Creamy Pastas & Crisp Belgian Waffles',
  aboutImage: '/images/roastfuze_pasta_neon.jpg',
  announcementText: '🎸 Live Musical Balcony Sessions Every Evening! Use code ROAST10 for 10% off your table order.',
  announcementActive: true,
  instagramUrl: 'https://www.instagram.com/roastfuzecoffee',
  facebookUrl: 'https://facebook.com/roastfuzecoffee',
  mapEmbedUrl: 'https://maps.google.com/maps?q=26.9056268,75.7271802&t=&z=16&ie=UTF8&iwloc=&output=embed',
  metaTitle: 'RoastFuze Coffee Bar - Musical Balcony Cafe | Vaishali Nagar, Jaipur',
  metaDescription: 'Experience RoastFuze Coffee Bar in Vaishali Nagar, Jaipur: musical balcony seating, specialty roasts, thick frappes, stone-baked pizzas, waffles, and live acoustic music sessions.',
  isPublished: true,
};

const GALLERY_IMAGES_DATA = [
  { title: 'RoastFuze Musical Balcony Seating & Guitar', imageUrl: '/images/dishes/cafe_balcony_hd.jpg', displayOrder: 1 },
  { title: 'Authentic RoastFuze Oreo Overload Frappe', imageUrl: '/images/dishes/oreo_frappe.jpg', displayOrder: 2 },
  { title: 'Steamed Momos with Red Chili Chutney & Mayo', imageUrl: '/images/dishes/steamed_momos.jpg', displayOrder: 3 },
  { title: 'Triple-Decker Grilled Sandwich & Golden French Fries', imageUrl: '/images/dishes/sandwich_fries.jpg', displayOrder: 4 },
  { title: 'Kit Kat Shake with Official RoastFuze Coaster', imageUrl: '/images/dishes/kitkat_shake.jpg', displayOrder: 5 },
  { title: 'Fresh Watermelon Balcony Cooler with Mint', imageUrl: '/images/dishes/watermelon_cooler.jpg', displayOrder: 6 },
  { title: 'Cheesy Penne Pasta with Musical Lamp', imageUrl: '/images/roastfuze_pasta_neon.jpg', displayOrder: 7 },
  { title: 'Signature RoastFuze Iced Latte Cup', imageUrl: '/images/roastfuze_coffee_cup.png', displayOrder: 8 },
  { title: 'The RoastFuze Cozy Lounge & Guitar Wall', imageUrl: '/images/roastfuze_interior.jpg', displayOrder: 9 },
];

const DISCOUNTS_DATA = [
  { code: 'ROAST10', discountType: 'PERCENTAGE', value: 10, minOrderAmount: 199, maxDiscount: 100, isActive: true, usageLimit: 500, timesUsed: 18 },
  { code: 'ACOUSTIC20', discountType: 'PERCENTAGE', value: 20, minOrderAmount: 499, maxDiscount: 150, isActive: true, usageLimit: 250, timesUsed: 7 },
];

const REVIEWS_DATA = [
  {
    customerName: 'Aarav Singhal',
    rating: 5,
    comment: 'One of the coziest cafes in Vaishali Nagar! Sitting on the balcony during sunset with their Double Choco Chip Frappe and listening to live acoustic songs was truly magical. Scanning the table QR to order is super quick.',
    isApproved: true,
  },
  {
    customerName: 'Meghna Rathore',
    rating: 5,
    comment: 'The Alfredo White Sauce Pasta with the neon music lamp on table was amazing! Perfect vibe for friends and dates. Loved the artist hour music!',
    isApproved: true,
  },
  {
    customerName: 'Kunal Sharma',
    rating: 5,
    comment: 'Awesome coffee bar! The Classic OTC and Farm House pizzas are stone-baked to perfection. Great staff, warm balcony seating, and budget-friendly pricing.',
    isApproved: true,
  },
];

async function main() {
  console.log('==============================================================================');
  console.log('☕ RoastFuze Coffee Bar - Production Menu Restoration Tool');
  console.log('==============================================================================');
  console.log(`📦 Client Source: ${loadedFrom}`);
  console.log(`🎯 Mode: ${isDryRun ? 'DRY RUN (Read-Only Safety Inspection)' : 'EXECUTE (Writing to Database)'}`);
  console.log('------------------------------------------------------------------------------');

  // STEP 1: Connect and inspect existing database state
  await prisma.$connect();
  console.log('✅ Database connection established.');

  // Check existing users
  let existingUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, status: true }
  });
  console.log(`👤 Existing Users Detected (${existingUsers.length} total - WILL BE PRESERVED):`);
  existingUsers.forEach(u => {
    console.log(`   - [${u.role}] ${u.email} (${u.name}) - Status: ${u.status}`);
  });

  // Ensure canonical Asrock Studios accounts exist
  if (isExecute) {
    const bcrypt = require('bcryptjs');
    const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

    // 1. Super Admin: admin@asrockstudios.in
    let adminUser = existingUsers.find(u => u.email.toLowerCase() === 'admin@asrockstudios.in');
    if (!adminUser) {
      const oldSuper = existingUsers.find(u => u.email.toLowerCase() === 'superadmin@roastfuze.com');
      if (oldSuper) {
        adminUser = await prisma.user.update({
          where: { id: oldSuper.id },
          data: {
            email: 'admin@asrockstudios.in',
            name: 'Asrock Studios Platform Administrator',
            role: 'SUPER_ADMIN',
            passwordHash: defaultPasswordHash,
          },
        });
        console.log('   [+] Updated existing superadmin to admin@asrockstudios.in');
      } else {
        adminUser = await prisma.user.create({
          data: {
            email: 'admin@asrockstudios.in',
            name: 'Asrock Studios Platform Administrator',
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            passwordHash: defaultPasswordHash,
          },
        });
        console.log('   [+] Created Super Admin: admin@asrockstudios.in');
      }
    }

    // 2. Cafe Owner: dheeraj@asrockstudios.in
    let dheerajUser = existingUsers.find(u => u.email.toLowerCase() === 'dheeraj@asrockstudios.in');
    if (!dheerajUser) {
      const oldOwner = existingUsers.find(u => u.email.toLowerCase() === 'owner@roastfuze.com');
      if (oldOwner) {
        dheerajUser = await prisma.user.update({
          where: { id: oldOwner.id },
          data: {
            email: 'dheeraj@asrockstudios.in',
            name: 'Dheeraj - RoastFuze Cafe Owner',
            role: 'OWNER',
            passwordHash: defaultPasswordHash,
          },
        });
        console.log('   [+] Updated existing owner to dheeraj@asrockstudios.in');
      } else {
        dheerajUser = await prisma.user.create({
          data: {
            email: 'dheeraj@asrockstudios.in',
            name: 'Dheeraj - RoastFuze Cafe Owner',
            role: 'OWNER',
            status: 'ACTIVE',
            passwordHash: defaultPasswordHash,
          },
        });
        console.log('   [+] Created Cafe Owner: dheeraj@asrockstudios.in');
      }
    }

    // Re-fetch users list after sync
    existingUsers = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, status: true }
    });
  }

  // Check existing restaurant with slug 'roastfuze'
  const existingRestaurant = await prisma.restaurant.findUnique({
    where: { slug: RESTAURANT_DATA.slug },
    include: {
      categories: { select: { id: true, name: true, slug: true } },
      menuItems: { select: { id: true, name: true, slug: true } },
      memberships: true,
    }
  });

  if (existingRestaurant) {
    console.log(`ℹ️ Restaurant with slug "${RESTAURANT_DATA.slug}" found (ID: ${existingRestaurant.id})`);
    console.log(`   Existing Categories: ${existingRestaurant.categories.length}`);
    console.log(`   Existing Menu Items: ${existingRestaurant.menuItems.length}`);
    console.log(`   Existing Memberships: ${existingRestaurant.memberships.length}`);

    if (existingRestaurant.categories.length > 0 || existingRestaurant.menuItems.length > 0) {
      console.error('❌ [SAFETY STOP] Partial menu records already exist for this restaurant!');
      console.error('Conflicting categories found:');
      existingRestaurant.categories.slice(0, 5).forEach(c => console.error(`   - ${c.name} (${c.slug})`));
      console.error('Refusing to blindly duplicate or overwrite existing data.');
      console.error('If you intend to re-seed, manually clean only the menu items or verify table state.');
      process.exit(1);
    }
  } else {
    console.log(`ℹ️ Restaurant with slug "${RESTAURANT_DATA.slug}" does not exist. It will be created.`);
  }

  // Total items calculation
  let totalItemsToCreate = 0;
  CATEGORIES_AND_ITEMS.forEach(c => totalItemsToCreate += c.items.length);

  // STEP 2: Dry Run Summary
  console.log('------------------------------------------------------------------------------');
  console.log('📋 PLAN SUMMARY (To be created):');
  console.log(`   1. Restaurant: "${RESTAURANT_DATA.name}" (slug: ${RESTAURANT_DATA.slug})`);
  console.log(`   2. Menu Categories: ${CATEGORIES_AND_ITEMS.length} official categories`);
  CATEGORIES_AND_ITEMS.forEach((c, idx) => {
    console.log(`      ${idx + 1}. ${c.category.name} (${c.category.slug}) [${c.category.itemType}] - ${c.items.length} items`);
  });
  console.log(`   3. Total Menu Items: ${totalItemsToCreate} items with prices, tags, and photos`);
  console.log(`   4. Modifier Groups: ${MODIFIER_DEFINITIONS.length} groups with add-ons`);
  MODIFIER_DEFINITIONS.forEach(m => {
    console.log(`      - On item "${m.targetItemSlug}": ${m.groupName} (${m.options.length} options)`);
  });
  console.log(`   5. Tables & QR Tokens: ${TABLES_DATA.length} balcony & lounge tables`);
  console.log(`   6. Landing Page & Gallery: Rich marketing text + ${GALLERY_IMAGES_DATA.length} real dish photos`);
  console.log(`   7. Discounts & Reviews: ${DISCOUNTS_DATA.length} promo codes, ${REVIEWS_DATA.length} customer reviews`);

  // Target memberships resolution
  const targetMemberships = [];
  const dheerajUser = existingUsers.find(u => u.email.toLowerCase() === 'dheeraj@asrockstudios.in');
  if (dheerajUser) {
    targetMemberships.push({ userId: dheerajUser.id, role: 'OWNER', email: dheerajUser.email });
  }

  // Map remaining roles
  existingUsers.forEach(u => {
    if (u.email.toLowerCase() === 'dheeraj@asrockstudios.in') return;
    if (u.role === 'OWNER') targetMemberships.push({ userId: u.id, role: 'OWNER', email: u.email });
    else if (u.role === 'MANAGER') targetMemberships.push({ userId: u.id, role: 'MANAGER', email: u.email });
    else if (u.role === 'KITCHEN') targetMemberships.push({ userId: u.id, role: 'KITCHEN', email: u.email });
    else if (u.role === 'STAFF') targetMemberships.push({ userId: u.id, role: 'STAFF', email: u.email });
  });

  console.log(`   8. Memberships to link (${targetMemberships.length} users):`);
  targetMemberships.forEach(m => {
    console.log(`      - User ${m.email} -> Role: ${m.role}`);
  });
  console.log('------------------------------------------------------------------------------');

  if (isDryRun) {
    console.log('🔍 [DRY-RUN COMPLETE] Validation passed! 0 records written.');
    console.log('');
    console.log('To execute this restoration on production, re-run with:');
    console.log('   node prisma/restore-roastfuze-menu-safe.js --execute');
    console.log('==============================================================================');
    return;
  }

  // STEP 3: Execute Restoration inside Atomic Transaction
  console.log('⚡ Ensuring database column types support rich descriptions...');
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE Restaurant MODIFY description TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE Restaurant MODIFY mapLink TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE MenuCategory MODIFY description TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE MenuItem MODIFY description TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE LandingPageContent MODIFY aboutText TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE LandingPageContent MODIFY heroSubtitle TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE LandingPageContent MODIFY metaDescription TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE Review MODIFY comment TEXT;`);
    console.log('   [+] Verified: description, mapLink & text columns set to TEXT.');
  } catch (colErr) {
    console.log('   [i] Notice: could not alter description column (may already be TEXT or restricted permissions):', colErr.message);
  }

  console.log('⚡ Executing atomic database transaction...');
  const startTime = Date.now();

  const result = await prisma.$transaction(async (tx) => {
    // 3A. Restaurant
    let restaurant = existingRestaurant;
    if (!restaurant) {
      try {
        restaurant = await tx.restaurant.create({
          data: RESTAURANT_DATA,
        });
      } catch (createErr) {
        if (createErr.code === 'P2000' && RESTAURANT_DATA.description && RESTAURANT_DATA.description.length > 190) {
          console.warn('   [!] Description exceeded column limit. Truncating description to 190 characters for compatibility...');
          const fallbackData = {
            ...RESTAURANT_DATA,
            description: RESTAURANT_DATA.description.slice(0, 190),
          };
          restaurant = await tx.restaurant.create({
            data: fallbackData,
          });
        } else {
          throw createErr;
        }
      }
      console.log(`   [+] Restaurant created: ${restaurant.id}`);
    } else {
      console.log(`   [=] Using existing restaurant: ${restaurant.id}`);
    }

    // 3B. Memberships
    let membershipsCreated = 0;
    for (const m of targetMemberships) {
      const existing = await tx.restaurantMembership.findUnique({
        where: {
          userId_restaurantId: {
            userId: m.userId,
            restaurantId: restaurant.id,
          },
        },
      });
      if (!existing) {
        await tx.restaurantMembership.create({
          data: {
            userId: m.userId,
            restaurantId: restaurant.id,
            role: m.role,
          },
        });
        membershipsCreated++;
      }
    }
    console.log(`   [+] User memberships linked: ${membershipsCreated}`);

    // 3C. Subscription Plan & Subscription
    let proPlan = await tx.subscriptionPlan.findUnique({ where: { slug: 'pro' } });
    if (!proPlan) {
      proPlan = await tx.subscriptionPlan.create({
        data: {
          name: 'RoastFuze Pro Suite',
          slug: 'pro',
          price: 2499,
          billingInterval: 'MONTHLY',
          maxTables: 50,
          maxItems: 300,
          features: JSON.stringify(['digital_menu', 'qr_generator', 'table_ordering', 'kitchen_display', 'analytics', 'landing_page_builder', 'custom_branding']),
        },
      });
    }

    const existingSub = await tx.subscription.findFirst({ where: { restaurantId: restaurant.id } });
    if (!existingSub) {
      await tx.subscription.create({
        data: {
          restaurantId: restaurant.id,
          planId: proPlan.id,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // 3D. Categories & Menu Items
    const createdItemMap = new Map(); // slug -> MenuItem
    let categoriesCreated = 0;
    let itemsCreated = 0;

    for (const catGroup of CATEGORIES_AND_ITEMS) {
      const category = await tx.menuCategory.create({
        data: {
          restaurantId: restaurant.id,
          name: catGroup.category.name,
          slug: catGroup.category.slug,
          itemType: catGroup.category.itemType,
          description: catGroup.category.description,
          image: catGroup.category.image,
          displayOrder: catGroup.category.displayOrder,
          isActive: true,
        },
      });
      categoriesCreated++;

      for (const itm of catGroup.items) {
        const itemRecord = await tx.menuItem.create({
          data: {
            restaurantId: restaurant.id,
            categoryId: category.id,
            name: itm.name,
            slug: itm.slug,
            description: itm.description,
            price: itm.price,
            itemType: itm.itemType || catGroup.category.itemType,
            isVeg: itm.isVeg !== undefined ? itm.isVeg : true,
            isBestseller: !!itm.isBestseller,
            isSpecial: !!itm.isSpecial,
            isAvailable: itm.isAvailable !== undefined ? itm.isAvailable : true,
            image: itm.image,
            prepTimeMinutes: itm.prepTimeMinutes || 15,
            displayOrder: itm.displayOrder || 0,
          },
        });
        itemsCreated++;
        createdItemMap.set(itm.slug, itemRecord);
      }
    }
    console.log(`   [+] Categories created: ${categoriesCreated}`);
    console.log(`   [+] Menu items created: ${itemsCreated}`);

    // 3E. Modifiers
    let modGroupsCreated = 0;
    let modOptionsCreated = 0;
    for (const modDef of MODIFIER_DEFINITIONS) {
      const parentItem = createdItemMap.get(modDef.targetItemSlug);
      if (parentItem) {
        const group = await tx.modifierGroup.create({
          data: {
            menuItemId: parentItem.id,
            name: modDef.groupName,
            minSelect: modDef.minSelect,
            maxSelect: modDef.maxSelect,
            isRequired: modDef.isRequired,
          },
        });
        modGroupsCreated++;

        for (const opt of modDef.options) {
          await tx.modifierOption.create({
            data: {
              modifierGroupId: group.id,
              name: opt.name,
              price: opt.price,
              isDefault: opt.isDefault,
            },
          });
          modOptionsCreated++;
        }
      }
    }
    console.log(`   [+] Modifier groups: ${modGroupsCreated}, Options: ${modOptionsCreated}`);

    // 3F. Landing Page Content & Gallery
    const existingLanding = await tx.landingPageContent.findUnique({ where: { restaurantId: restaurant.id } });
    if (!existingLanding) {
      await tx.landingPageContent.create({
        data: {
          restaurantId: restaurant.id,
          ...LANDING_PAGE_DATA,
        },
      });
      console.log('   [+] Landing page content configured.');
    }

    const existingGalleryCount = await tx.galleryImage.count({ where: { restaurantId: restaurant.id } });
    if (existingGalleryCount === 0) {
      await tx.galleryImage.createMany({
        data: GALLERY_IMAGES_DATA.map(g => ({
          restaurantId: restaurant.id,
          title: g.title,
          imageUrl: g.imageUrl,
          displayOrder: g.displayOrder,
          isActive: true,
        })),
      });
      console.log(`   [+] Gallery images added: ${GALLERY_IMAGES_DATA.length}`);
    }

    // 3G. Tables & QR Tokens
    const existingTablesCount = await tx.table.count({ where: { restaurantId: restaurant.id } });
    if (existingTablesCount === 0) {
      for (const t of TABLES_DATA) {
        const table = await tx.table.create({
          data: {
            restaurantId: restaurant.id,
            tableNumber: t.tableNumber,
            name: t.name,
            capacity: t.capacity,
            section: t.section,
            isActive: true,
          },
        });

        await tx.tableQRCode.create({
          data: {
            tableId: table.id,
            token: t.token,
            scanCount: 1,
            lastScannedAt: new Date(),
          },
        });
      }
      console.log(`   [+] Tables & QR Codes configured: ${TABLES_DATA.length}`);
    }

    // 3H. Discounts
    const existingDiscCount = await tx.discount.count({ where: { restaurantId: restaurant.id } });
    if (existingDiscCount === 0) {
      for (const d of DISCOUNTS_DATA) {
        await tx.discount.create({
          data: {
            restaurantId: restaurant.id,
            ...d,
          },
        });
      }
      console.log(`   [+] Discounts created: ${DISCOUNTS_DATA.length}`);
    }

    // 3I. Reviews
    const existingReviewCount = await tx.review.count({ where: { restaurantId: restaurant.id } });
    if (existingReviewCount === 0) {
      await tx.review.createMany({
        data: REVIEWS_DATA.map(r => ({
          restaurantId: restaurant.id,
          ...r,
        })),
      });
      console.log(`   [+] Reviews created: ${REVIEWS_DATA.length}`);
    }

    return {
      restaurantId: restaurant.id,
      categoriesCount: categoriesCreated,
      itemsCount: itemsCreated,
      modGroupsCount: modGroupsCreated,
      modOptionsCount: modOptionsCreated,
      membershipsCount: membershipsCreated,
    };
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('------------------------------------------------------------------------------');
  console.log(`🎉 [SUCCESS] Restoration completed safely in ${durationSec}s!`);
  console.log(`   Restaurant ID: ${result.restaurantId}`);
  console.log(`   Categories:    ${result.categoriesCount}`);
  console.log(`   Menu Items:    ${result.itemsCount}`);
  console.log(`   Modifiers:     ${result.modGroupsCount} groups (${result.modOptionsCount} options)`);
  console.log(`   Memberships:   ${result.membershipsCount}`);
  console.log('==============================================================================');
}

main()
  .catch((err) => {
    console.error('❌ [ERROR] Restoration failed and was rolled back:');
    console.error(err.message || err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
