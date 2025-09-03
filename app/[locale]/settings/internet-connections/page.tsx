"use client"

import { getInternetConnectionTypes, deleteInternetConnectionType } from '@/app/actions/internet-connections';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Wifi, Signal, Globe, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { InternetConnectionType } from "@/lib/types";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import "@/styles/internet-connections.css";

const getConnectionIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'fiber':
    case 'fibre':
      return <Signal className="h-5 w-5" />
    case 'adsl':
    case 'dsl':
      return <Globe className="h-5 w-5" />
    case 'wifi':
    case 'wireless':
      return <Wifi className="h-5 w-5" />
    default:
      return <Wifi className="h-5 w-5" />
  }
}

const getConnectionColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'actif':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'inactive':
    case 'inactif':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    case 'maintenance':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

export default function InternetConnectionsPage() {
  const t = useTranslations('internetConnections');
  const tCommon = useTranslations('common');
  const [internetConnectionTypes, setInternetConnectionTypes] = useState<InternetConnectionType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    connection: InternetConnectionType | null
  }>({ isOpen: false, connection: null })
  const itemsPerPage = 6 // 6 éléments par page pour une grille 3x2, optimisé

  useEffect(() => {
    async function loadInternetConnections() {
      try {
        const { data, error } = await getInternetConnectionTypes()
        if (error) {
          setError(error.message)
        } else {
          setInternetConnectionTypes(data || [])
        }
      } catch (err) {
        setError('Failed to load internet connection types')
        console.error('Failed to load internet connections:', err)
      } finally {
        setLoading(false)
      }
    }
    loadInternetConnections()
  }, [])

  const handleDelete = (connection: InternetConnectionType) => {
    setConfirmDialog({ isOpen: true, connection })
  }

  const handleConfirmDelete = async () => {
    if (!confirmDialog.connection) return
    
    const connection = confirmDialog.connection
    setDeletingId(connection.id)
    
    try {
      console.log('Attempting to delete connection:', connection.id)
      const { error } = await deleteInternetConnectionType(connection.id)
      
      if (error) {
        console.error('Delete failed with error:', error)
        toast.error(t('deleteError'), {
          description: error.message || t('deleteErrorDescription')
        })
      } else {
        console.log('Delete successful, showing success toast')
        toast.success(t('deleteSuccess'), {
          description: t('deleteSuccessDescription', { type: connection.type })
        })
        
        // Remove from local state
        setInternetConnectionTypes(prev => 
          prev.filter(item => item.id !== connection.id)
        )
      }
    } catch (err) {
      console.error('Delete error:', err)
      toast.error(t('deleteError'), {
        description: t('deleteErrorDescription')
      })
    } finally {
      setDeletingId(null)
    }
  }



  // Logique de pagination
  const totalPages = Math.ceil(internetConnectionTypes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentConnections = internetConnectionTypes.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (loading) {
    return <div className="p-8">{tCommon('loading')}</div>
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            {t('loadError')}: {error}
          </div>
          <Button onClick={() => window.location.reload()}>
            {tCommon('refresh')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 min-h-full bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-blue-950/20">
      {/* En-tête amélioré avec gradient et animations */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
        <div className="absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-white/5 blur-2xl"></div>
        
        <div className="relative flex justify-between items-center">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <Wifi className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">
                  {t('title')}
                </h1>
                <p className="text-blue-100 text-lg font-medium mt-1">
                  {t('subtitle')}
                </p>
              </div>
            </div>
            <p className="text-blue-50 max-w-2xl leading-relaxed">
              {t('description')}
            </p>
            
            {/* Statistiques rapides */}
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2 backdrop-blur-sm">
                <Signal className="h-5 w-5 text-green-300" />
                <span className="text-sm font-medium">
                  {internetConnectionTypes.filter(c => c.status?.toLowerCase() === 'active' || c.status?.toLowerCase() === 'actif').length} {t('active')}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2 backdrop-blur-sm">
                <Globe className="h-5 w-5 text-blue-300" />
                <span className="text-sm font-medium">
                  {internetConnectionTypes.length} {t('total')}
                </span>
              </div>
            </div>
          </div>
          
          <Button 
            asChild 
            className="bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0 px-6 py-3 text-lg font-semibold"
          >
            <Link href="/settings/internet-connections/new">
              <Plus className="mr-2 h-5 w-5" />
              {t('addNewConnectionType')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Carte principale avec design amélioré */}
      <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 dark:from-gray-800 dark:to-blue-950/20 rounded-t-lg border-b-2 border-blue-100 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-800 dark:text-gray-100">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  <Wifi className="h-6 w-6" />
                </div>
                {t('existingConnectionTypes')}
              </CardTitle>
              <CardDescription className="text-lg mt-2 text-gray-600 dark:text-gray-300">
                {internetConnectionTypes.length === 0 
                  ? t('noConnectionTypesFound')
                  : t('totalConnections', { count: internetConnectionTypes.length })
                }
                {totalPages > 1 && (
                  <span className="text-sm text-muted-foreground ml-2 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full">
                    Page {currentPage} sur {totalPages}
                  </span>
                )}
              </CardDescription>
            </div>
            
            {/* Indicateurs visuels */}
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {internetConnectionTypes.filter(c => c.status?.toLowerCase() === 'active' || c.status?.toLowerCase() === 'actif').length}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Actives</div>
              </div>
              <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {internetConnectionTypes.length}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Total</div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {internetConnectionTypes.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full animate-pulse"></div>
                </div>
                <div className="relative flex items-center justify-center">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-2xl">
                    <Wifi className="h-16 w-16" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 mb-8">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {t('noConnectionTypesFound')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg max-w-md mx-auto leading-relaxed">
                  {t('addFirstConnection')}
                </p>
              </div>
              
              <Button 
                asChild 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8 py-3 text-lg"
              >
                <Link href="/settings/internet-connections/new">
                  <Plus className="mr-3 h-5 w-5" />
                  {t('addNewConnectionType')}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {currentConnections.map((connection, index) => (
                <Card 
                  key={connection.id} 
                  className="connection-card shine-effect animate-fade-in-up relative group border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-700 bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 dark:from-gray-800 dark:via-blue-950/10 dark:to-indigo-950/20 overflow-hidden"
                  style={{ 
                    animationDelay: `${index * 150}ms`,
                    boxShadow: '0 10px 40px rgba(59, 130, 246, 0.1)'
                  }}
                >
                  {/* Effet de brillance au survol */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  <CardContent className="p-4 relative">
                    {/* En-tête avec icône et informations principales */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className="connection-icon p-3 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white shadow-lg animate-pulse-glow">
                            {getConnectionIcon(connection.type)}
                          </div>
                          {/* Indicateur de statut */}
                          <div className={`status-indicator absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                            connection.status?.toLowerCase() === 'active' || connection.status?.toLowerCase() === 'actif' 
                              ? 'bg-green-500' 
                              : connection.status?.toLowerCase() === 'maintenance' 
                                ? 'bg-yellow-500' 
                                : 'bg-red-500'
                          }`}></div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1 truncate">
                            {connection.type}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                            <Signal className="h-3 w-3 text-blue-500 flex-shrink-0" />
                            <span className="truncate">{connection.speed}</span>
                            <span>•</span>
                            <span className="truncate">{connection.provider}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Boutons d'action avec animation */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 flex-shrink-0">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild 
                          className="action-button hover:bg-blue-100 dark:hover:bg-blue-900/30 h-8 w-8 p-0"
                        >
                          <Link href={`/settings/internet-connections/${connection.id}`}>
                            <Edit className="h-3 w-3 text-blue-600" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="action-button text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 h-8 w-8 p-0"
                          onClick={() => handleDelete(connection)}
                          disabled={deletingId === connection.id}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Informations détaillées */}
                    <div className="space-y-3 mb-4">
                      {/* Badge de statut amélioré */}
                      {connection.status && (
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary" 
                            className={`status-badge text-xs font-semibold px-2 py-1 border-0 ${getConnectionColor(connection.status)} shadow-sm`}
                          >
                            <div className="status-indicator w-1.5 h-1.5 rounded-full bg-current mr-1"></div>
                            {connection.status}
                          </Badge>
                        </div>
                      )}
                      
                      {/* Coût avec design amélioré */}
                      {connection.cost && (
                        <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 border border-green-200 dark:border-green-800">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {t('cost')}
                            </span>
                            <span className="text-lg font-bold text-green-600 dark:text-green-400">
                              {connection.cost} DA
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Pied de carte avec informations du fournisseur */}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0 flex-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex-shrink-0"></div>
                        <span className="font-medium">{t('provider')}:</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300 truncate">{connection.provider}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild 
                        className="hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 hover:text-white hover:border-transparent transition-all duration-300 hover:shadow-lg text-xs px-2 py-1 h-7 flex-shrink-0 ml-2"
                      >
                        <Link href={`/settings/internet-connections/${connection.id}`}>
                          <Edit className="h-3 w-3 mr-1" />
                          {tCommon('edit')}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* Contrôles de pagination améliorés */}
          {internetConnectionTypes.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t-2 border-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-lg">
                {t('paginationShowing', {
                  start: startIndex + 1,
                  end: Math.min(endIndex, internetConnectionTypes.length),
                  total: internetConnectionTypes.length
                })}
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevious}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950 transition-all duration-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t('paginationPrevious')}
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(page)}
                      className={`w-10 h-10 p-0 transition-all duration-200 ${
                        currentPage === page 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-110' 
                          : 'hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950'
                      }`}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNext}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950 transition-all duration-200"
                >
                  {t('paginationNext')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmation */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, connection: null })}
        onConfirm={handleConfirmDelete}
        title={t('deleteConfirmation', {
          type: confirmDialog.connection?.type || '',
          provider: confirmDialog.connection?.provider || ''
        })}
        description={t('deleteConfirmationDescription')}
        confirmLabel={t('deleteButton')}
        cancelLabel={t('cancelButton')}
        variant="danger"
        icon={<Trash2 className="h-6 w-6" />}
      />
    </div>
  )
}
