"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Download, FileText, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AuditFilters } from '@/lib/types';

interface AuditExportProps {
  filters: AuditFilters;
  className?: string;
}

interface ExportOptions {
  format: 'csv' | 'json';
  fields: string[];
  includeValues: boolean;
}

const AVAILABLE_FIELDS = [
  { id: 'id', label: 'ID', description: 'Identifiant unique du log' },
  { id: 'tableName', label: 'Table', description: 'Nom de la table' },
  { id: 'recordId', label: 'ID Enregistrement', description: 'ID de l\'enregistrement modifié' },
  { id: 'action', label: 'Action', description: 'Type d\'opération (INSERT/UPDATE/DELETE)' },
  { id: 'userId', label: 'ID Utilisateur', description: 'ID de l\'utilisateur' },
  { id: 'userEmail', label: 'Email Utilisateur', description: 'Email de l\'utilisateur' },
  { id: 'timestamp', label: 'Horodatage', description: 'Date et heure de l\'opération' },
  { id: 'changedFields', label: 'Champs Modifiés', description: 'Liste des champs modifiés' },
  { id: 'ipAddress', label: 'Adresse IP', description: 'Adresse IP de l\'utilisateur' },
  { id: 'userAgent', label: 'User Agent', description: 'Navigateur de l\'utilisateur' }
];

export function AuditExport({ filters, className }: AuditExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    fields: [],
    includeValues: false
  });

  const { toast } = useToast();

  // Get export progress information
  const getExportProgress = async () => {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/audit/export/progress?${params}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des informations d\'export');
      }

      const result = await response.json();
      
      if (result.success) {
        setTotalRecords(result.data.totalRecords);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du progrès:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les informations d'export",
        variant: "destructive"
      });
    }
  };

  // Handle export execution
  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportProgress(0);

      // Get total records for progress tracking
      await getExportProgress();

      // Simulate progress updates (in a real implementation, you might use WebSockets or polling)
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      const exportPayload = {
        filters,
        format: exportOptions.format,
        fields: exportOptions.fields.length > 0 ? exportOptions.fields : undefined,
        includeValues: exportOptions.includeValues
      };

      const response = await fetch('/api/audit/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(exportPayload)
      });

      clearInterval(progressInterval);
      setExportProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'export');
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `audit-export.${exportOptions.format}`;

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export réussi",
        description: `${totalRecords} enregistrements exportés avec succès`,
      });

      setIsOpen(false);

    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast({
        title: "Erreur d'export",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'export",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Handle field selection
  const handleFieldToggle = (fieldId: string, checked: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      fields: checked 
        ? [...prev.fields, fieldId]
        : prev.fields.filter(f => f !== fieldId)
    }));
  };

  // Select all fields
  const handleSelectAllFields = () => {
    setExportOptions(prev => ({
      ...prev,
      fields: AVAILABLE_FIELDS.map(f => f.id)
    }));
  };

  // Clear all fields
  const handleClearAllFields = () => {
    setExportOptions(prev => ({
      ...prev,
      fields: []
    }));
  };

  React.useEffect(() => {
    if (isOpen) {
      getExportProgress();
    }
  }, [isOpen, filters]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Exporter les logs d'audit</DialogTitle>
          <DialogDescription>
            Configurez les options d'export pour les logs d'audit.
            {totalRecords > 0 && (
              <span className="block mt-1 font-medium">
                {totalRecords} enregistrement{totalRecords > 1 ? 's' : ''} à exporter
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Format d'export</label>
            <Select
              value={exportOptions.format}
              onValueChange={(value: 'csv' | 'json') => 
                setExportOptions(prev => ({ ...prev, format: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    CSV (Comma Separated Values)
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center">
                    <Database className="h-4 w-4 mr-2" />
                    JSON (JavaScript Object Notation)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Field Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Champs à inclure</label>
              <div className="space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllFields}
                >
                  Tout sélectionner
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllFields}
                >
                  Tout désélectionner
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto border rounded-md p-3">
              {AVAILABLE_FIELDS.map(field => (
                <div key={field.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={field.id}
                    checked={exportOptions.fields.includes(field.id)}
                    onCheckedChange={(checked) => 
                      handleFieldToggle(field.id, checked as boolean)
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor={field.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {field.label}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {field.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {exportOptions.fields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Aucun champ sélectionné. Tous les champs seront inclus par défaut.
              </p>
            )}
          </div>

          {/* Include Values Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeValues"
              checked={exportOptions.includeValues}
              onCheckedChange={(checked) => 
                setExportOptions(prev => ({ ...prev, includeValues: checked as boolean }))
              }
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="includeValues"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Inclure les anciennes et nouvelles valeurs
              </label>
              <p className="text-xs text-muted-foreground">
                Inclut les colonnes avec les valeurs avant et après modification (augmente la taille du fichier)
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Export en cours...</span>
                <span>{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="w-full" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isExporting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || totalRecords === 0}
            >
              {isExporting ? 'Export en cours...' : 'Exporter'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}