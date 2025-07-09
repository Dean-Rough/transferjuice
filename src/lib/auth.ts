import { NextRequest } from "next/server";
import crypto from "crypto";

// Simple password-based authentication for dashboard
const DASHBOARD_PASSWORD_HASH = process.env.DASHBOARD_PASSWORD_HASH;

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password: string): boolean {
  if (!DASHBOARD_PASSWORD_HASH) {
    console.error("DASHBOARD_PASSWORD_HASH not set in environment variables");
    return false;
  }
  return hashPassword(password) === DASHBOARD_PASSWORD_HASH;
}

export function createAuthToken(password: string): string {
  const timestamp = Date.now();
  const data = `${password}-${timestamp}`;
  return Buffer.from(data).toString('base64');
}

export function verifyAuthToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const [password, timestamp] = decoded.split('-');
    
    // Token expires after 24 hours
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 24 * 60 * 60 * 1000) {
      return false;
    }
    
    return verifyPassword(password);
  } catch {
    return false;
  }
}

export function checkAuth(request: NextRequest): boolean {
  const token = request.cookies.get('dashboard-auth')?.value;
  if (!token) return false;
  return verifyAuthToken(token);
}