# TODO - Journal & Avis (client)

## Étape 1 — API agrégateur
- [x] Créer `app/api/client/journal-avis/route.ts`
  - Renvoie : `user`, `notifications`, `airbnbNotifications`, `reviews`, `bookings`

## Étape 2 — Page dédiée
- [x] Créer `app/[locale]/client/journal-avis/page.tsx`
  - Affiche 2 cartes : **Journal** (réutilise `NotificationsWrapper`) et **Avis** (liste des reviews)

## Étape 3 — Vérifications
- [ ] Tester l’URL :
  - `/fr/client/journal-avis`
  - `/en/client/journal-avis` (si locale disponible)
- [ ] Vérifier que le journal s’affiche (notifications + Airbnb)
- [ ] Vérifier que les avis s’affichent (reviews du client liées à ses bookings)

## Étape 4 — Ajustements UX / données
- [x] Remplacer `userRole/userId` temporaires dans la page par les vraies données de session renvoyées par l’API
- [x] Ajouter un accès rapide depuis le dashboard client vers `/client/journal-avis`
- [x] Corriger le mapping des reviews pour afficher uniquement les avis du client connecté
- [x] Ajouter les traductions `client.journalAvis` pour FR, EN et AR
- [ ] Si le mapping client↔reviews nécessite un champ différent que `loft_reviews.client_id`, ajuster la requête côté API
