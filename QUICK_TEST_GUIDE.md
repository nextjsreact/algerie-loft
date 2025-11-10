# 🚀 Guide de test rapide - Dashboard Client

## 1️⃣ Rafraîchir la page

1. Allez sur `/fr/client/dashboard`
2. Appuyez sur `Ctrl + Shift + R` (ou `Cmd + Shift + R` sur Mac) pour forcer le rafraîchissement
3. Ouvrez la console (F12) pour voir les logs

---

## 2️⃣ Vérifier les logs de la console

### ✅ Logs attendus (succès):
```
✅ Bookings loaded: 0
```
ou
```
✅ Bookings loaded: 3
```

### ❌ Logs d'erreur à surveiller:
```
❌ Failed to load bookings: 500
Error details: { error: "..." }
```

---

## 3️⃣ Que devriez-vous voir ?

### Si AUCUNE réservation:
- Le dashboard charge complètement
- Message: "Aucun séjour à venir"
- Bouton "Explorer les lofts" visible
- Stats à zéro

### Si vous avez des réservations:
- Les cartes de réservation s'affichent
- Photos des lofts (placeholder pour l'instant)
- Dates, prix, statuts corrects
- Stats calculées

---

## 4️⃣ Tester les boutons

### Header:
- [ ] Clic sur "Destination" → Redirige vers `/fr/lofts`
- [ ] Clic sur "Dates" → Redirige vers `/fr/lofts`
- [ ] Clic sur "Voyageurs" → Redirige vers `/fr/lofts`
- [ ] Clic sur "Rechercher" → Redirige vers `/fr/lofts`
- [ ] Clic sur 🔔 (notifications) → Affiche alerte
- [ ] Clic sur ⚙️ (settings) → Redirige vers `/fr/settings`

### Onglets:
- [ ] Clic sur "À venir" → Filtre les réservations futures
- [ ] Clic sur "Historique" → Filtre les réservations passées
- [ ] Clic sur "Favoris" → Affiche message "Aucun favori"

### Actions rapides (sidebar):
- [ ] "Rechercher un loft" → `/fr/lofts`
- [ ] "Mes favoris" → `/fr/client/favorites`
- [ ] "Messages" → `/fr/client/messages`

### Destinations:
- [ ] Clic sur Alger → `/fr/lofts?city=Alger`
- [ ] Clic sur Oran → `/fr/lofts?city=Oran`
- [ ] Clic sur Constantine → `/fr/lofts?city=Constantine`

---

## 5️⃣ Créer des données de test

### Option A: Via Supabase Dashboard
1. Allez sur votre projet Supabase
2. Cliquez sur "SQL Editor"
3. Copiez le contenu de `scripts/create-test-bookings.sql`
4. Exécutez le script
5. Rafraîchissez le dashboard

### Option B: Via l'interface (si disponible)
1. Allez sur `/fr/lofts`
2. Sélectionnez un loft
3. Créez une réservation
4. Retournez au dashboard

---

## 6️⃣ Vérifier l'API directement

Ouvrez dans votre navigateur:
```
http://localhost:3000/api/client/bookings
```

### Réponse attendue (sans données):
```json
{
  "success": true,
  "bookings": [],
  "count": 0,
  "message": "Aucune réservation trouvée"
}
```

### Réponse attendue (avec données):
```json
{
  "success": true,
  "bookings": [
    {
      "id": "...",
      "booking_reference": "BK123456",
      "check_in": "2025-01-20",
      "check_out": "2025-01-25",
      "guests": 2,
      "total_price": 125000,
      "status": "confirmed",
      "payment_status": "paid",
      "loft": {
        "id": "...",
        "name": "Loft Moderne Hydra",
        "address": "...",
        "price_per_night": 25000,
        "images": ["..."]
      }
    }
  ],
  "count": 1
}
```

---

## 7️⃣ Problèmes courants et solutions

### Le dashboard reste en chargement
**Solution**: 
1. Vérifiez la console pour les erreurs
2. Vérifiez que l'API `/api/client/bookings` retourne 200
3. Rafraîchissez avec Ctrl+Shift+R

### Erreur 401 (Non authentifié)
**Solution**:
1. Reconnectez-vous
2. Vérifiez que le cookie de session existe
3. Allez sur `/fr/login` puis revenez au dashboard

### Erreur 500 (Erreur serveur)
**Solution**:
1. Vérifiez les logs du serveur
2. Vérifiez que les tables `bookings` et `lofts` existent
3. Vérifiez les colonnes de la table `lofts`

### Les images ne s'affichent pas
**Normal pour l'instant**: Les images sont des placeholders Unsplash
**Solution future**: Ajouter une colonne `images` à la table `lofts`

---

## 8️⃣ Checklist finale

- [ ] Dashboard charge sans erreur
- [ ] Avatar s'affiche (ou initiale)
- [ ] Tous les boutons fonctionnent
- [ ] Les onglets changent le contenu
- [ ] L'API retourne des données (même vides)
- [ ] Pas d'erreur dans la console
- [ ] Le responsive fonctionne (tester sur mobile)

---

## 🆘 Si rien ne fonctionne

1. **Arrêtez le serveur**: `Ctrl+C` dans le terminal
2. **Nettoyez le cache**: `npm run clean` (si disponible)
3. **Redémarrez**: `npm run dev`
4. **Videz le cache du navigateur**: Ctrl+Shift+Delete
5. **Testez en navigation privée**

---

## 📞 Signaler un problème

Si vous trouvez un bug, notez:
1. L'URL exacte
2. Le message d'erreur (console)
3. Les logs du serveur
4. Les étapes pour reproduire

---

**Bonne chance ! 🍀**
