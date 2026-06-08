# 🔔 Intégration du Composant de Notifications dans la Navbar

## Instructions pour Ajouter le Composant

Le composant `AirbnbNotificationsBell` est prêt à être intégré dans votre navbar. Voici comment procéder :

---

## 📍 Localisation de la Navbar

Vous devez trouver le fichier de votre navbar. Les emplacements possibles :

```
components/layout/navbar.tsx
components/navbar.tsx
components/layout/header.tsx
components/header.tsx
app/components/navbar.tsx
```

---

## 🔧 Étapes d'Intégration

### Étape 1 : Importer le Composant

Ajoutez cet import en haut de votre fichier navbar :

```typescript
import { AirbnbNotificationsBell } from '@/components/admin/airbnb-notifications-bell';
```

### Étape 2 : Vérifier le Rôle Admin

Assurez-vous que vous avez accès au rôle de l'utilisateur. Exemple :

```typescript
// Si vous utilisez un hook personnalisé
const { user } = useAuth();
const isAdmin = user?.role === 'admin';

// Ou si vous utilisez Supabase directement
const { data: { user } } = await supabase.auth.getUser();
const { data: userData } = await supabase
  .from('users')
  .select('role')
  .eq('id', user?.id)
  .single();
const isAdmin = userData?.role === 'admin';
```

### Étape 3 : Ajouter le Composant

Ajoutez le composant dans votre navbar, **uniquement pour les admins** :

```typescript
export function Navbar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <nav className="border-b">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo et navigation */}
        <div className="flex items-center gap-4">
          <Logo />
          <NavigationMenu />
        </div>

        {/* Actions à droite */}
        <div className="flex items-center gap-2">
          {/* Autres boutons (recherche, paramètres, etc.) */}
          
          {/* 🔔 AJOUTER ICI : Notifications Airbnb (admins uniquement) */}
          {isAdmin && <AirbnbNotificationsBell />}
          
          {/* Menu utilisateur */}
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
```

---

## 🎨 Exemples d'Intégration

### Exemple 1 : Navbar Simple

```typescript
import { Bell, Settings, User } from 'lucide-react';
import { AirbnbNotificationsBell } from '@/components/admin/airbnb-notifications-bell';

export function Navbar() {
  const isAdmin = true; // Remplacer par votre logique

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="text-xl font-bold">Algerie Loft</div>
        
        <div className="flex items-center gap-3">
          {isAdmin && <AirbnbNotificationsBell />}
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
```

### Exemple 2 : Navbar avec Menu Déroulant

```typescript
import { AirbnbNotificationsBell } from '@/components/admin/airbnb-notifications-bell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <nav className="border-b">
      <div className="flex items-center justify-between px-6 py-4">
        <Logo />
        
        <div className="flex items-center gap-4">
          {/* Notifications Airbnb */}
          {isAdmin && <AirbnbNotificationsBell />}
          
          {/* Menu utilisateur */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profil</DropdownMenuItem>
              <DropdownMenuItem>Paramètres</DropdownMenuItem>
              <DropdownMenuItem>Déconnexion</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
```

### Exemple 3 : Navbar avec Plusieurs Rôles

```typescript
import { AirbnbNotificationsBell } from '@/components/admin/airbnb-notifications-bell';

export function Navbar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'super_admin';
  const canViewNotifications = isAdmin || isSuperAdmin;

  return (
    <nav className="border-b">
      <div className="flex items-center justify-between px-4 py-3">
        <Logo />
        
        <div className="flex items-center gap-3">
          {/* Notifications visibles pour admin et super_admin */}
          {canViewNotifications && <AirbnbNotificationsBell />}
          
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
```

---

## 🎯 Positionnement Recommandé

Le composant de notifications devrait être placé :

1. **À droite de la navbar** (près du menu utilisateur)
2. **Avant le menu utilisateur** (pour une meilleure visibilité)
3. **Avec un espacement de 2-3 unités** (gap-2 ou gap-3)

**Ordre recommandé (de gauche à droite) :**
```
Logo | Navigation | [Espace] | Recherche | Notifications | Paramètres | Utilisateur
```

---

## 🔍 Vérification

Après l'intégration, vérifiez que :

- [ ] Le composant s'affiche uniquement pour les admins
- [ ] L'icône de cloche est visible
- [ ] Le badge rouge apparaît s'il y a des notifications non lues
- [ ] Le clic sur la cloche ouvre le panel
- [ ] Les notifications se chargent correctement
- [ ] Le marquage comme lu fonctionne
- [ ] Le style s'intègre bien avec votre navbar

---

## 🎨 Personnalisation du Style

### Modifier la Taille de l'Icône

```typescript
<AirbnbNotificationsBell />

// Dans le composant, ligne 158 :
<Bell className="h-5 w-5" /> // Changer h-5 et w-5
```

### Modifier la Couleur du Badge

```typescript
// Dans le composant, ligne 161 :
<Badge 
  variant="destructive" // Changer en "default", "secondary", etc.
  className="..."
>
```

### Modifier la Position du Panel

```typescript
// Dans le composant, ligne 172 :
<PopoverContent 
  className="w-[420px] p-0" 
  align="end" // Changer en "start" ou "center"
  sideOffset={8} // Ajuster l'espacement
>
```

---

## 🐛 Dépannage

### Le composant ne s'affiche pas

**Vérifiez :**
1. L'import est correct
2. La condition `isAdmin` est vraie
3. Le composant est bien dans le JSX
4. Pas d'erreur dans la console

### Le badge ne s'affiche pas

**Vérifiez :**
1. La migration SQL a été appliquée
2. Il y a des notifications non lues dans la DB
3. L'API `/api/airbnb/notifications` fonctionne
4. Pas d'erreur dans la console réseau

### Le panel ne s'ouvre pas

**Vérifiez :**
1. Les composants UI (Popover) sont installés
2. Pas de conflit CSS
3. Le z-index est correct
4. Pas d'erreur JavaScript

---

## 📦 Dépendances Requises

Assurez-vous que ces packages sont installés :

```json
{
  "@radix-ui/react-popover": "^1.1.4",
  "@radix-ui/react-scroll-area": "^1.2.2",
  "lucide-react": "^0.454.0",
  "sonner": "^1.7.4"
}
```

Si manquants, installez-les :

```bash
npm install @radix-ui/react-popover @radix-ui/react-scroll-area lucide-react sonner
```

---

## ✅ Checklist d'Intégration

- [ ] Importer le composant dans la navbar
- [ ] Vérifier le rôle admin
- [ ] Ajouter le composant dans le JSX
- [ ] Tester l'affichage (admin uniquement)
- [ ] Tester le clic sur la cloche
- [ ] Tester le chargement des notifications
- [ ] Tester le marquage comme lu
- [ ] Vérifier le style et l'alignement
- [ ] Tester sur mobile (responsive)
- [ ] Déployer en production

---

## 🚀 Prochaines Étapes

Après l'intégration :

1. **Appliquer la migration SQL** dans Supabase
2. **Tester avec des données réelles** (scraper Python)
3. **Ajuster le style** si nécessaire
4. **Former les admins** à l'utilisation
5. **Monitorer les performances** (polling)

---

## 📞 Besoin d'Aide ?

Si vous rencontrez des problèmes :

1. Vérifiez les logs de la console
2. Vérifiez les requêtes réseau (onglet Network)
3. Vérifiez que la migration SQL est appliquée
4. Vérifiez que l'utilisateur est bien admin

---

**Date :** 2026-06-01  
**Version :** 1.0.0  
**Composant :** AirbnbNotificationsBell
