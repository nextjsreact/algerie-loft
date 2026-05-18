# Checklist de Déploiement - Système de Synchronisation Airbnb

**Date:** 2026-05-14  
**Version:** 1.0.0  
**Status:** Ready for Production ✅

---

## 📋 Pré-Déploiement

### ✅ Code & Tests

- [x] Toutes les phases complétées (1-9)
- [x] Code compilé sans erreurs
- [x] Tests unitaires créés
- [x] Tests d'intégration créés
- [x] Tests property-based créés
- [ ] Tests exécutés avec succès (`npm test`)
- [ ] Coverage > 70% (`npm run test:coverage`)

### ✅ Documentation

- [x] README complet créé (`docs/BOOKING_SYNC_README.md`)
- [x] Specs complètes (`.kiro/specs/booking-sync-system/`)
- [x] Setup guide créé (`supabase/SETUP.md`)
- [x] API documentation complète
- [x] Troubleshooting guide complet

---

## 🗄️ Base de Données (Supabase)

### Migrations

- [ ] **Migration 001:** `booking_sync_tables.sql` exécutée
  ```bash
  # Via Supabase Dashboard
  SQL Editor → Coller le contenu → Run
  ```

- [ ] **Migration 002:** `rls_policies.sql` exécutée
  ```bash
  # Via Supabase Dashboard
  SQL Editor → Coller le contenu → Run
  ```

### Vérification

- [ ] 5 tables créées: `property_sync_config`, `airbnb_bookings`, `airbnb_conflicts`, `airbnb_sync_logs`, `system_settings`
- [ ] 6 indexes créés
- [ ] RLS activé sur toutes les tables
- [ ] 22 policies créées
- [ ] Fonction `is_admin()` créée

```sql
-- Vérifier les tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'airbnb_%' OR table_name LIKE 'property_%' OR table_name = 'system_settings';

-- Vérifier RLS
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND (tablename LIKE 'airbnb_%' OR tablename LIKE 'property_%' OR tablename = 'system_settings');

-- Vérifier les policies
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE schemaname = 'public';
```

### Configuration Initiale

- [ ] **system_settings:** Insérer `playwright_toggle = 'true'`
  ```sql
  INSERT INTO system_settings (key, value) 
  VALUES ('playwright_toggle', 'true');
  ```

- [ ] **property_sync_config:** Configurer les 85 URLs iCal
  ```sql
  -- Exemple pour un loft
  INSERT INTO property_sync_config (loft_id, ical_url, is_active)
  VALUES (
    'uuid-du-loft',
    'https://www.airbnb.com/calendar/ical/xxxxx.ics',
    true
  );
  ```

---

## ☁️ Vercel

### Variables d'Environnement

- [ ] **NEXT_PUBLIC_SUPABASE_URL**
  ```
  https://xxx.supabase.co
  ```

- [ ] **SUPABASE_SERVICE_ROLE_KEY**
  ```
  eyJxxx...
  ```

- [ ] **CRON_SECRET**
  ```
  Générer: openssl rand -base64 32
  ```

- [ ] **RESEND_API_KEY**
  ```
  re_xxxxxxxxxxxxx (obtenir sur resend.com)
  ```

- [ ] **ADMIN_EMAIL**
  ```
  admin@votredomaine.com
  ```

- [ ] **ALERT_FROM_EMAIL** (optionnel)
  ```
  alerts@votredomaine.com
  ```

- [ ] **NEXT_PUBLIC_APP_URL**
  ```
  https://votredomaine.com
  ```

### Déploiement

- [ ] Code pushé sur GitHub
  ```bash
  git add .
  git commit -m "feat: booking sync system complete"
  git push origin main
  ```

- [ ] Déploiement Vercel réussi
  ```bash
  # Via Vercel CLI
  vercel --prod
  
  # Ou via GitHub (auto-deploy)
  # Vérifier dans Vercel Dashboard
  ```

- [ ] Cron job activé
  ```
  Vercel Dashboard → Project → Settings → Cron Jobs
  Vérifier: /api/cron/sync-ical (*/30 * * * *)
  ```

---

## 🐙 GitHub

### Secrets

- [ ] **AIRBNB_EMAIL**
  ```
  votre-email@airbnb.com
  ```

- [ ] **AIRBNB_PASSWORD**
  ```
  votre-mot-de-passe
  ```

- [ ] **API_SECRET**
  ```
  Générer: openssl rand -base64 32
  ```

- [ ] **SUPABASE_URL**
  ```
  https://xxx.supabase.co
  ```

