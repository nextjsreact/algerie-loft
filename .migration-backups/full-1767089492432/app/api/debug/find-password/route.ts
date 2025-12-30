import { NextRequest, NextResponse } from 'next/server';
import { getEnhancedSession } from '@/lib/auth/enhanced-auth';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getEnhancedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const results: any = {
      user_id: session.user.id,
      email: session.user.email,
      sources_checked: []
    };

    // 1. Check profiles table - all password-related columns
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profile) {
      const passwordFields = Object.keys(profile).filter(key => 
        key.toLowerCase().includes('pass') || key.toLowerCase().includes('pwd')
      );
      results.sources_checked.push({
        source: 'profiles table',
        found: passwordFields.length > 0,
        fields: passwordFields.map(field => ({
          field,
          value: profile[field]
        }))
      });
    }

    // 2. Check employees table
    const { data: employee } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (employee) {
      const passwordFields = Object.keys(employee).filter(key => 
        key.toLowerCase().includes('pass') || key.toLowerCase().includes('pwd')
      );
      results.sources_checked.push({
        source: 'employees table',
        found: passwordFields.length > 0,
        fields: passwordFields.map(field => ({
          field,
          value: employee[field]
        }))
      });
    }

    // 3. Check auth.users metadata
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const metadataPasswords = {
        user_metadata: {} as any,
        app_metadata: {} as any
      };

      // Check user_metadata
      if (user.user_metadata) {
        Object.keys(user.user_metadata).forEach(key => {
          if (key.toLowerCase().includes('pass') || key.toLowerCase().includes('pwd')) {
            metadataPasswords.user_metadata[key] = user.user_metadata[key];
          }
        });
      }

      // Check app_metadata
      if (user.app_metadata) {
        Object.keys(user.app_metadata).forEach(key => {
          if (key.toLowerCase().includes('pass') || key.toLowerCase().includes('pwd')) {
            metadataPasswords.app_metadata[key] = user.app_metadata[key];
          }
        });
      }

      results.sources_checked.push({
        source: 'auth.users metadata',
        found: Object.keys(metadataPasswords.user_metadata).length > 0 || 
               Object.keys(metadataPasswords.app_metadata).length > 0,
        user_metadata: metadataPasswords.user_metadata,
        app_metadata: metadataPasswords.app_metadata
      });
    }

    // 4. Check if there's a custom table for passwords
    const { data: customTables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .like('table_name', '%password%');

    if (customTables) {
      results.sources_checked.push({
        source: 'custom password tables',
        tables: customTables
      });
    }

    return NextResponse.json(results, { status: 200 });

  } catch (error: any) {
    console.error('Debug password error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
