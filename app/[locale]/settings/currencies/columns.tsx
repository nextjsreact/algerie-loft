"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Trash2 } from "lucide-react"
import { Currency } from "@/lib/types"

export const getColumns = (
  onSetDefault: (id: string) => Promise<void>,
  onDelete: (id: string) => Promise<void>,
  router: any,
  t: any
): ColumnDef<Currency>[] => [
  {
    accessorKey: "name",
    header: t('currencies.name'),
  },
  {
    accessorKey: "code",
    header: t('currencies.code'),
  },
  {
    accessorKey: "symbol",
    header: t('currencies.symbol'),
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