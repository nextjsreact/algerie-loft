# 🔍 Guide de Configuration des Audit Logs

## Problème
La page d'audit des superusers affiche "Failed to fetch audit logs" car la table `audit_logs` n'existe pas encore dans la base de données.

## Solution

### Étape 1 : Créer la table audit_logs

1. **Ouvrez Supabase Dashboard**
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet

2. **Accédez au SQL Editor**
   - Menu de gauche → SQL Editor
   - Cliquez sur "New query"

3. **Copiez et exécutez le SQL**
   
   Copiez le contenu du fichier `database/migrations/create_audit_logs_table.sql` et exécutez-le.

   Ou copiez directement ce SQL :

```sql
-- Create audit_logs table for superuser activity tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  superuser_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_details JSONB,
  target_resource TEXT,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_superuser_id ON audit_logs(superuser_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user_id ON audit_logs(target_user_id);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only superusers can view audit logs
CREATE POLICY "Superusers can view all audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'superuser'
    )
  );

-- Policy: Only superusers can insert audit logs
CREATE POLICY "Superusers can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'superuser'
    )
  );

-- Function to cleanup old audit logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE timestamp < NOW() - (retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all audit logs
CREATE OR REPLACE FUNCTION get_all_audit_logs(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  timestamp TIMESTAMPTZ,
  superuser_id UUID,
  action_type TEXT,
  action_details JSONB,
  target_resource TEXT,
  target_user_id UUID,
  severity TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.timestamp,
    al.superuser_id,
    al.action_type,
    al.action_details,
    al.target_resource,
    al.target_user_id,
    al.severity,
    al.ip_address,
    al.user_agent,
    al.created_at
  FROM audit_logs al
  ORDER BY al.timestamp DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT ON audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_audit_logs TO authenticated;
```

4. **Cliquez sur "Run"** pour exécuter le SQL

### Étape 2 : Vérifier la création

1. Dans Supabase Dashboard → Table Editor
2. Vous devriez voir la table `audit_logs`
3. Vérifiez qu'elle a les colonnes suivantes :
   - id
   - timestamp
   - superuser_id
   - action_type
   - action_details
   - target_resource
   - target_user_id
   - severity
   - ip_address
   - user_agent
   - created_at

### Étape 3 : Tester

1. Rechargez la page d'audit : `/fr/admin/superuser/audit`
2. Vous devriez maintenant voir la page sans erreur
3. Les logs d'audit commenceront à s'accumuler au fur et à mesure des actions

## Types d'Actions Trackées

Les audit logs enregistrent les actions suivantes :

- **SYSTEM** : Modifications système
- **SECURITY** : Événements de sécurité
- **USER_MANAGEMENT** : Gestion des utilisateurs
- **DATA_MANAGEMENT** : Modifications de données
- **BACKUP** : Opérations de sauvegarde
- **MAINTENANCE** : Opérations de maintenance
- **AUDIT_ACCESS** : Accès aux logs d'audit

## Niveaux de Sévérité

- **LOW** : Actions routinières
- **MEDIUM** : Actions importantes
- **HIGH** : Actions critiques
- **CRITICAL** : Actions nécessitant une attention immédiate

## Maintenance

### Nettoyage Automatique

Les logs plus anciens que 90 jours peuvent être nettoyés automatiquement :

```sql
SELECT cleanup_old_audit_logs(90); -- Garde les logs des 90 derniers jours
```

### Export des Logs

Utilisez le bouton "Exporter" dans l'interface pour télécharger les logs en CSV.

## Sécurité

- ✅ RLS activé : Seuls les superusers peuvent voir les logs
- ✅ Audit trail complet : Toutes les actions sont enregistrées
- ✅ Immutabilité : Les logs ne peuvent pas être modifiés (INSERT only)
- ✅ Rétention : Logs conservés pendant 90 jours par défaut

## Dépannage

### Erreur "Failed to fetch audit logs"
- Vérifiez que la table existe dans Supabase
- Vérifiez que vous êtes connecté en tant que superuser
- Vérifiez les politiques RLS

### Aucun log n'apparaît
- Les logs commencent à s'accumuler après la création de la table
- Effectuez quelques actions dans l'interface superuser pour générer des logs

### Erreur de permissions
- Vérifiez que votre utilisateur a le rôle 'superuser' dans `raw_user_meta_data`
- Vérifiez les politiques RLS de la table

## Support

Pour toute question, consultez la documentation Supabase ou contactez le support technique.
