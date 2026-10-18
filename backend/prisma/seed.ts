import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Switea Nature Cafe database seeding...');

  // Clean existing data in reverse order of relationships
  await prisma.orderItemModifier.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.discountRedemption.deleteMany();
  await prisma.order.deleteMany();
  await prisma.diningSession.deleteMany();
  await prisma.qRScanEvent.deleteMany();
  await prisma.tableQRCode.deleteMany();
  await prisma.table.deleteMany();
  await prisma.modifierOption.deleteMany();
  await prisma.modifierGroup.deleteMany();
  await prisma.itemVariant.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.galleryImage.deleteMany();
  await prisma.landingPageContent.deleteMany();
  await prisma.review.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.restaurantMembership.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing records.');

  // Password hash for seed users
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Users
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@switea.com',
      passwordHash,
      name: 'Platform Super Administrator',
      phone: '+91 98000 00001',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });

  const owner = await prisma.user.create({
    data: {
      email: 'owner@switea.com',
      passwordHash,
      name: 'Switea Cafe Owner',
      phone: '+91 95554 95454',
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@switea.com',
      passwordHash,
      name: 'Jaipur Cafe Manager',
      phone: '+91 95554 95455',
      role: 'MANAGER',
      status: 'ACTIVE',
    },
  });

  const kitchenStaff = await prisma.user.create({
    data: {
      email: 'kitchen@switea.com',
      passwordHash,
      name: 'Chef Kitchen Lead',
      phone: '+91 95554 95456',
      role: 'KITCHEN',
      status: 'ACTIVE',
    },
  });

  console.log('👤 Users created successfully.');

  // 2. Subscription Plans
  const starterPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Starter Cafe',
      slug: 'starter',
      price: 999,
      billingInterval: 'MONTHLY',
      maxTables: 10,
      maxItems: 50,
      features: JSON.stringify(['digital_menu', 'qr_generator', 'table_ordering']),
    },
  });

  const proPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Nature Pro Suite',
      slug: 'pro',
      price: 2499,
      billingInterval: 'MONTHLY',
      maxTables: 50,
      maxItems: 300,
      features: JSON.stringify(['digital_menu', 'qr_generator', 'table_ordering', 'kitchen_display', 'analytics', 'landing_page_builder', 'custom_branding']),
    },
  });

  // 3. Restaurant Creation
  const switea = await prisma.restaurant.create({
    data: {
      name: 'Switea Nature Cafe',
      slug: 'switea',
      description: 'A serene garden cafe in Jaipur serving authentic kulhad chai, artisan coffees, comfort snacks, and wood-fired bites surrounded by soothing lush greenery.',
      tagLine: 'A Sip of Sweetness',
      logo: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=300&q=80',
      coverImage: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1600&q=80',
      address: '64A, Garden Cafe, Karni Vihar, Maa Karni Nagar, Gandhipath, near Vaishali Nagar',
      city: 'Jaipur',
      state: 'Rajasthan',
      postalCode: '302021',
      phone: '+91 95554 95454',
      email: 'hello@switeanaturecafe.com',
      mapLink: 'https://maps.google.com/?q=Switea+Garden+Cafe+Jaipur',
      whatsappNumber: '+919555495454',
      openingHours: '10:00 AM - 11:30 PM',
      currency: 'INR',
      currencySymbol: '₹',
      timezone: 'Asia/Kolkata',
      taxPercent: 5.0,
      isOrderingEnabled: true,
      isPayAtCounterOnly: false,
      isOpen: true,
    },
  });

  // Memberships
  await prisma.restaurantMembership.createMany({
    data: [
      { userId: owner.id, restaurantId: switea.id, role: 'OWNER' },
      { userId: manager.id, restaurantId: switea.id, role: 'MANAGER' },
      { userId: kitchenStaff.id, restaurantId: switea.id, role: 'KITCHEN' },
    ],
  });

  // Active Subscription
  await prisma.subscription.create({
    data: {
      restaurantId: switea.id,
      planId: proPlan.id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  // 4. Landing Page Content
  await prisma.landingPageContent.create({
    data: {
      restaurantId: switea.id,
      heroTitle: 'Switea Nature Cafe',
      heroSubtitle: 'Step into Jaipur’s premier green oasis. Savor freshly brewed earthen kulhad chai, slow-drip coffees, and gourmet cafe treats amid serene garden foliage.',
      heroCtaText: 'Explore Digital Menu',
      heroImage: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1600&q=80',
      aboutTitle: 'Pure Ingredients, Earthen Warmth & Natural Calm',
      aboutText: 'Switea Nature Cafe was born out of a passion to fuse traditional Indian tea culture with modern cafe comforts. Set in Jaipur’s serene Karni Vihar, we offer garden seating shaded by verdant trees, ambient evening warm fairy lights, and culinary crafted delights prepared with wholesome ingredients.',
      aboutHighlight1: 'Traditional Earthen Kulhad Chai & Tisanes',
      aboutHighlight2: 'Lush Green Open-Air Garden & Cabana Seating',
      aboutHighlight3: 'Gourmet Pizzas, Artisan Maggi & Sizzling Delights',
      aboutImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80',
      announcementText: '🌿 Table QR Ordering is Live! Use code NATURE10 to get 10% off your table order today.',
      announcementActive: true,
      instagramUrl: 'https://instagram.com/switeacafe',
      facebookUrl: 'https://facebook.com/switeacafe',
      mapEmbedUrl: 'https://maps.google.com/?q=26.8920,75.7350',
      metaTitle: 'Switea Nature Cafe | Garden Dining & Chai Experience in Jaipur',
      metaDescription: 'Experience Switea Nature Cafe in Jaipur: relaxing garden greenery, handcrafted kulhad teas, cold brews, artisan burgers and instant table ordering.',
      isPublished: true,
    },
  });

  // 5. Gallery Images
  await prisma.galleryImage.createMany({
    data: [
      {
        restaurantId: switea.id,
        title: 'Verdant Garden Canopy',
        imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80',
        displayOrder: 1,
        isActive: true,
      },
      {
        restaurantId: switea.id,
        title: 'Signature Earthen Kulhad Chai',
        imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&q=80',
        displayOrder: 2,
        isActive: true,
      },
      {
        restaurantId: switea.id,
        title: 'Artisan Cold Brew & Shakes',
        imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=1200&q=80',
        displayOrder: 3,
        isActive: true,
      },
      {
        restaurantId: switea.id,
        title: 'Stone-Baked Farmhouse Pizza',
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
        displayOrder: 4,
        isActive: true,
      },
      {
        restaurantId: switea.id,
        title: 'Evening Cafe Fairy Lights',
        imageUrl: 'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=1200&q=80',
        displayOrder: 5,
        isActive: true,
      },
      {
        restaurantId: switea.id,
        title: 'Crispy Kurkure Momos & Dips',
        imageUrl: 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?auto=format&fit=crop&w=1200&q=80',
        displayOrder: 6,
        isActive: true,
      },
    ],
  });

  // 6. Menu Categories & Items
  console.log('🍵 Seeding Switea menu categories and items from reference...');

  // Cat 1: Beverages
  const catBeverages = await prisma.menuCategory.create({
    data: {
      restaurantId: switea.id,
      name: 'Beverages (Chai & Teas)',
      slug: 'beverages-chai',
      description: 'Slow-simmered, aromatic Indian teas served fresh in traditional clay kulhads.',
      image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=500&q=80',
      displayOrder: 1,
      isActive: true,
    },
  });

  const adrakChai = await prisma.menuItem.create({
    data: {
      restaurantId: switea.id,
      categoryId: catBeverages.id,
      name: 'Adrak Masala Kulhad Chai',
      slug: 'adrak-masala-kulhad-chai',
      description: 'Freshly crushed ginger and whole aromatic spices simmered in rich creamy milk, served in an earthy clay kulhad.',
      price: 35,
      isVeg: true,
      isBestseller: true,
      isSpecial: true,
      isAvailable: true,
      image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
      prepTimeMinutes: 8,
      displayOrder: 1,
    },
  });

  // Modifiers for Chai
  const chaiSugarGroup = await prisma.modifierGroup.create({
    data: {
      menuItemId: adrakChai.id,
      name: 'Sugar Preference',
      minSelect: 0,
      maxSelect: 1,
      isRequired: false,
    },
  });
  await prisma.modifierOption.createMany({
    data: [
      { modifierGroupId: chaiSugarGroup.id, name: 'Normal Sugar', price: 0, isDefault: true },
      { modifierGroupId: chaiSugarGroup.id, name: 'Less Sugar', price: 0, isDefault: false },
      { modifierGroupId: chaiSugarGroup.id, name: 'Sugar Free (Stevia)', price: 10, isDefault: false },
    ],
  });

  await prisma.menuItem.create({
    data: {
      restaurantId: switea.id,
      categoryId: catBeverages.id,
      name: 'Jaggery Tea (Gud Ki Chai)',
      slug: 'jaggery-tea-gud-ki-chai',
      description: 'Naturally sweetened with unrefined organic desi jaggery, cardamom and ginger.',
      price: 45,
      isVeg: true,
      isBestseller: true,
      isSpecial: false,
      isAvailable: true,
      image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
      prepTimeMinutes: 10,
      displayOrder: 2,
    },
  });

  await prisma.menuItem.create({
    data: {
      restaurantId: switea.id,
      categoryId: catBeverages.id,
      name: 'Elaichi Royal Kulhad Chai',
      slug: 'elaichi-royal-kulhad-chai',
      description: 'Fragrant green cardamom pods infused with slow-brewed premium Assam tea leaves.',
      price: 40,
      isVeg: true,
      isBestseller: false,
      isSpecial: false,
      isAvailable: true,
      image: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80',
      prepTimeMinutes: 8,
      displayOrder: 3,
    },
  });

  await prisma.menuItem.create({
    data: {
      restaurantId: switea.id,
      categoryId: catBeverages.id,
      name: 'Honey Lemon Ginger Green Tea',
      slug: 'honey-lemon-ginger-green-tea',
      description: 'Refreshing antioxidant-rich green tea with wild Himalayan honey and fresh lemon juice.',
      price: 55,
      isVeg: true,
      isBestseller: false,
      isSpecial: false,
      isAvailable: true,
      image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
      prepTimeMinutes: 6,
      displayOrder: 4,
    },
  });

  // Cat 2: Coffee Lovers (Caffeine)
  const catCoffee = await prisma.menuItem.create({
    data: {
      restaurantId: switea.id,
      categoryId: (await prisma.menuCategory.create({
        data: {
          restaurantId: switea.id,
          name: 'Coffee Lovers (Caffeine)',
          slug: 'coffee-lovers',
          description: 'Single-origin espresso brews and velvety cold coffees crafted to perfection.',
          image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=500&q=80',
          displayOrder: 2,
          isActive: true,
        },
      })).id,
      name: 'Switea Signature Thick Cold Coffee',
      slug: 'switea-signature-cold-coffee',
      description: 'Rich roasted espresso blended with creamy vanilla ice cream, topped with cocoa dust and chocolate drizzle.',
      price: 119,
      isVeg: true,
      isBestseller: true,
      isSpecial: true,
      isAvailable: true,
      image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
      prepTimeMinutes: 10,
      displayOrder: 1,
    },
  });

  // Cat 3: Halka Fulka Time Pass
  const catSnacks = await prisma.menuCategory.create({
    data: {
      restaurantId: switea.id,
      name: 'Halka Fulka Time Pass',
      slug: 'halka-fulka-time-pass',
      description: 'Crispy, savory finger foods and cafe munchies perfect for friendly chatter.',
      image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=500&q=80',
      displayOrder: 3,
      isActive: true,
    },
  });

  const periPeriFries = await prisma.menuItem.create({
    data: {
      restaurantId: switea.id,
      categoryId: catSnacks.id,
      name: 'Peri Peri Crispy French Fries',
      slug: 'peri-peri-crispy-fries',
      description: 'Golden fried potato strips dusted with African bird’s eye chili seasoning, served with garlic mayo dip.',
      price: 99,
      isVeg: true,
      isBestseller: true,
      isSpecial: false,
      isAvailable: true,
      image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80',
      prepTimeMinutes: 12,
      displayOrder: 1,
    },
  });

  const dipGroup = await prisma.modifierGroup.create({
    data: {
      menuItemId: periPeriFries.id,
      name: 'Extra Dips & Sauces',
      minSelect: 0,
      maxSelect: 2,
      isRequired: false,
    },
  });
  await prisma.modifierOption.createMany({
    data: [
      { modifierGroupId: dipGroup.id, name: 'Cheddar Cheese Sauce', price: 25, isDefault: false },
      { modifierGroupId: dipGroup.id, name: 'Chipotle Mayo Dip', price: 20, isDefault: false },
    ],
  });

  await prisma.menuItem.create({
    data: {
      restaurantId: switea.id,
      categoryId: catSnacks.id,
      name: 'Herb Cheesy Garlic Bread (4 Pcs)',
      slug: 'herb-cheesy-garlic-bread',
      description: 'Toasted baguette slices brushed with garlic herb butter and blanketed in melted mozzarella cheese.',
      price: 129,
      isVeg: true,
      isBestseller: false,
      isSpecial: false,
      isAvailable: true,
      image: 'https://images.unsplash.com/photo-1619895092538-128341789043?auto=format&fit=crop&w=600&q=80',
      prepTimeMinutes: 15,
      displayOrder: 2,
    },
  });

  // Cat 4: Maggi
  const catMaggi = await prisma.menuCategory.create({
    data: {
      restaurantId: switea.id,
      name: '2 Minute Wala Pyaar = Maggi ❤️',
      slug: 'maggi-pyaar',
      description: 'Hot sizzling bowls of nostalgic Maggi cooked in butter, spices and cheesy galore.',
      image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=500&q=80',
      displayOrder: 4,
      isActive: true,
    },
  });

  const cheeseMaggi = await prisma.menuItem.create({
    data: {
      restaurantId: switea.id,
      categoryId: catMaggi.id,
      name: 'Cheesy Burst Vegetable Maggi',
      slug: 'cheesy-burst-vegetable-maggi',
      description: 'Fresh bell peppers, sweet corn, green peas simmered in secret masala and loaded with molten processed cheese.',
      price: 89,
      isVeg: true,
      isBestseller: true,
      isSpecial: true,
      isAvailable: true,
      image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80',
      prepTimeMinutes: 10,
      displayOrder: 1,
    },
  });

  // Cat 5: Momos
  const catMomos = await prisma.menuCategory.create({
    data: {
      restaurantId: switea.id,
      name: 'Momos Da Mamla',
      slug: 'momos-da-mamla',
      description: 'Handmade juicy dumplings served with fiery red chutney and creamy garlic dip.',
      image: 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?auto=format&fit=crop&w=500&q=80',
      displayOrder: 5,
      isActive: true,
    },
  });

  await prisma.menuItem.create({
    data: {
      restaurantId: switea.id,
      categoryId: catMomos.id,
      name: 'Crispy Kurkure Veg Momos (6 Pcs)',
      slug: 'crispy-kurkure-veg-momos',
      description: 'Crunchy golden-fried dumplings coated with spiced flakes, served with spicy schezwan sauce and mayonnaise.',
      price: 139,
      isVeg: true,
      isBestseller: true,
      isSpecial: true,
      isAvailable: true,
      image: 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?auto=format&fit=crop&w=600&q=80',
      prepTimeMinutes: 15,
      displayOrder: 1,
    },
  });

  // Cat 6: Pizza Theory
  const catPizza = await prisma.menuCategory.create({
    data: {
      restaurantId: switea.id,
      name: 'Pizza Theory',
      slug: 'pizza-theory',
      description: 'Crisp hand-tossed crusts with homemade herb marinara and 100% dairy mozzarella.',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80',
      displayOrder: 6,
      isActive: true,
    },
  });

  const farmhousePizza = await prisma.menuItem.create({
    data: {
      restaurantId: switea.id,
      categoryId: catPizza.id,
      name: 'Farmhouse Fresh Garden Pizza (8 Inch)',
      slug: 'farmhouse-fresh-garden-pizza',
      description: 'Topped with fresh bell peppers, crisp red onions, ripe tomatoes, black olives and stringy mozzarella cheese.',
      price: 189,
      isVeg: true,
      isBestseller: true,
      isSpecial: false,
      isAvailable: true,
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
      prepTimeMinutes: 18,
      displayOrder: 1,
    },
  });

  // Variants for Pizza
  await prisma.itemVariant.createMany({
    data: [
      { menuItemId: farmhousePizza.id, name: 'Regular 8-inch', price: 189, isDefault: true },
      { menuItemId: farmhousePizza.id, name: 'Medium 10-inch', price: 279, isDefault: false },
    ],
  });

  // Cat 7: Quick Refreshers
  const catRefreshers = await prisma.menuCategory.create({
    data: {
      restaurantId: switea.id,
      name: 'Quick Refreshers & Shakes',
      slug: 'quick-refreshers',
      description: 'Cooling mocktails and thick velvety milkshakes.',
      image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=500&q=80',
      displayOrder: 7,
      isActive: true,
    },
  });

  await prisma.menuItem.create({
    data: {
      restaurantId: switea.id,
      categoryId: catRefreshers.id,
      name: 'Garden Fresh Mint Virgin Mojito',
      slug: 'garden-fresh-mint-virgin-mojito',
      description: 'Crushed garden mint, freshly squeezed lime, cane syrup and chilled bubbling soda.',
      price: 99,
      isVeg: true,
      isBestseller: true,
      isSpecial: false,
      isAvailable: true,
      image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
      prepTimeMinutes: 8,
      displayOrder: 1,
    },
  });

  // 7. Tables & Table QRCodes
  console.log('🪑 Setting up restaurant tables with secure unguessable tokens...');

  const tablesData = [
    { tableNumber: 'Table 01', name: 'Garden Green Table 01', capacity: 4, section: 'Garden Area', token: 'sw-tbl-g01-nature' },
    { tableNumber: 'Table 02', name: 'Garden Green Table 02', capacity: 4, section: 'Garden Area', token: 'sw-tbl-g02-nature' },
    { tableNumber: 'Table 03', name: 'Cabana Gazebo Table 03', capacity: 6, section: 'Cabana Gazebo', token: 'sw-tbl-g03-nature' },
    { tableNumber: 'Table 04', name: 'Indoor Lounge Table 04', capacity: 2, section: 'Indoor Lounge', token: 'sw-tbl-in04-nature' },
    { tableNumber: 'Table 05', name: 'Rooftop Deck Table 05', capacity: 8, section: 'Rooftop Deck', token: 'sw-tbl-rf05-nature' },
  ];

  for (const t of tablesData) {
    const table = await prisma.table.create({
      data: {
        restaurantId: switea.id,
        tableNumber: t.tableNumber,
        name: t.name,
        capacity: t.capacity,
        section: t.section,
        isActive: true,
      },
    });

    await prisma.tableQRCode.create({
      data: {
        tableId: table.id,
        token: t.token,
        scanCount: 12,
        lastScannedAt: new Date(),
      },
    });
  }

  // 8. Discount Code
  await prisma.discount.create({
    data: {
      restaurantId: switea.id,
      code: 'NATURE10',
      discountType: 'PERCENTAGE',
      value: 10,
      minOrderAmount: 199,
      maxDiscount: 100,
      isActive: true,
      usageLimit: 500,
      timesUsed: 4,
    },
  });

  // 9. Verified Customer Reviews
  await prisma.review.createMany({
    data: [
      {
        restaurantId: switea.id,
        customerName: 'Aditi Sharma',
        rating: 5,
        comment: 'Best kulhad chai in Jaipur! The garden ambiance is so peaceful and relaxing after a busy day. Ordering directly from our table QR was super quick and convenient.',
        isApproved: true,
      },
      {
        restaurantId: switea.id,
        customerName: 'Rohit Khandelwal',
        rating: 5,
        comment: 'The Cheesy Maggi and Peri Peri fries were freshly made and piping hot. Love the green nature vibe and fast service.',
        isApproved: true,
      },
      {
        restaurantId: switea.id,
        customerName: 'Priya Meena',
        rating: 5,
        comment: 'Amazing place for evening hangouts with friends. Thick cold coffee is a must try!',
        isApproved: true,
      },
    ],
  });

  console.log('✅ Seeding completed successfully!');
  console.log('🔐 Credentials Summary:');
  console.log('   - Super Admin: superadmin@switea.com / Password123!');
  console.log('   - Restaurant Owner: owner@switea.com / Password123!');
  console.log('   - Restaurant Manager: manager@switea.com / Password123!');
  console.log('   - Kitchen Staff: kitchen@switea.com / Password123!');
  console.log('   - Switea Restaurant Slug: switea');
  console.log('   - Table 01 Token: sw-tbl-g01-nature');
  console.log('   - Table 02 Token: sw-tbl-g02-nature');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
