const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const GARDEN_THEME = {
  tagLine: 'Garden Lawns & Artisanal Fresh Brews',
  primaryColor: '#064e3b',
  accentColor: '#10b981',
  description: 'Lush greenery, open-air garden lawn seating, serene gazebos, organic herbal teas, and handcrafted fresh comfort fare.',
  city: 'Jaipur',
  starterCategories: [
    {
      name: 'Organic Teas & Kulhad Specials',
      slug: 'organic-teas',
      itemType: 'COFFEE',
      description: 'Hand-brewed garden teas infused with fresh mint, lemongrass, and Indian spices.',
      image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
      items: [
        { name: 'Royal Garden Kulhad Chai', slug: 'royal-garden-kulhad-chai', description: 'Simmered with cardamom, ginger, saffron & tulsi leaves.', price: 69, isVeg: true, isBestseller: true, image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80' },
        { name: 'Kashmiri Kahwa Green Tea', slug: 'kashmiri-kahwa-green-tea', description: 'Whole-leaf green tea with crushed almonds, cinnamon & Kashmiri saffron.', price: 99, isVeg: true, isBestseller: false, image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80' },
        { name: 'Fresh Lemongrass Iced Tea', slug: 'fresh-lemongrass-iced-tea', description: 'Steeped garden lemongrass and clover honey over crushed ice.', price: 129, isVeg: true, isBestseller: true, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80' },
      ],
    },
    {
      name: 'Garden Fresh Salads & Bowls',
      slug: 'garden-bowls',
      itemType: 'FOOD',
      description: 'Crisp microgreens, garden herbs, and toasted nuts tossed in house dressings.',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
      items: [
        { name: 'Crispy Cottage Cheese Garden Bowl', slug: 'crispy-cottage-cheese-garden-bowl', description: 'Herb-grilled paneer, cherry tomatoes, cucumbers & lemon-herb vinaigrette.', price: 189, isVeg: true, isBestseller: true, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80' },
        { name: 'Avocado & Roasted Walnut Salad', slug: 'avocado-roasted-walnut-salad', description: 'Creamy avocado slices, crisp lettuce, pomegranate seeds and honey mustard.', price: 239, isVeg: true, isBestseller: false, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80' },
      ],
    },
    {
      name: 'Wood-Fired Garden Crust Pizzas',
      slug: 'garden-pizzas',
      itemType: 'FOOD',
      description: 'Thin hand-stretched crusts topped with garden-picked basil and mozzarella.',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
      items: [
        { name: 'Garden Green Primavera Pizza (8-inch)', slug: 'garden-green-primavera-pizza', description: 'Zucchini ribbons, bell peppers, baby spinach, black olives & fresh mozzarella.', price: 249, isVeg: true, isBestseller: true, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80' },
        { name: 'Farmhouse Sundried Tomato Pizza (8-inch)', slug: 'farmhouse-sundried-tomato-pizza', description: 'Rich Italian sauce, sundried tomatoes, red onions, mushrooms & oregano.', price: 269, isVeg: true, isBestseller: false, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80' },
      ],
    },
    {
      name: 'Artisan Coolers & Smoothies',
      slug: 'garden-coolers',
      itemType: 'COFFEE',
      description: 'Refreshing fruit purées, fresh mint sprigs, and chilled yogurt blends.',
      image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80',
      items: [
        { name: 'Garden Mint Mojito Cooler', slug: 'garden-mint-mojito-cooler', description: 'Crushed garden mint, freshly squeezed lime, cane sugar & sparkling soda.', price: 139, isVeg: true, isBestseller: true, image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=800&q=80' },
        { name: 'Wild Berry Botanical Frappe', slug: 'wild-berry-botanical-frappe', description: 'Mixed berry compote slow-whipped with creamy vanilla ice cream.', price: 179, isVeg: true, isBestseller: true, image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80' },
      ],
    },
  ],
};

async function main() {
  const r = await prisma.restaurant.findUnique({ where: { slug: 'parth-cafe' } });
  if (!r) {
    console.log('parth-cafe not found');
    return;
  }
  console.log('Found parth-cafe id:', r.id);

  await prisma.restaurant.update({
    where: { id: r.id },
    data: {
      name: 'Parth Garden Cafe',
      themeTemplate: 'GARDEN_CAFE',
      tagLine: GARDEN_THEME.tagLine,
      primaryColor: GARDEN_THEME.primaryColor,
      accentColor: GARDEN_THEME.accentColor,
      description: GARDEN_THEME.description,
      city: 'Jaipur',
    },
  });

  // Check or delete categories for parth-cafe only
  await prisma.menuItem.deleteMany({ where: { restaurantId: r.id } });
  await prisma.menuCategory.deleteMany({ where: { restaurantId: r.id } });

  for (let cIdx = 0; cIdx < GARDEN_THEME.starterCategories.length; cIdx++) {
    const catDef = GARDEN_THEME.starterCategories[cIdx];
    const category = await prisma.menuCategory.create({
      data: {
        restaurantId: r.id,
        name: catDef.name,
        slug: `${catDef.slug}-parth`,
        itemType: catDef.itemType,
        description: catDef.description,
        image: catDef.image,
        displayOrder: cIdx + 1,
        isActive: true,
      },
    });

    for (let iIdx = 0; iIdx < catDef.items.length; iIdx++) {
      const itm = catDef.items[iIdx];
      await prisma.menuItem.create({
        data: {
          restaurantId: r.id,
          categoryId: category.id,
          name: itm.name,
          slug: `${itm.slug}-parth`,
          description: itm.description,
          price: itm.price,
          isVeg: itm.isVeg,
          isBestseller: itm.isBestseller,
          isAvailable: true,
          image: itm.image,
        },
      });
    }
  }

  console.log('Parth Garden Cafe menu seeded successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
