/**
 * Airbnb Sync Settings Page
 * 
 * Page de configuration pour le système de synchronisation Airbnb.
 * Permet de gérer le toggle Playwright et d'autres paramètres.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, AlertTriangle, CheckCircle2, Info, Save } from 'lucide-react';

interface PlaywrightSetting {
  enabled: boolean;
  last_updated: string;
  updated_by: string | null;
}

export default function AirbnbSyncSettingsPage() {
  const [playwrightEnabled, setPlaywrightEnabled] = useState(false);
  const [originalValue, setOriginalValue] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/settings/playwright-toggle', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des paramètres');
      }

      const data = await response.json();
      setPlaywrightEnabled(data.enabled);
      setOriginalValue(data.enabled);
      setLastUpdated(data.last_updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggleChange = (checked: boolean) => {
    setPlaywrightEnabled(checked);
    setSuccess(false);
  };

  const handleSave = () => {
    if (playwrightEnabled !== originalValue) {
      setShowConfirmDialog(true);
    }
  };

  const confirmSave = async () => {
    setShowConfirmDialog(false);
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/settings/playwright-toggle', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: playwrightEnabled,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      const data = await response.json();
      setOriginalValue(playwrightEnabled);
      setLastUpdated(data.last_updated);
      setSuccess(true);

      // Masquer le message de succès après 3 secondes
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = playwrightEnabled !== originalValue;

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Paramètres de Synchronisation Airbnb</h1>
        <p className="text-muted-foreground">
          Gérez les paramètres du système de synchronisation automatique
        </p>
      </div>

      {/* Success Alert */}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Paramètres sauvegardés</AlertTitle>
          <AlertDescription className="text-green-700">
            Les modifications ont été appliquées avec succès
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Playwright Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Export CSV Automatique (Playwright)</CardTitle>
          <CardDescription>
            Active ou désactive l'export automatique quotidien via Playwright
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium">Playwright CSV Export</div>
                  <div className="text-sm text-muted-foreground">
                    Exécution quotidienne à 3h UTC via GitHub Actions
                  </div>
                </div>
                <Switch
                  checked={playwrightEnabled}
                  onCheckedChange={handleToggleChange}
                  disabled={saving}
                />
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                {playwrightEnabled ? (
                  <Badge className="bg-green-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Activé
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    Désactivé
                  </Badge>
                )}
              </div>

              {/* Last Updated */}
              {lastUpdated && (
                <div className="text-sm text-muted-foreground">
                  Dernière modification: {new Date(lastUpdated).toLocaleString('fr-FR')}
                </div>
              )}

              {/* Warning when disabled */}
              {!playwrightEnabled && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    L'export automatique est désactivé. Les réservations ne seront pas enrichies
                    automatiquement avec les détails CSV.
                  </AlertDescription>
                </Alert>
              )}

              {/* Info */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Comment ça marche:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>GitHub Actions vérifie ce toggle avant chaque exécution</li>
                    <li>Si activé: connexion à Airbnb, téléchargement CSV, traitement</li>
                    <li>Si désactivé: l'exécution est annulée</li>
                    <li>Vous pouvez toujours importer manuellement un CSV</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>

      {/* Sync Frequency Info */}
      <Card>
        <CardHeader>
          <CardTitle>Fréquences de Synchronisation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">iCal Automatique</div>
              <div className="text-sm text-muted-foreground">
                Synchronisation des dates de réservation
              </div>
            </div>
            <Badge variant="outline">Toutes les 30 min</Badge>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">CSV Automatique (Playwright)</div>
              <div className="text-sm text-muted-foreground">
                Enrichissement avec détails complets
              </div>
            </div>
            <Badge variant="outline">1x/jour à 3h UTC</Badge>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">CSV Manuel</div>
              <div className="text-sm text-muted-foreground">
                Import manuel par un admin
              </div>
            </div>
            <Badge variant="outline">On-demand</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="flex-1"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder les modifications
            </>
          )}
        </Button>
        {hasChanges && (
          <Button
            variant="outline"
            onClick={() => {
              setPlaywrightEnabled(originalValue);
              setSuccess(false);
            }}
          >
            Annuler
          </Button>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la modification</AlertDialogTitle>
            <AlertDialogDescription>
              {playwrightEnabled ? (
                <>
                  Vous êtes sur le point d'<strong>activer</strong> l'export automatique Playwright.
                  Le système se connectera quotidiennement à Airbnb pour télécharger le CSV.
                </>
              ) : (
                <>
                  Vous êtes sur le point de <strong>désactiver</strong> l'export automatique Playwright.
                  Les réservations ne seront plus enrichies automatiquement avec les détails CSV.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSave}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
