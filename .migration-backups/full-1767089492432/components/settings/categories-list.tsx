"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"
import type { Category } from "@/lib/types"

interface CategoriesListProps {
  categories: Category[]
}

export function CategoriesList({ categories }: CategoriesListProps) {
  const t = useTranslations("settings")
  const tCommon = useTranslations("common")

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: "name",
      header: () => <div className="font-semibold">{t('categories.categoryName')}</div>,
      cell: ({ row }) => {
        const category = row.original
        return (
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              category.type === 'income' 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            }`}>
              {category.type === 'income' ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {category.name}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "description",
      header: () => <div className="font-semibold">{t('categories.description')}</div>,
      cell: ({ row }) => {
        const description = row.getValue("description") as string
        return (
          <div className="text-muted-foreground max-w-md">
            {description || <span className="italic text-gray-400">Aucune description</span>}
          </div>
        )
      },
    },
    {
      accessorKey: "type",
      header: () => <div className="font-semibold">{t('categories.type')}</div>,
      cell: ({ row }) => {
        const type = row.getValue("type") as string
        return (
          <Badge 
            variant="secondary" 
            className={`font-medium ${
              type === 'income' 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {type === 'income' ? t('categories.income') : t('categories.expense')}
          </Badge>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: () => <div className="font-semibold">{tCommon('date')}</div>,
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string
        return (
          <div className="text-muted-foreground text-sm">
            {date ? new Date(date).toLocaleDateString('fr-FR') : '-'}
          </div>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="font-semibold text-center">{tCommon('actions')}</div>,
      cell: ({ row }) => {
        const category = row.original
        return (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">{tCommon('actions')}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link 
                    href={`/settings/categories/edit/${category.id}`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Edit className="h-4 w-4" />
                    {tCommon('edit')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="flex items-center gap-2 text-red-600 dark:text-red-400 cursor-pointer"
                  onClick={() => {
                    // TODO: Implémenter la suppression
                    console.log('Supprimer la catégorie:', category.id)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  {tCommon('delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  return (
    <div className="w-full">
      <DataTable columns={columns} data={categories} />
    </div>
  )
}