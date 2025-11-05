/**
 * Utility functions for superuser operations
 * These are not Server Actions, just utility functions
 */

/**
 * Generate secure temporary password
 */
export function generateSecureTemporaryPassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghijkmnpqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%^&*';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Validate IP address against allowed ranges
 */
export function validateIPAddress(
  clientIP: string,
  allowedRanges: string[]
): { isAllowed: boolean; matchedRange?: string } {
  if (allowedRanges.length === 0) {
    return { isAllowed: true };
  }

  for (const range of allowedRanges) {
    if (range === '*' || range === '0.0.0.0/0') {
      return { isAllowed: true, matchedRange: range };
    }

    if (range.includes('/')) {
      // CIDR notation
      if (isIPInCIDR(clientIP, range)) {
        return { isAllowed: true, matchedRange: range };
      }
    } else if (range.includes('*')) {
      // Wildcard notation
      const pattern = range.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(clientIP)) {
        return { isAllowed: true, matchedRange: range };
      }
    } else {
      // Exact match
      if (clientIP === range) {
        return { isAllowed: true, matchedRange: range };
      }
    }
  }

  return { isAllowed: false };
}

/**
 * Check if IP is in CIDR range
 */
function isIPInCIDR(ip: string, cidr: string): boolean {
  try {
    const [network, prefixLength] = cidr.split('/');
    const prefix = parseInt(prefixLength, 10);
    
    const ipNum = ipToNumber(ip);
    const networkNum = ipToNumber(network);
    const mask = (0xffffffff << (32 - prefix)) >>> 0;
    
    return (ipNum & mask) === (networkNum & mask);
  } catch (error) {
    return false;
  }
}

/**
 * Convert IP address to number
 */
function ipToNumber(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

/**
 * Generate session token
 */
export function generateSessionToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash token for logging
 */
export function hashToken(token: string): string {
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate secure random string
 */
export function generateSecureRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}