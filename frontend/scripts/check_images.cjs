const { PrismaClient } = require('E:/roastfuze/backend/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  const items = await p.menuItem.findMany({
    select: { name: true, image: true, category: { select: { name: true } } }
  });
  console.log('Total items:', items.length);
  for (const item of items) {
    console.log(`[${item.category?.name}] ${item.name} -> ${item.image}`);
  }
}

main().finally(() => p.$disconnect());
