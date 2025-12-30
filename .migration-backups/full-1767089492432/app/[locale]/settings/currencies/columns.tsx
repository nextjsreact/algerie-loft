"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Trash2, Edit } from "lucide-react"
import { Currency } from "@/lib/types"
import { getCurrencySymbol } from "@/utils/currency-formatter"

export const getColumns = (
  onSetDefault: (id: string) => Promise<void>,
  onDelete: (id: string) => Promise<void>,
  onEdit: (id: string) => void,
  router: any,
  t: any,
  locale: string = 'en'
): ColumnDef<Currency>[] => [
  {
    accessorKey: "name",
    header: t('currencies.name'),
    enableSorting: true,
  },
  {
    accessorKey: "code",
    header: t('currencies.code'),
    enableSorting: true,
  },
  {
    accessorKey: "symbol",
    header: t('currencies.symbol'),
    cell: ({ row }) => {
      const currency = row.original
      return getCurrencySymbol(currency.code as any, locale as any)
    },
    enableSorting: true,
  },
  {
    accessorKey: "ratio",
    header: t('currencies.ratio'),
    cell: ({ row }) => {
      const ratio = row.getValue("ratio") as number
      return (
        <div className="font-mono text-sm">
          {new Intl.NumberFormat(locale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
            useGrouping: false
          }).format(ratio)}
        </div>
      )
    },
    enableSorting: true,
  },
  {
    accessorKey: "is_default",
    header: t('currencies.status'),
    cell: ({ row }) => {
      const isDefault = row.getValue("is_default")
      return isDefault ? (
        <Badge variant="default">
          <Star className="h-3 w-3 mr-1" />
          {t('currencies.default')}
        </Badge>
      ) : (
        <Badge variant="secondary">{t('currencies.secondary')}</Badge>
      )
    },
  },
  {
    id: "actions",
    header: t('common.actions'),
    cell: ({ row }) => {
      const currency = row.original
      const isDefault = currency.is_default

      return (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(currency.id)}
          >
            <Edit className="h-3 w-3 mr-1" />
            {t('common.edit')}
          </Button>
          {!isDefault && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSetDefault(currency.id)}
            >
              <Star className="h-3 w-3 mr-1" />
              {t('currencies.setDefault')}
            </Button>
          )}
          {!isDefault && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(currency.id)}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              {t('common.delete')}
            </Button>
          )}
        </div>
      )
    },
  },
]