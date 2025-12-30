import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest } from 'next/server';

/**
 * Check if user is authenticated from middleware context
 */
export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {
            // No-op for read-only operations in middleware
          },
          remove() {
            // No-op for read-only operations in middleware
          },
        },
      }
    );

    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking authentication in middleware:', error);
    return false;
  }
}

/**
 * Get preferred locale from Accept-Language header
 */
export function getPreferredLocale(acceptLanguage: string): string {
  if (acceptLanguage.includes('en')) {
    return 'en';
  } else if (acceptLanguage.includes('ar')) {
    return 'ar';
  }
  return 'fr'; // default
}