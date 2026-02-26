"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from 'lucide-react';

export function BackupManager() {
  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Database className="h-8 w-8" />
              Gestion des Sauvegardes
            </h1>
            <p className="text-purple-100 mt-2">
              Système de sauvegarde et restauration de la base de données
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Système de Sauvegarde</CardTitle>
          <CardDescription>
            La fonctionnalité de sauvegarde est en cours de développement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Cette page permettra de créer, gérer et restaurer les sauvegardes de la base de données.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
