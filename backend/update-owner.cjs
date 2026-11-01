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

  try {
    const oldEmail = 'parth@asrockstudios.in';
    const newEmail = 'dheeraj@asrockstudios.in';

    const owner = await prisma.user.findUnique({
      where: { email: oldEmail }
    });

    if (!owner || owner.role !== 'OWNER') {
      throw new Error('Existing Owner account not found. No changes made.');
    }

    const emailTaken = await prisma.user.findUnique({
      where: { email: newEmail }
    });

    if (emailTaken && emailTaken.id !== owner.id) {
      throw new Error('New email already belongs to another account.');
    }

    const password = await ask('Enter new Owner password: ');

    if (password.length < 12) {
      throw new Error('Password must be at least 12 characters.');
    }

    const confirm = await ask('Confirm new Owner password: ');

    if (password !== confirm) {
      throw new Error('Passwords do not match.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const updated = await prisma.user.update({
      where: { id: owner.id },
      data: {
        email: newEmail,
        passwordHash,
        status: 'ACTIVE'
      },
      select: {
        email: true,
        role: true,
        status: true
      }
    });

    console.log('\nOwner updated successfully:');
    console.log(updated);
  } finally {
    rl.close();
  }
}

main()
  .catch(error => {
    console.error('ERROR:', error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
