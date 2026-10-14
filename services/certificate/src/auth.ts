import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config';

export interface AuthenticatedUser {
  id: string;
  role: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid Authorization header with Bearer token',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret, {
      algorithms: [config.jwtAlgorithm as jwt.Algorithm],
    }) as any;

    req.user = {
      id: decoded.sub || decoded.id,
      role: decoded.role || 'worker',
      email: decoded.email || '',
    };
    next();
  } catch (err: any) {
    const isExpired = err.name === 'TokenExpiredError';
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: isExpired ? 'Access token has expired' : 'Invalid or tampered access token',
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
          message: 'Authentication required',
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
          message: `Insufficient privileges. Role must be one of [${allowedRoles.join(', ')}], got '${req.user.role}'`,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    next();
  };
}
