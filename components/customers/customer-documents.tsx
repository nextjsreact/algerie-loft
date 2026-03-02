'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  CreditCard,
  FileCheck,
  File,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';

interface CustomerDocument {
  id: string;
  customer_id: string;
  document_type: string;
  document_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  notes?: string;
}

interface CustomerDocumentsProps {
  customerId: string;
}

export function CustomerDocuments({ customerId }: CustomerDocumentsProps) {
  const t = useTranslations('customers');
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('identity_card');
  const [notes, setNotes] = useState('');
  const [viewingDocument, setViewingDocument] = useState<CustomerDocument | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchDocuments();
  }, [customerId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customer_documents')
        .select('*')
        .eq('customer_id', customerId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Le fichier est trop volumineux (max 10MB)');
        return;
      }

      // Vérifier le type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Type de fichier non supporté. Utilisez JPG, PNG, WebP ou PDF');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    try {
      setUploading(true);

      // Générer un nom de fichier unique
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${customerId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('customer-documents')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Enregistrer dans la base de données
      const { error: dbError } = await supabase
        .from('customer_documents')
        .insert({
          customer_id: customerId,
          document_type: documentType,
          document_name: selectedFile.name,
          file_path: fileName,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
          notes: notes || null
        });

      if (dbError) throw dbError;

      toast.success('Document uploadé avec succès');
      setShowUploadDialog(false);
      setSelectedFile(null);
      setNotes('');
      setDocumentType('identity_card');
      fetchDocuments();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error(`Erreur lors de l'upload: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (document: CustomerDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('customer-documents')
        .download(document.file_path);

      if (error) throw error;

      // Créer un lien de téléchargement
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.document_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Document téléchargé');
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast.error(`Erreur lors du téléchargement: ${error.message}`);
    }
  };

  const handleView = async (document: CustomerDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('customer-documents')
        .createSignedUrl(document.file_path, 3600); // URL valide 1h

      if (error) throw error;

      setViewingDocument({ ...document, file_path: data.signedUrl });
    } catch (error: any) {
      console.error('Error viewing document:', error);
      toast.error(`Erreur lors de l'affichage: ${error.message}`);
    }
  };

  const handleDelete = async (documentId: string, filePath: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      // Supprimer de Storage
      const { error: storageError } = await supabase.storage
        .from('customer-documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Supprimer de la base de données
      const { error: dbError } = await supabase
        .from('customer_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;

      toast.success('Document supprimé');
      fetchDocuments();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'identity_card':
      case 'passport':
        return <CreditCard className="h-4 w-4" />;
      case 'contract':
        return <FileCheck className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      identity_card: 'Carte d\'identité',
      passport: 'Passeport',
      contract: 'Contrat',
      other: 'Autre'
    };
    return labels[type] || type;
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'identity_card':
      case 'passport':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'contract':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-xl rounded-3xl"></div>
        <Card className="relative bg-black/40 backdrop-blur-xl border border-indigo-500/30 shadow-2xl shadow-indigo-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white">Documents</CardTitle>
                  <CardDescription className="text-indigo-300">
                    Pièces d'identité et contrats scannés
                  </CardDescription>
                </div>
              </div>
              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white">
                    <Upload className="h-4 w-4 mr-2" />
                    Ajouter un document
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-indigo-500/30">
                  <DialogHeader>
                    <DialogTitle className="text-white">Ajouter un document</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Uploadez une pièce d'identité, un contrat ou tout autre document
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="document-type" className="text-white">Type de document</Label>
                      <Select value={documentType} onValueChange={setDocumentType}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="identity_card">Carte d'identité</SelectItem>
                          <SelectItem value="passport">Passeport</SelectItem>
                          <SelectItem value="contract">Contrat</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="file" className="text-white">Fichier</Label>
                      <Input
                        id="file"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileSelect}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                      <p className="text-xs text-slate-400">
                        Formats acceptés: JPG, PNG, WebP, PDF (max 10MB)
                      </p>
                      {selectedFile && (
                        <div className="flex items-center gap-2 p-2 bg-slate-800 rounded border border-slate-700">
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                          <span className="text-sm text-white">{selectedFile.name}</span>
                          <span className="text-xs text-slate-400">({formatFileSize(selectedFile.size)})</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-white">Notes (optionnel)</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ajoutez des notes sur ce document..."
                        className="bg-slate-800 border-slate-700 text-white"
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={handleUpload}
                      disabled={!selectedFile || uploading}
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Upload en cours...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Uploader
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-slate-500/20 to-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-slate-400">Aucun document</p>
                <p className="text-sm text-slate-500 mt-1">Ajoutez des pièces d'identité ou des contrats</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/10 hover:border-indigo-500/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg">
                        {getDocumentTypeIcon(doc.document_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-white">{doc.document_name}</h4>
                          <Badge className={getDocumentTypeColor(doc.document_type)}>
                            {getDocumentTypeLabel(doc.document_type)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>•</span>
                          <span>{new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}</span>
                          {doc.notes && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-xs">{doc.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleView(doc)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownload(doc)}
                        className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(doc.id, doc.file_path)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de visualisation */}
      <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
        <DialogContent className="max-w-4xl bg-slate-900 border-indigo-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">{viewingDocument?.document_name}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {viewingDocument && getDocumentTypeLabel(viewingDocument.document_type)}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {viewingDocument && (
              viewingDocument.mime_type === 'application/pdf' ? (
                <iframe
                  src={viewingDocument.file_path}
                  className="w-full h-[600px] rounded-lg border border-slate-700"
                  title={viewingDocument.document_name}
                />
              ) : (
                <img
                  src={viewingDocument.file_path}
                  alt={viewingDocument.document_name}
                  className="w-full h-auto rounded-lg border border-slate-700"
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
