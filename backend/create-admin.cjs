const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = (q) => new Promise(resolve => rl.question(q, resolve));

  const email = 'superadmin@roastfuze.com';
  const password = await ask('New admin password: ');
  rl.close();

  if (password.length < 12) {
    throw new Error('Password must be at least 12 characters.');
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    throw new Error('Admin email already exists. No changes made.');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE'
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true
    }
  });

  console.log('Admin created successfully:', user);
}

main()
  .catch(error => {
    console.error('Error:', error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
