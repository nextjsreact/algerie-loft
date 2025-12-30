'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Send, Eye, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { EmailTemplate } from '@/lib/types-notification-extensions'

interface EmailTemplateManagerProps {
  className?: string
}

export function EmailTemplateManager({ className }: EmailTemplateManagerProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testVariables, setTestVariables] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    template_key: '',
    template_name: '',
    subject_template: '',
    body_template: '',
    template_type: 'booking' as const,
    variables: [] as string[],
    is_active: true
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/email-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates)
      } else {
        toast.error('Failed to fetch email templates')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Failed to fetch email templates')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const url = isCreating 
        ? '/api/admin/email-templates'
        : `/api/admin/email-templates/${selectedTemplate?.id}`
      
      const method = isCreating ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(`Template ${isCreating ? 'created' : 'updated'} successfully`)
        await fetchTemplates()
        resetForm()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save template')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const response = await fetch(`/api/admin/email-templates/${templateId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Template deleted successfully')
        await fetchTemplates()
        if (selectedTemplate?.id === templateId) {
          setSelectedTemplate(null)
        }
      } else {
        toast.error('Failed to delete template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Failed to delete template')
    }
  }

  const handleTest = async (template: EmailTemplate) => {
    try {
      const response = await fetch('/api/admin/email-templates/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_key: template.template_key,
          test_variables: testVariables,
          test_email: testEmail
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
      } else {
        toast.error(data.error || 'Failed to test template')
      }
    } catch (error) {
      console.error('Error testing template:', error)
      toast.error('Failed to test template')
    }
  }

  const resetForm = () => {
    setFormData({
      template_key: '',
      template_name: '',
      subject_template: '',
      body_template: '',
      template_type: 'booking',
      variables: [],
      is_active: true
    })
    setSelectedTemplate(null)
    setIsEditing(false)
    setIsCreating(false)
  }

  const startEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      template_key: template.template_key,
      template_name: template.template_name,
      subject_template: template.subject_template,
      body_template: template.body_template,
      template_type: template.template_type,
      variables: template.variables,
      is_active: template.is_active
    })
    setIsEditing(true)
  }

  const startCreate = () => {
    resetForm()
    setIsCreating(true)
  }

  const getTemplateTypeColor = (type: string) => {
    switch (type) {
      case 'booking':
        return 'bg-blue-100 text-blue-800'
      case 'payment':
        return 'bg-green-100 text-green-800'
      case 'reminder':
        return 'bg-yellow-100 text-yellow-800'
      case 'system':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Email Templates</h2>
        <Button onClick={startCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Templates List */}
        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{template.template_name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={getTemplateTypeColor(template.template_type)}>
                          {template.template_type}
                        </Badge>
                        {!template.is_active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Key: {template.template_key}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Variables: {template.variables.join(', ')}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          startEdit(template)
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Test Template</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="test-email">Test Email</Label>
                              <Input
                                id="test-email"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                placeholder="Enter email address"
                              />
                            </div>
                            <Button onClick={() => handleTest(template)}>
                              Send Test Email
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(template.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Template Editor */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isCreating ? 'Create Template' : isEditing ? 'Edit Template' : 'Template Preview'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(isCreating || isEditing) ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template-key">Template Key</Label>
                    <Input
                      id="template-key"
                      value={formData.template_key}
                      onChange={(e) => setFormData({ ...formData, template_key: e.target.value })}
                      disabled={isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-type">Type</Label>
                    <Select
                      value={formData.template_type}
                      onValueChange={(value: any) => setFormData({ ...formData, template_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="booking">Booking</SelectItem>
                        <SelectItem value="payment">Payment</SelectItem>
                        <SelectItem value="reminder">Reminder</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={formData.template_name}
                    onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="subject-template">Subject Template</Label>
                  <Input
                    id="subject-template"
                    value={formData.subject_template}
                    onChange={(e) => setFormData({ ...formData, subject_template: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="body-template">Body Template</Label>
                  <Textarea
                    id="body-template"
                    value={formData.body_template}
                    onChange={(e) => setFormData({ ...formData, body_template: e.target.value })}
                    rows={10}
                  />
                </div>

                <div>
                  <Label htmlFor="variables">Variables (comma-separated)</Label>
                  <Input
                    id="variables"
                    value={formData.variables.join(', ')}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      variables: e.target.value.split(',').map(v => v.trim()).filter(Boolean)
                    })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is-active">Active</Label>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave}>
                    {isCreating ? 'Create' : 'Update'}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : selectedTemplate ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{selectedTemplate.template_name}</h3>
                  <Button variant="outline" onClick={() => startEdit(selectedTemplate)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>

                <Tabs defaultValue="preview">
                  <TabsList>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="raw">Raw Template</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="preview" className="space-y-4">
                    <div>
                      <Label>Subject</Label>
                      <div className="p-2 bg-muted rounded">
                        {selectedTemplate.subject_template}
                      </div>
                    </div>
                    <div>
                      <Label>Body</Label>
                      <div className="p-2 bg-muted rounded whitespace-pre-wrap">
                        {selectedTemplate.body_template}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="raw" className="space-y-4">
                    <div>
                      <Label>Variables</Label>
                      <div className="flex flex-wrap gap-1">
                        {selectedTemplate.variables.map((variable) => (
                          <Badge key={variable} variant="outline">
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Select a template to view or edit
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}