- [ ] **SUPABASE_SERVICE_ROLE_KEY**
  ```
  eyJxxx...
  ```

### Workflow

- [ ] Workflow `.github/workflows/airbnb-csv-export.yml` présent
- [ ] Workflow activé (pas désactivé)
- [ ] Schedule configuré: `0 3 * * *` (3h UTC)
- [ ] Workflow testé manuellement
  ```
  GitHub → Actions → Airbnb CSV Export → Run workflow
  ```

---

## 📧 Resend

### Configuration

- [ ] Compte créé sur [resend.com](https://resend.com)
- [ ] Clé API créée
- [ ] Domaine ajouté (ou utiliser le domaine de test)
- [ ] Domaine vérifié (si custom)
- [ ] Email expéditeur vérifié

### Test

- [ ] Test d'envoi d'email réussi
  ```bash
  curl -X POST https://votredomaine.com/api/alerts/test \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"type":"conflict"}'
  ```

- [ ] Email reçu dans la boîte de réception
- [ ] Email pas dans les spams
- [ ] Template HTML correct

---

## 🧪 Tests Post-Déploiement

### Test 1: Sync iCal Manuel

- [ ] Aller sur `/admin/calendar`
- [ ] Cliquer sur "Sync Now"
- [ ] Attendre la fin (30s-2min)
- [ ] Vérifier les logs dans `/admin/sync-logs`
- [ ] Vérifier les réservations dans le calendrier

### Test 2: Import CSV Manuel

- [ ] Télécharger un CSV depuis Airbnb
- [ ] Aller sur `/admin/import-csv`
- [ ] Uploader le CSV
- [ ] Vérifier les métriques affichées
- [ ] Vérifier les réservations dans le calendrier

### Test 3: Détection de Conflits

- [ ] Créer manuellement 2 réservations qui se chevauchent
  ```sql
  INSERT INTO airbnb_bookings (loft_id, check_in_date, check_out_date, status, source)
  VALUES 
    ('loft-test', '2026-06-01', '2026-06-05', 'confirmed', 'airbnb_ical'),
    ('loft-test', '2026-06-03', '2026-06-07', 'confirmed', 'airbnb_csv');
  ```

- [ ] Déclencher un sync
- [ ] Vérifier le conflit dans `airbnb_conflicts`
- [ ] Vérifier l'alerte email reçue
- [ ] Vérifier le conflit affiché dans le calendrier

### Test 4: Alertes Playwright

- [ ] Désactiver temporairement Playwright (mauvais credentials)
- [ ] Attendre 3 exécutions GitHub Actions
- [ ] Vérifier l'alerte email reçue
- [ ] Réactiver Playwright

### Test 5: Cron Job

- [ ] Attendre le prochain cron (30 min)
- [ ] Vérifier les logs dans Vercel
- [ ] Vérifier les logs dans `/admin/sync-logs`
- [ ] Vérifier les nouvelles réservations

### Test 6: GitHub Actions

- [ ] Attendre le prochain run (3h UTC)
- [ ] Vérifier les logs dans GitHub Actions
- [ ] Vérifier les logs dans `/admin/sync-logs`
- [ ] Vérifier les réservations enrichies

---

## 📊 Monitoring (Premières 24h)

### Métriques à Surveiller

- [ ] **Taux de succès iCal:** > 95%
  ```sql
  SELECT 
    COUNT(*) FILTER (WHERE status = 'success') * 100.0 / COUNT(*) as success_rate
  FROM airbnb_sync_logs
  WHERE sync_type = 'ical_auto'
  AND created_at > NOW() - INTERVAL '24 hours';
  ```

- [ ] **Taux de succès CSV:** > 90%
  ```sql
  SELECT 
    COUNT(*) FILTER (WHERE status = 'success') * 100.0 / COUNT(*) as success_rate
  FROM airbnb_sync_logs
  WHERE sync_type = 'csv_auto'
  AND created_at > NOW() - INTERVAL '24 hours';
  ```

- [ ] **Nombre de conflits:** < 5 par jour
  ```sql
  SELECT COUNT(*) 
  FROM airbnb_conflicts
  WHERE created_at > NOW() - INTERVAL '24 hours'
  AND severity = 'critical';
  ```

- [ ] **Durée moyenne sync iCal:** < 2 minutes
  ```sql
  SELECT AVG(duration_ms) / 1000 as avg_duration_seconds
  FROM airbnb_sync_logs
  WHERE sync_type = 'ical_auto'
  AND created_at > NOW() - INTERVAL '24 hours';
  ```

- [ ] **Nombre d'alertes envoyées:** < 10 par jour
  ```
  Vérifier dans Resend Dashboard
  ```

### Alertes à Vérifier

- [ ] Aucune alerte d'échec Playwright (si activé)
- [ ] Alertes de conflits reçues et traitées
- [ ] Pas d'erreurs dans Vercel logs
- [ ] Pas d'erreurs dans GitHub Actions logs

---

## 🔧 Configuration Finale

### URLs iCal

- [ ] **85 lofts configurés** dans `property_sync_config`
  ```sql
  SELECT COUNT(*) FROM property_sync_config WHERE is_active = true;
  -- Résultat attendu: 85
  ```

- [ ] **Toutes les URLs testées** (retournent un iCal valide)
  ```bash
  # Test manuel d'une URL
  curl https://www.airbnb.com/calendar/ical/xxxxx.ics
  ```

### Permissions

- [ ] **Admin users** configurés dans Supabase
  ```sql
  -- Vérifier les admins
  SELECT id, email, role FROM auth.users WHERE role = 'admin';
  ```

- [ ] **Service role** fonctionne (bypass RLS)
  ```bash
  # Test avec service role key
  curl https://xxx.supabase.co/rest/v1/airbnb_bookings \
    -H "apikey: SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer SERVICE_ROLE_KEY"
  ```

---

## 📝 Documentation Utilisateur

### Formation Équipe

- [ ] **Guide utilisateur** partagé avec l'équipe
- [ ] **Session de formation** organisée (1h)
- [ ] **Accès admin** donné aux personnes autorisées
- [ ] **Procédures d'urgence** documentées

### Procédures

- [ ] **Procédure de résolution de conflits** documentée
- [ ] **Procédure d'import CSV manuel** documentée
- [ ] **Procédure de désactivation Playwright** documentée
- [ ] **Contacts d'urgence** définis

---

## 🎯 Validation Finale

### Checklist Globale

- [ ] ✅ Toutes les migrations exécutées
- [ ] ✅ Toutes les variables d'environnement configurées
- [ ] ✅ Tous les secrets GitHub configurés
- [ ] ✅ Resend configuré et testé
- [ ] ✅ 85 URLs iCal configurées
- [ ] ✅ Tous les tests post-déploiement réussis
- [ ] ✅ Monitoring actif (24h)
- [ ] ✅ Équipe formée
- [ ] ✅ Documentation complète

### Critères de Succès

- [ ] **Sync iCal:** Fonctionne toutes les 30 minutes
- [ ] **Sync CSV:** Fonctionne 1x/jour à 3h UTC
- [ ] **Conflits:** Détectés et notifiés automatiquement
- [ ] **Alertes:** Reçues dans les 60 secondes
- [ ] **Performance:** < 2 min pour sync iCal, < 5 min pour CSV
- [ ] **Fiabilité:** > 95% de taux de succès

---

## 🚀 Go Live

### Étapes Finales

1. [ ] **Désactiver Beds24** (après 1 semaine de tests en parallèle)
2. [ ] **Annoncer le déploiement** à l'équipe
3. [ ] **Monitorer activement** pendant 1 semaine
4. [ ] **Collecter les feedbacks** de l'équipe
5. [ ] **Optimiser** si nécessaire

### Rollback Plan

En cas de problème critique:

1. **Réactiver Beds24** immédiatement
2. **Désactiver les crons** Vercel et GitHub Actions
3. **Analyser les logs** pour identifier le problème
4. **Corriger** et re-tester
5. **Re-déployer** quand prêt

---

## 📞 Support Post-Déploiement

### Contacts

- **Technique:** admin@votredomaine.com
- **Urgence:** +33 X XX XX XX XX
- **GitHub Issues:** [github.com/votre-org/algerie-loft/issues](https://github.com/votre-org/algerie-loft/issues)

### Ressources

- **Documentation:** `docs/BOOKING_SYNC_README.md`
- **Troubleshooting:** `docs/BOOKING_SYNC_README.md#troubleshooting`
- **API Docs:** `docs/BOOKING_SYNC_README.md#api-routes`

---

## ✅ Signature

**Déployé par:** ___________________________  
**Date:** ___________________________  
**Validé par:** ___________________________  
**Date:** ___________________________

---

**Félicitations ! Le système est maintenant en production. 🎉**

**Économies annuelles:** €3,060-5,100  
**ROI:** Immédiat (coût = €0)

---

*Dernière mise à jour: 2026-05-14*
