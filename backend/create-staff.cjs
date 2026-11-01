const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = q => new Promise(resolve => rl.question(q, resolve));

async function main() {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: 'roast' }
  });

  if (!restaurant) {
    throw new Error('Roastfuze restaurant not found. No changes made.');
  }

  const accounts = [
    {
      email: 'manager@roastfuze.com',
      name: 'Roastfuze Manager',
      role: 'MANAGER'
    },
    {
      email: 'kitchen@roastfuze.com',
      name: 'Roastfuze Kitchen',
      role: 'KITCHEN'
    }
  ];

  for (const account of accounts) {
    const existing = await prisma.user.findUnique({
      where: { email: account.email }
    });

    let user = existing;

    if (!user) {
      const password = await ask(`Set password for ${account.email}: `);

      if (password.length < 12) {
        throw new Error('Password must contain at least 12 characters.');
      }

      user = await prisma.user.create({
        data: {
          email: account.email,
          name: account.name,
          passwordHash: await bcrypt.hash(password, 10),
          role: account.role,
          status: 'ACTIVE'
        }
      });

      console.log(`Created: ${account.email}`);
    } else {
      console.log(`Already exists; preserving account: ${account.email}`);
    }

    const membership = await prisma.restaurantMembership.findUnique({
      where: {
        userId_restaurantId: {
          userId: user.id,
          restaurantId: restaurant.id
        }
      }
    });

    if (!membership) {
      await prisma.restaurantMembership.create({
        data: {
          userId: user.id,
          restaurantId: restaurant.id,
          role: account.role
        }
      });
      console.log(`Linked ${account.email} to ${restaurant.name}`);
    } else {
      console.log(`Membership already exists for ${account.email}`);
    }
  }

  console.log('\nFinished. Existing Owner and restaurant were preserved.');
}

main()
  .catch(error => {
    console.error('ERROR:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });
