"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Eye,
  EyeOff,
  Save,
  X
} from 'lucide-react';

interface SystemConfiguration {
  id: string;
  category: string;
  config_key: string;
  config_value: any;
  data_type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  is_sensitive: boolean;
  requires_restart: boolean;
  modified_by: string;
  modified_at: string;
  previous_value?: any;
  previous_modified_at?: string;
  previous_modified_by?: string;
}

interface ConfigurationFormData {
  category: string;
  config_key: string;
  config_value: string;
  data_type: 'string' | 'number' | 'boolean' | 'json';
  description: string;
  is_sensitive: boolean;
  requires_restart: boolean;
}

export function SystemConfigurationPanel() {
  const [configurations, setConfigurations] = useState<SystemConfiguration[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SystemConfiguration | null>(null);
  const [showSensitiveValues, setShowSensitiveValues] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<ConfigurationFormData>({
    category: '',
    config_key: '',
    config_value: '',
    data_type: 'string',
    description: '',
    is_sensitive: false,
    requires_restart: false
  });

  useEffect(() => {
    fetchConfigurations();
  }, [selectedCategory]);

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      params.append('includeHistory', 'false');

      const response = await fetch(`/api/superuser/system?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch configurations');
      }

      const data = await response.json();
      setConfigurations(data.configurations || []);
      setCategories(['all', ...data.categories]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConfiguration = async () => {
    try {
      const response = await fetch('/api/superuser/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          config_value: parseConfigValue(formData.config_value, formData.data_type)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create configuration');
      }

      setShowCreateDialog(false);
      resetForm();
      await fetchConfigurations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleUpdateConfiguration = async (id: string, updates: Partial<SystemConfiguration>) => {
    try {
      const response = await fetch(`/api/superuser/system/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update configuration');
      }

      const result = await response.json();
      if (result.requiresRestart) {
        setError('Configuration updated. System restart may be required for changes to take effect.');
      }

      setEditingConfig(null);
      await fetchConfigurations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleDeleteConfiguration = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/superuser/system/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete configuration');
      }

      await fetchConfigurations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleRollbackConfiguration = async (id: string) => {
    if (!confirm('Are you sure you want to rollback this configuration to its previous value?')) {
      return;
    }

    try {
      const response = await fetch(`/api/superuser/system/${id}/rollback`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to rollback configuration');
      }

      const result = await response.json();
      if (result.requiresRestart) {
        setError('Configuration rolled back. System restart may be required for changes to take effect.');
      }

      await fetchConfigurations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const parseConfigValue = (value: string, dataType: string) => {
    switch (dataType) {
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return value === 'true';
      case 'json':
        return JSON.parse(value);
      default:
        return value;
    }
  };

  const formatConfigValue = (value: any, dataType: string) => {
    if (dataType === 'json') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const resetForm = () => {
    setFormData({
      category: '',
      config_key: '',
      config_value: '',
      data_type: 'string',
      description: '',
      is_sensitive: false,
      requires_restart: false
    });
  };

  const toggleSensitiveValue = (configId: string) => {
    const newSet = new Set(showSensitiveValues);
    if (newSet.has(configId)) {
      newSet.delete(configId);
    } else {
      newSet.add(configId);
    }
    setShowSensitiveValues(newSet);
  };

  const getDataTypeColor = (dataType: string) => {
    switch (dataType) {
      case 'string': return 'bg-blue-100 text-blue-800';
      case 'number': return 'bg-green-100 text-green-800';
      case 'boolean': return 'bg-purple-100 text-purple-800';
      case 'json': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Configuration Système</h2>
          <p className="text-muted-foreground">
            Gérer les paramètres système et les configurations globales
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Configuration
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4 items-center">
        <Label htmlFor="category-filter">Catégorie</Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sélectionner une catégorie" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category === 'all' ? 'Toutes les catégories' : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => fetchConfigurations()}>
          Actualiser
        </Button>
      </div>

      {/* Configurations List */}
      <div className="space-y-4">
        {configurations.map((config) => (
          <Card key={config.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{config.category}</Badge>
                    <Badge className={getDataTypeColor(config.data_type)}>
                      {config.data_type}
                    </Badge>
                    {config.requires_restart && (
                      <Badge variant="destructive">Redémarrage requis</Badge>
                    )}
                    {config.is_sensitive && (
                      <Badge variant="secondary">Sensible</Badge>
                    )}
                  </div>
                  
                  <h4 className="font-semibold text-lg">{config.config_key}</h4>
                  {config.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {config.description}
                    </p>
                  )}
                  
                  <div className="mt-2">
                    <Label className="text-xs text-muted-foreground">Valeur actuelle:</Label>
                    <div className="mt-1">
                      {config.is_sensitive && !showSensitiveValues.has(config.id) ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                            ••••••••
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleSensitiveValue(config.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded max-w-md truncate">
                            {formatConfigValue(config.config_value, config.data_type)}
                          </span>
                          {config.is_sensitive && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleSensitiveValue(config.id)}
                            >
                              <EyeOff className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {config.previous_value && (
                    <div className="mt-2">
                      <Label className="text-xs text-muted-foreground">Valeur précédente:</Label>
                      <div className="text-sm font-mono bg-yellow-50 px-2 py-1 rounded mt-1">
                        {formatConfigValue(config.previous_value, config.data_type)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Modifié par {config.previous_modified_by} le{' '}
                        {config.previous_modified_at && new Date(config.previous_modified_at).toLocaleString()}
                      </div>
                    </div>
                  )}

                  <div className="mt-2 text-xs text-muted-foreground">
                    Modifié par {config.modified_by} le {new Date(config.modified_at).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingConfig(config)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  {config.previous_value && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRollbackConfiguration(config.id)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteConfiguration(config.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Configuration Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle Configuration</DialogTitle>
            <DialogDescription>
              Ajouter une nouvelle configuration système
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Catégorie</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="ex: database, security, email"
              />
            </div>
            
            <div>
              <Label htmlFor="config_key">Clé de Configuration</Label>
              <Input
                id="config_key"
                value={formData.config_key}
                onChange={(e) => setFormData(prev => ({ ...prev, config_key: e.target.value }))}
                placeholder="ex: max_connections, timeout"
              />
            </div>
            
            <div>
              <Label htmlFor="data_type">Type de Données</Label>
              <Select 
                value={formData.data_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, data_type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="config_value">Valeur</Label>
              {formData.data_type === 'json' ? (
                <Textarea
                  id="config_value"
                  value={formData.config_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, config_value: e.target.value }))}
                  placeholder='{"key": "value"}'
                  rows={3}
                />
              ) : (
                <Input
                  id="config_value"
                  value={formData.config_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, config_value: e.target.value }))}
                  placeholder={
                    formData.data_type === 'boolean' ? 'true ou false' :
                    formData.data_type === 'number' ? '123' : 'valeur'
                  }
                />
              )}
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description de cette configuration"
                rows={2}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_sensitive"
                checked={formData.is_sensitive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_sensitive: checked }))}
              />
              <Label htmlFor="is_sensitive">Données sensibles</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="requires_restart"
                checked={formData.requires_restart}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_restart: checked }))}
              />
              <Label htmlFor="requires_restart">Redémarrage requis</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={handleCreateConfiguration}>
              <Save className="h-4 w-4 mr-2" />
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Configuration Dialog */}
      {editingConfig && (
        <Dialog open={!!editingConfig} onOpenChange={() => setEditingConfig(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier Configuration</DialogTitle>
              <DialogDescription>
                Modifier la configuration: {editingConfig.config_key}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_value">Nouvelle Valeur</Label>
                {editingConfig.data_type === 'json' ? (
                  <Textarea
                    id="edit_value"
                    defaultValue={formatConfigValue(editingConfig.config_value, editingConfig.data_type)}
                    rows={5}
                  />
                ) : (
                  <Input
                    id="edit_value"
                    defaultValue={formatConfigValue(editingConfig.config_value, editingConfig.data_type)}
                  />
                )}
              </div>
              
              {editingConfig.requires_restart && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Cette configuration nécessite un redémarrage du système pour prendre effet.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingConfig(null)}>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button 
                onClick={() => {
                  const newValue = (document.getElementById('edit_value') as HTMLInputElement)?.value;
                  if (newValue !== undefined) {
                    handleUpdateConfiguration(editingConfig.id, {
                      config_value: parseConfigValue(newValue, editingConfig.data_type)
                    });
                  }
                }}
              >
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}