import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function verifyJwtToken(token: string): AuthenticatedUser {
  const decoded = jwt.verify(token, config.jwtSecret, {
    algorithms: [config.jwtAlgorithm as jwt.Algorithm],
  }) as any;

  const id = decoded.sub || decoded.id;
  if (!id) {
    throw new Error('Token payload missing subject id');
  }

  return {
    id,
    email: decoded.email || '',
    role: decoded.role || 'worker',
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token required.',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const user = verifyJwtToken(token);
    req.user = user;
    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: `Invalid or expired token: ${err.message}`,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Forbidden: Action requires one of the following roles: ${allowedRoles.join(', ')}. Current role is '${req.user.role}'.`,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    next();
  };
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = verifyJwtToken(token);
    } catch {
      // Ignore invalid optional token
    }
  }
  next();
}
