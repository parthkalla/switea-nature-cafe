import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  restaurantId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'roastfuze_super_secret_jwt_token_auth_key_2026';

export function signToken(user: { id: string; email: string; name: string; role: string; restaurantId?: string }): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      restaurantId: user.restaurantId,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        memberships: {
          include: {
            restaurant: {
              select: { id: true, slug: true, isDeleted: true },
            },
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'User account is inactive or not found.' });
    }

    let targetRestaurantId: string | undefined = undefined;

    // Check if client explicitly requested a specific restaurant (via header or query)
    const headerRestId = (req.headers['x-restaurant-id'] || req.query.restaurantId) as string;
    const headerSlug = ((req.headers['x-restaurant-slug'] || req.query.slug) as string)?.toLowerCase().trim();

    // Check host subdomain (e.g. damroo.asrockstudios.in or damroo.localhost)
    const host = ((req.headers['x-forwarded-host'] || req.headers.host || '') as string).toLowerCase().split(':')[0];
    let hostSlug = '';
    if (host.endsWith('.asrockstudios.in')) {
      const sub = host.replace('.asrockstudios.in', '');
      if (sub && sub !== 'admin' && sub !== 'www') hostSlug = sub;
    } else if (host.endsWith('.localhost')) {
      const sub = host.replace('.localhost', '');
      if (sub && sub !== 'admin' && sub !== 'www') hostSlug = sub;
    }

    const effectiveSlug = headerSlug && headerSlug !== 'all' ? headerSlug : hostSlug;

    if (user.role === 'SUPER_ADMIN') {
      if (headerRestId) {
        targetRestaurantId = headerRestId;
      } else if (effectiveSlug) {
        const found = await prisma.restaurant.findUnique({
          where: { slug: effectiveSlug },
          select: { id: true, isDeleted: true },
        });
        if (found && !found.isDeleted) targetRestaurantId = found.id;
      }
    } else if (effectiveSlug) {
      // Find if user has membership in the requested restaurant
      const userMatched = await prisma.restaurant.findUnique({
        where: { slug: effectiveSlug },
        select: { id: true, isDeleted: true },
      });
      if (userMatched && !userMatched.isDeleted && user.memberships.some(m => m.restaurantId === userMatched.id)) {
        targetRestaurantId = userMatched.id;
      }
    }

    if (!targetRestaurantId) {
      // Pick the first non-deleted restaurant membership
      const validMembership = user.memberships.find(m => m.restaurant && !m.restaurant.isDeleted);
      if (validMembership) {
        targetRestaurantId = validMembership.restaurantId;
      }
    }

    // Double check targetRestaurantId is valid and not deleted
    if (targetRestaurantId) {
      const checkValid = await prisma.restaurant.findUnique({
        where: { id: targetRestaurantId },
        select: { id: true, isDeleted: true },
      });
      if (!checkValid || checkValid.isDeleted) {
        targetRestaurantId = undefined;
      }
    }

    if (!targetRestaurantId) {
      const fallbackRest = await prisma.restaurant.findFirst({
        where: { isDeleted: false },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      targetRestaurantId = fallbackRest?.id || '8b16826a-4c98-4c5c-b0d0-b7e9de0c859f';
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      restaurantId: targetRestaurantId,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    // SUPER_ADMIN has platform-wide access
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges.' });
    }
    next();
  };
}

export async function requireRestaurantAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  const restaurantId = (req.params.restaurantId || req.query.restaurantId || req.body.restaurantId || req.user.restaurantId) as string;

  if (!restaurantId) {
    return res.status(400).json({ error: 'Restaurant context required.' });
  }

  const membership = await prisma.restaurantMembership.findFirst({
    where: {
      userId: req.user.id,
      restaurantId,
    },
  });

  if (!membership) {
    return res.status(403).json({ error: 'Access denied to this restaurant.' });
  }

  req.user.restaurantId = restaurantId;
  next();
}
