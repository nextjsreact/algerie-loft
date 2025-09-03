'use client'

/**
 * ÉLÉMENT DE MENU POUR LES RAPPORTS
 * =================================
 * 
 * Composant pour ajouter les rapports dans la navigation
 */

import Link from 'next/link'
import { FileText, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTranslations } from 'next-intl'

export function ReportsMenuItem() {
  const t = useTranslations('reports')
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <FileText className="w-4 h-4" />
          {t('menuTitle')}
          <Badge variant="secondary" className="ml-1">
            {t('menuBadge')}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t('menuLabel')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link href="/reports" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            {t('reportGenerator')}
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href="/reports?type=loft" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {t('loftReport')}
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href="/reports?type=owner" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {t('ownerReport')}
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href="/reports?type=global" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {t('globalReport')}
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="text-muted-foreground text-xs">
          {t('automaticPdfGeneration')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Composant simple pour la navigation principale
export function ReportsNavLink() {
  const t = useTranslations('reports')
  
  return (
    <Link 
      href="/reports" 
      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      <FileText className="w-4 h-4" />
      {t('menuTitle')}
      <Badge variant="outline" className="ml-auto">
        {t('menuBadge')}
      </Badge>
    </Link>
  )
}