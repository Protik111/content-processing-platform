import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';
import config from '../../config/index.js';

// Define auth user type
export interface IAuthUser {
  id: string;
  username?: string;
  email?: string;
  roles?: string[];
}

export interface IAuthRequest extends Request {
  user?: IAuthUser;
}

// Keycloak JWKS endpoint (public keys for token verification)
const JWKS_URI = `${config.internal_keycloak_url}/protocol/openid-connect/certs`;
const jwksClient = jose.createRemoteJWKSet(new URL(JWKS_URI));

export const authenticate = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    console.log('Auth header:', authHeader);
    console.log('Config Issuer:', config.keycloak_issuer);
    console.log('Config Client ID:', config.keycloak_client_id);
    console.log('Internal JWKS URI:', JWKS_URI);
    
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Missing or invalid Authorization header' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT signature & claims
    const { payload } = await jose.jwtVerify(token, jwksClient, {
      issuer: config.keycloak_issuer,
      audience: config.keycloak_client_id, // matches your client ID
    });

    // Attach user info to request
    req.user = {
      id: payload.sub as string,
      username: payload.preferred_username as string,
      email: payload.email as string,
      roles: (payload.realm_access as any)?.roles || [],
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};