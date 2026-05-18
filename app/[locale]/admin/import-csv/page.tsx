/**
 * Manual CSV Import Page
 * 
 * Page pour uploader manuellement un fichier CSV Airbnb.
 * Affiche les résultats du matching et du traitement.
 */

'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Download,
} from 'lucide-react';

interface ImportResult {
  success: boolean;
  filename: string;
  duration_ms: number;
  parsing: {
    total_lines: number;
    parsed_lines: number;
    parse_errors: number;
  };
  matching: {
    total_entries: number;
    exact_matches: number;
    fuzzy_matches: number;
    no_matches: number;
  };
  processing: {
    enriched: number;
    created: number;
    errors: number;
  };
  error_details: Array<{
    type: 'parse' | 'process';
    line?: number;
    listing?: string;
    error: string;
  }>;
}

export default function ImportCSVPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Vérifier que c'est un CSV
      if (!file.name.endsWith('.csv')) {
        setError('Le fichier doit être un CSV');
        return;
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Le fichier est trop volumineux (max 5MB)');
        return;
      }

      setFile(file);
      setError(null);
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import/csv', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'import');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Import CSV Manuel</h1>
        <p className="text-muted-foreground">
          Uploadez un fichier CSV exporté depuis Airbnb pour enrichir les réservations
        </p>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ol className="list-decimal list-inside space-y-2">
            <li>Connectez-vous à votre compte Airbnb</li>
            <li>Allez sur la page des réservations</li>
            <li>Cliquez sur "Export" ou "Exporter"</li>
            <li>Téléchargez le fichier CSV</li>
            <li>Uploadez le fichier ci-dessous</li>
          </ol>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Le fichier doit être au format CSV et ne pas dépasser 5MB (max 1000 réservations).
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Upload Zone */}
      {!result && (
        <Card>
          <CardHeader>
            <CardTitle>Upload du Fichier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                transition-colors
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                ${file ? 'bg-muted/50' : ''}
              `}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="space-y-2">
                  <FileText className="w-12 h-12 mx-auto text-primary" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="font-medium">
                    {isDragActive
                      ? 'Déposez le fichier ici'
                      : 'Glissez-déposez un fichier CSV ou cliquez pour sélectionner'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Format CSV uniquement, max 5MB
                  </p>
                </div>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importer
                  </>
                )}
              </Button>
              {file && (
                <Button variant="outline" onClick={handleReset}>
                  Annuler
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Success Alert */}
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Import réussi !</AlertTitle>
            <AlertDescription className="text-green-700">
              Le fichier <strong>{result.filename}</strong> a été traité en{' '}
              {(result.duration_ms / 1000).toFixed(1)}s
            </AlertDescription>
          </Alert>

          {/* Parsing Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Parsing du CSV</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Lignes totales:</span>
                <Badge variant="outline">{result.parsing.total_lines}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Lignes parsées:</span>
                <Badge className="bg-green-500">{result.parsing.parsed_lines}</Badge>
              </div>
              {result.parsing.parse_errors > 0 && (
                <div className="flex justify-between">
                  <span>Erreurs de parsing:</span>
                  <Badge variant="destructive">{result.parsing.parse_errors}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Matching Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Matching avec iCal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Entrées totales:</span>
                <Badge variant="outline">{result.matching.total_entries}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Exact matches:</span>
                <Badge className="bg-blue-500">{result.matching.exact_matches}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Fuzzy matches:</span>
                <Badge className="bg-purple-500">{result.matching.fuzzy_matches}</Badge>
              </div>
              <div className="flex justify-between">
                <span>No matches:</span>
                <Badge variant="secondary">{result.matching.no_matches}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Processing Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Traitement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Réservations enrichies:</span>
                <Badge className="bg-green-500">{result.processing.enriched}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Réservations créées:</span>
                <Badge className="bg-blue-500">{result.processing.created}</Badge>
              </div>
              {result.processing.errors > 0 && (
                <div className="flex justify-between">
                  <span>Erreurs:</span>
                  <Badge variant="destructive">{result.processing.errors}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error Details */}
          {result.error_details.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Détails des Erreurs</CardTitle>
                <CardDescription>
                  {result.error_details.length} erreur(s) détectée(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {result.error_details.map((err, idx) => (
                    <Alert key={idx} variant="destructive">
                      <AlertDescription>
                        <strong>{err.type === 'parse' ? 'Parsing' : 'Processing'}:</strong>{' '}
                        {err.line && `Ligne ${err.line} - `}
                        {err.listing && `${err.listing} - `}
                        {err.error}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleReset} className="flex-1">
              Importer un autre fichier
            </Button>
            <Button variant="outline" asChild>
              <a href="/admin/sync-logs">
                Voir les logs
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
