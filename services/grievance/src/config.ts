import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local and .env at project root
const rootDir = path.resolve(__dirname, '..', '..', '..');
dotenv.config({ path: path.join(rootDir, '.env.local') });
dotenv.config({ path: path.join(rootDir, '.env') });

export const config = {
  port: process.env.PORT_GRIEVANCE ? parseInt(process.env.PORT_GRIEVANCE, 10) : 4001,
  jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-signing-key-min-32-chars-long!',
  jwtAlgorithm: process.env.JWT_ALGORITHM || 'HS256',
  supabaseUrl: (process.env.SUPABASE_URL || '').replace(/\/$/, ''),
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
};
