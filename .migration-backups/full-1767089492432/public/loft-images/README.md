# Loft Images Directory

Ce répertoire contient les images qui seront affichées dans le carrousel de la page publique.

## Comment ajouter vos propres images

1. **Formats supportés** : JPG, JPEG, PNG, WebP
2. **Noms recommandés** :
   - `loft-1.jpg`, `loft-2.jpg`, etc. (images principales des lofts)
   - `interior-1.jpg`, `interior-2.jpg`, etc. (vues intérieures)
   - `kitchen.jpg` (cuisine)
   - `bedroom.jpg` (chambre)
   - `bathroom.jpg` (salle de bain)
   - `living-room.jpg` (salon)
   - `terrace.jpg` (terrasse)

3. **Taille recommandée** : 1920x1080 pixels ou plus pour une qualité optimale
4. **Optimisation** : Les images seront automatiquement optimisées par Next.js

## Images actuelles

Actuellement, le système utilise des images placeholder de haute qualité depuis Unsplash. 
Dès que vous ajouterez vos propres images dans ce répertoire avec les noms recommandés, 
elles remplaceront automatiquement les images placeholder.

## Exemple de structure

```
public/loft-images/
├── loft-1.jpg          (Image principale du loft)
├── loft-2.jpg          (Deuxième loft)
├── kitchen.jpg         (Cuisine équipée)
├── bedroom.jpg         (Chambre)
├── living-room.jpg     (Salon)
└── terrace.jpg         (Terrasse)
```

Le système détectera automatiquement vos images et les affichera dans le carrousel avec des titres et descriptions appropriés.