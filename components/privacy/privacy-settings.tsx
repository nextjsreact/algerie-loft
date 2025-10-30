'use client';

/**
 * Privacy Settings Component
 * Allows users to manage their privacy preferences and GDPR rights
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Download, 
  Trash2, 
  Eye, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface ConsentRecord {
  dataCategory: string;
  purpose: string;
  consentGiven: boolean;
  consentDate: string;
  withdrawnDate?: string;
  version: string;
}

interface PrivacyRequest {
  id: string;
  type: string;
  status: string;
  requestDate: string;
  completionDate?: string;
  reason?: string;
}

const DATA_CATEGORIES = {
  personal_identity: {
    name: 'Personal Identity',
    description: 'Name, date of birth, identification documents',
    icon: '👤'
  },
  contact_information: {
    name: 'Contact Information', 
    description: 'Email, phone number, address',
    icon: '📧'
  },
  financial_data: {
    name: 'Financial Data',
    description: 'Payment information, transaction history',
    icon: '💳'
  },
  behavioral_data: {
    name: 'Behavioral Data',
    description: 'Usage patterns, preferences, activity logs',
    icon: '📊'
  },
  technical_data: {
    name: 'Technical Data',
    description: 'IP address, device information, cookies',
    icon: '🔧'
  }
};

const REQUEST_TYPES = {
  access: { name: 'Data Access', description: 'Request a copy of your personal data', icon: Eye },
  erasure: { name: 'Data Deletion', description: 'Request deletion of your personal data', icon: Trash2 },
  portability: { name: 'Data Export', description: 'Export your data in a portable format', icon: Download },
  rectification: { name: 'Data Correction', description: 'Request correction of inaccurate data', icon: FileText },
  restriction: { name: 'Processing Restriction', description: 'Restrict processing of your data', icon: Shield },
  objection: { name: 'Processing Objection', description: 'Object to processing of your data', icon: XCircle }
};

export default function PrivacySettings() {
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [requests, setRequests] = useState<PrivacyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPrivacyData();
  }, []);

  const loadPrivacyData = async () => {
    try {
      setLoading(true);
      
      // Load consent records
      const consentsResponse = await fetch('/api/privacy?action=consents');
      const consentsData = await consentsResponse.json();
      
      // Load privacy requests
      const requestsResponse = await fetch('/api/privacy?action=requests');
      const requestsData = await requestsResponse.json();
      
      setConsents(consentsData.consents || []);
      setRequests(requestsData.requests || []);
    } catch (error) {
      console.error('Failed to load privacy data:', error);
      toast.error('Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const updateConsent = async (dataCategory: string, consentGiven: boolean) => {
    try {
      setSubmitting(true);
      
      const response = await fetch('/api/privacy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataCategory,
          purpose: `Processing of ${DATA_CATEGORIES[dataCategory as keyof typeof DATA_CATEGORIES]?.name}`,
          consentGiven
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update consent');
      }

      toast.success(`Consent ${consentGiven ? 'granted' : 'withdrawn'} successfully`);
      await loadPrivacyData();
    } catch (error) {
      console.error('Failed to update consent:', error);
      toast.error('Failed to update consent');
    } finally {
      setSubmitting(false);
    }
  };

  const submitPrivacyRequest = async (type: string, reason?: string) => {
    try {
      setSubmitting(true);
      
      const response = await fetch('/api/privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, reason })
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      const result = await response.json();
      toast.success(result.message);
      await loadPrivacyData();
    } catch (error) {
      console.error('Failed to submit privacy request:', error);
      toast.error('Failed to submit privacy request');
    } finally {
      setSubmitting(false);
    }
  };

  const exportData = async () => {
    try {
      setSubmitting(true);
      
      const response = await fetch('/api/privacy?action=export');
      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error('Failed to export data');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await fetch('/api/privacy?reason=User requested account deletion', {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete account');
      }

      toast.success('Account deleted successfully');
      // Redirect to home page or logout
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'processing':
        return <Badge variant="default" className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case 'pending':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Privacy Settings</h1>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Manage your privacy preferences and exercise your data protection rights. 
          Changes may take up to 30 days to process according to GDPR regulations.
        </AlertDescription>
      </Alert>

      {/* Consent Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Processing Consent</CardTitle>
          <CardDescription>
            Control how we process your personal data. You can withdraw consent at any time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(DATA_CATEGORIES).map(([category, info]) => {
            const consent = consents.find(c => c.dataCategory === category && c.consentGiven);
            
            return (
              <div key={category} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{info.icon}</span>
                  <div>
                    <h3 className="font-medium">{info.name}</h3>
                    <p className="text-sm text-gray-600">{info.description}</p>
                    {consent && (
                      <p className="text-xs text-gray-500 mt-1">
                        Consented on {new Date(consent.consentDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={!!consent}
                  onCheckedChange={(checked) => updateConsent(category, checked)}
                  disabled={submitting}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Privacy Rights */}
      <Card>
        <CardHeader>
          <CardTitle>Your Privacy Rights</CardTitle>
          <CardDescription>
            Exercise your data protection rights under GDPR and other privacy laws.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(REQUEST_TYPES).map(([type, info]) => {
              const Icon = info.icon;
              return (
                <div key={type} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3 mb-3">
                    <Icon className="w-5 h-5 mt-0.5" />
                    <div>
                      <h3 className="font-medium">{info.name}</h3>
                      <p className="text-sm text-gray-600">{info.description}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (type === 'erasure') {
                        deleteAccount();
                      } else if (type === 'portability') {
                        exportData();
                      } else {
                        submitPrivacyRequest(type);
                      }
                    }}
                    disabled={submitting}
                    className="w-full"
                  >
                    {type === 'portability' ? 'Export Data' : 'Submit Request'}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Privacy Request History */}
      {requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Request History</CardTitle>
            <CardDescription>
              Track the status of your privacy requests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">
                        {REQUEST_TYPES[request.type as keyof typeof REQUEST_TYPES]?.name || request.type}
                      </h3>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      Requested on {new Date(request.requestDate).toLocaleDateString()}
                    </p>
                    {request.completionDate && (
                      <p className="text-sm text-gray-600">
                        Completed on {new Date(request.completionDate).toLocaleDateString()}
                      </p>
                    )}
                    {request.reason && (
                      <p className="text-sm text-gray-500 mt-1">Reason: {request.reason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that will permanently affect your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-medium text-red-800 mb-2">Delete Account</h3>
            <p className="text-sm text-red-700 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
              You must not have any active reservations to delete your account.
            </p>
            <Button
              variant="destructive"
              onClick={deleteAccount}
              disabled={submitting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}