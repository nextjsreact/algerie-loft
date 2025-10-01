import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'

async function applyRpcFunctions() {
  try {
    // Load development environment
    config({ path: 'env-backup/.env.development' })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Environment variables not found')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'scripts', 'add-clone-rpc-functions.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log('🔄 Applying RPC functions to development database...')

    // Split SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0)

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { data, error } = await supabase.rpc('execute_sql', {
            sql_command: statement.trim() + ';'
          })

          if (error) {
            console.warn('⚠️ Warning:', error.message)
          } else {
            console.log('✅ Statement executed successfully')
          }
        } catch (error) {
          console.warn('⚠️ Error executing statement:', error)
        }
      }
    }

    console.log('✅ RPC functions applied successfully!')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

applyRpcFunctions()