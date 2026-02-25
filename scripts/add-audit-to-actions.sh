#!/bin/bash

# Script pour ajouter le contexte d'audit à toutes les actions
# Remplace createClient par createClientWithAudit dans les fonctions de modification

echo "Adding audit context to action files..."

# Liste des fichiers d'actions à mettre à jour
actions=(
  "app/actions/tasks.ts"
  "app/actions/lofts.ts"
  "app/actions/currencies.ts"
  "app/actions/payment-methods.ts"
  "app/actions/categories.ts"
  "app/actions/owners.ts"
  "app/actions/users.ts"
  "app/actions/teams.ts"
)

for file in "${actions[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Ajouter l'import si pas déjà présent
    if ! grep -q "createClientWithAudit" "$file"; then
      # Trouver la ligne avec createClient import et ajouter après
      sed -i "/import.*createClient.*from.*supabase\/server/a import { createClientWithAudit } from '@/utils/supabase/server-with-audit'" "$file"
      echo "  - Added import"
    fi
    
    # Remplacer createClient() par createClientWithAudit() dans les fonctions create/update/delete
    # Mais seulement dans les fonctions qui modifient les données
    sed -i 's/const supabase = await createClient()\(.*\)\.insert(/const supabase = await createClientWithAudit()\1.insert(/g' "$file"
    sed -i 's/const supabase = await createClient()\(.*\)\.update(/const supabase = await createClientWithAudit()\1.update(/g' "$file"
    sed -i 's/const supabase = await createClient()\(.*\)\.delete(/const supabase = await createClientWithAudit()\1.delete(/g' "$file"
    
    echo "  - Updated createClient calls"
  else
    echo "Skipping $file (not found)"
  fi
done

echo "Done! Audit context added to all action files."
