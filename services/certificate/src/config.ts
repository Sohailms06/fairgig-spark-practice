import dotenv from 'dotenv';
import path from 'path';

// Load root .env.local and .env
const rootDir = path.resolve(__dirname, '../../..');
dotenv.config({ path: path.join(rootDir, '.env.local') });
dotenv.config({ path: path.join(rootDir, '.env') });

export const config = {
  port: process.env.PORT_CERTIFICATE ? parseInt(process.env.PORT_CERTIFICATE, 10) : (process.env.PORT ? parseInt(process.env.PORT, 10) : 4002),
  jwtSecret: process.env.JWT_SECRET || 'fairgig-default-hackathon-jwt-secret-key-32-chars-min!',
  jwtAlgorithm: process.env.JWT_ALGORITHM || 'HS256',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  serviceName: 'certificate',
  version: '0.1.0',
};
