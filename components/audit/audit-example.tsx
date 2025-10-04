"use client"

import { AuditHistory } from './audit-history'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface AuditExampleProps {
  entityType: 'transactions' | 'tasks' | 'reservations' | 'lofts'
  entityId: string
  entityName?: string
}

/**
 * Example component showing how to integrate audit history into entity detail pages
 * This demonstrates the pattern for adding audit tabs to existing entity pages
 */
export function AuditExample({ entityType, entityId, entityName }: AuditExampleProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {entityName ? `${entityName} Details` : `${entityType} Details`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="audit">Audit History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <div className="p-4 border rounded-lg">
              <p className="text-muted-foreground">
                Entity details would go here...
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="audit" className="space-y-4">
            <AuditHistory 
              tableName={entityType}
              recordId={entityId}
              showFilters={true}
              maxHeight="500px"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}