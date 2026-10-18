import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { signToken } from '../middleware/auth';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        memberships: {
          include: {
            restaurant: {
              select: { id: true, name: true, slug: true, logo: true },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Your account is suspended or inactive.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const defaultMembership = user.memberships[0];
    const restaurantId = defaultMembership?.restaurantId;

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      restaurantId,
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        restaurantId: restaurantId || null,
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: user.id,
        details: JSON.stringify({ email: user.email, role: user.role }),
        ipAddress: req.ip || null,
      },
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        status: user.status,
        restaurant: defaultMembership?.restaurant || null,
        restaurantId,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export async function getMe(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        memberships: {
          include: {
            restaurant: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const defaultMembership = user.memberships[0];

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      status: user.status,
      restaurant: defaultMembership?.restaurant || null,
      restaurantId: defaultMembership?.restaurantId,
    });
  } catch (err: any) {
    console.error('getMe error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const { name, phone } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name ? String(name).trim() : undefined,
        phone: phone ? String(phone).trim() : undefined,
      },
      select: { id: true, email: true, name: true, phone: true, role: true },
    });

    return res.json({ user: updated });
  } catch (err: any) {
    console.error('updateProfile error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password does not match.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return res.json({ message: 'Password updated successfully.' });
  } catch (err: any) {
    console.error('changePassword error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
