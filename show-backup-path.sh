#!/bin/bash

echo ""
echo "========================================"
echo "   CHEMIN DES DUMPS DE SAUVEGARDE"
echo "========================================"
echo ""
echo "Chemin absolu du dossier backups:"
echo "$(pwd)/backups"
echo ""
echo "Contenu du dossier:"
echo ""

if [ -d "backups" ]; then
    if ls backups/*.sql 1> /dev/null 2>&1; then
        ls -lh backups/*.sql
    else
        echo "[Aucun fichier .sql trouvé]"
    fi
else
    echo "[Le dossier backups n'existe pas encore]"
    echo "Il sera créé automatiquement lors de la première sauvegarde"
fi

echo ""
echo "========================================"
echo "Pour ouvrir le dossier:"
echo "  cd backups"
echo "========================================"
echo ""
