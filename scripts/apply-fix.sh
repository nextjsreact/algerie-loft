#!/bin/bash
# This script applies the bill update fix using supabase CLI
# For Windows, use this with Git Bash or WSL

# Extract project reference from .env file
PROJECT_ID=$(grep SUPABASE_PROJECT_ID .env | cut -d '=' -f2)
if [ -z "$PROJECT_ID" ]; then
  PROJECT_ID=$(grep NEXT_PUBLIC_SUPABASE_URL .env | sed 's/.*\/\/\(.*\)\.supabase.co.*/\1/')
fi

echo "Using Supabase project ID: $PROJECT_ID"

# Apply the SQL fix
echo "Applying database fix..."
supabase db execute --file ./database/fix-bill-update-function.sql --project-ref "$PROJECT_ID"

echo "✅ Fix applied successfully!"
