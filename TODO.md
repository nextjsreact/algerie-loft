# TODO - Journal & Avis (client)

## Étape 1 — API agrégateur
- [x] Créer `app/api/client/journal-avis/route.ts`
  - Renvoie : `notifications`, `airbnbNotifications`, `reviews` (à partir des bookings du client + `loft_reviews`)

## Étape 2 — Page dédiée
- [x] Créer `app/[locale]/client/journal-avis/page.tsx`
  - Affiche 2 cartes : **Journal** (réutilise `NotificationsWrapper`) et **Avis** (liste des reviews)

## Étape 3 — Vérifications
- [ ] Tester l’URL :
  - `/fr/client/journal-avis`
  - `/en/client/journal-avis` (si locale disponible)
- [ ] Vérifier que le journal s’affiche (notifications + Airbnb)
- [ ] Vérifier que les avis s’affichent (reviews des lofts avec bookings client)

## Étape 4 — Ajustements UX / données
- [ ] Remplacer `userRole/userId` temporaires dans la page par les vraies données de session si nécessaire
- [ ] Si le mapping client↔reviews nécessite un champ différent que `bookings.client_id`, ajuster la requête côté API
