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

const JWT_SECRET = process.env.JWT_SECRET || 'switea_super_secret_jwt_token_auth_key_2026';

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
      include: { memberships: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'User account is inactive or not found.' });
    }

    const defaultMembership = user.memberships[0];
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      restaurantId: defaultMembership?.restaurantId,
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
