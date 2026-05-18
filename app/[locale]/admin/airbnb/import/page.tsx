'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileJson, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { AirbnbSyncResponse } from '@/lib/types/airbnb';

interface ImportResult {
  success: boolean;
  sync_batch_id?: string;
  metrics?: {
    processed: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
    conflicts: number;
  };
  errors?: Array<{ reservation_id: string; error: string }>;
  warnings?: Array<{ reservation_id: string; warning: string }>;
}

export default function AirbnbImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Gérer la sélection du fichier
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Vérifier que c'est un fichier JSON
    if (!selectedFile.name.endsWith('.json')) {
      setError('Le fichier doit être au format JSON');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);

    // Lire et prévisualiser le contenu
    try {
      const text = await selectedFile.text();
      const json = JSON.parse(text);
      setPreview(json);
    } catch (err) {
      setError('Erreur lors de la lecture du fichier JSON');
      setFile(null);
      setPreview(null);
    }
  };

  // Importer les données
  const handleImport = async () => {
    if (!preview) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Préparer le payload
      const payload = {
        reservations: Array.isArray(preview) ? preview : preview.reservations || [],
        sync_metadata: preview.sync_metadata || {
          sync_type: 'manual',
          timestamp: new Date().toISOString(),
          script_version: '2.0.0',
        },
      };

      // Envoyer à l'API
      const response = await fetch('/api/airbnb/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data: AirbnbSyncResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'import');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser
  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Import Réservations Airbnb</h1>
        <p className="text-muted-foreground">
          Importez des réservations depuis un fichier JSON exporté par le script Python
        </p>
      </div>

      {/* Étape 1: Sélection du fichier */}
      {!file && (
        <Card>
          <CardHeader>
            <CardTitle>Sélectionner un fichier JSON</CardTitle>
            <CardDescription>
              Choisissez un fichier JSON contenant les réservations Airbnb
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium mb-2">Cliquez pour sélectionner un fichier</p>
                <p className="text-sm text-muted-foreground">ou glissez-déposez un fichier JSON</p>
              </label>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Étape 2: Prévisualisation */}
      {file && preview && !result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5" />
                {file.name}
              </CardTitle>
              <CardDescription>
                {Array.isArray(preview)
                  ? `${preview.length} réservation(s) détectée(s)`
                  : `${preview.reservations?.length || 0} réservation(s) détectée(s)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
                <pre className="text-xs">
                  {JSON.stringify(preview, null, 2).substring(0, 2000)}
                  {JSON.stringify(preview, null, 2).length > 2000 && '\n... (tronqué)'}
                </pre>
              </div>

              <div className="flex gap-4 mt-6">
                <Button onClick={handleImport} disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Importer les réservations
                    </>
                  )}
                </Button>
                <Button onClick={handleReset} variant="outline" disabled={loading}>
                  Annuler
                </Button>
              </div>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Étape 3: Résultat */}
      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Import réussi
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    Import échoué
                  </>
                )}
              </CardTitle>
              <CardDescription>
                Batch ID: {result.sync_batch_id || 'N/A'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Métriques */}
              {result.metrics && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Traitées</p>
                    <p className="text-2xl font-bold">{result.metrics.processed}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Créées</p>
                    <p className="text-2xl font-bold text-green-600">{result.metrics.created}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Mises à jour</p>
                    <p className="text-2xl font-bold text-yellow-600">{result.metrics.updated}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Ignorées</p>
                    <p className="text-2xl font-bold text-gray-600">{result.metrics.skipped}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Échouées</p>
                    <p className="text-2xl font-bold text-red-600">{result.metrics.failed}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Conflits</p>
                    <p className="text-2xl font-bold text-orange-600">{result.metrics.conflicts}</p>
                  </div>
                </div>
              )}

              {/* Avertissements */}
              {result.warnings && result.warnings.length > 0 && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">{result.warnings.length} avertissement(s)</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {result.warnings.slice(0, 5).map((warning, i) => (
                        <li key={i}>
                          {warning.reservation_id}: {warning.warning}
                        </li>
                      ))}
                      {result.warnings.length > 5 && (
                        <li className="text-muted-foreground">
                          ... et {result.warnings.length - 5} autre(s)
                        </li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Erreurs */}
              {result.errors && result.errors.length > 0 && (
                <Alert variant="destructive" className="mb-4">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">{result.errors.length} erreur(s)</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {result.errors.slice(0, 5).map((error, i) => (
                        <li key={i}>
                          {error.reservation_id}: {error.error}
                        </li>
                      ))}
                      {result.errors.length > 5 && (
                        <li className="text-muted-foreground">
                          ... et {result.errors.length - 5} autre(s)
                        </li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <Button onClick={handleReset} className="flex-1">
                  Importer un autre fichier
                </Button>
                <Button
                  onClick={() => router.push('/admin/airbnb/monitoring')}
                  variant="outline"
                  className="flex-1"
                >
                  Voir les logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
