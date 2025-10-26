'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Phone, MessageSquare, MapPin, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface EmergencyContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  userContext?: {
    isGuest?: boolean;
    currentAction?: string;
    loftId?: string;
    bookingId?: string;
  };
}

interface EmergencyContact {
  type: 'phone' | 'sms' | 'whatsapp';
  number: string;
  description: string;
  availability: string;
}

/**
 * Emergency contact modal for active guests
 */
export function EmergencyContactModal({ 
  isOpen, 
  onClose, 
  locale,
  userContext = {}
}: EmergencyContactModalProps) {
  const [emergencyType, setEmergencyType] = useState('');
  const [description, setDescription] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Multilingual content
  const content = {
    fr: {
      title: 'Contact d\'urgence',
      subtitle: 'Pour les clients actuels uniquement',
      description: 'Utilisez ce formulaire uniquement pour les urgences pendant votre séjour',
      emergencyTypes: {
        maintenance: 'Problème de maintenance',
        security: 'Problème de sécurité',
        medical: 'Urgence médicale',
        access: 'Problème d\'accès',
        other: 'Autre urgence'
      },
      fields: {
        type: 'Type d\'urgence',
        name: 'Votre nom',
        phone: 'Votre téléphone',
        description: 'Description de l\'urgence',
        descriptionPlaceholder: 'Décrivez brièvement la situation...'
      },
      contacts: {
        phone: {
          description: 'Ligne d\'urgence 24/7',
          availability: 'Disponible 24h/24'
        },
        sms: {
          description: 'SMS d\'urgence',
          availability: 'Réponse rapide'
        },
        whatsapp: {
          description: 'WhatsApp urgence',
          availability: 'Messages instantanés'
        }
      },
      actions: {
        call: 'Appeler maintenant',
        sms: 'Envoyer SMS',
        whatsapp: 'Ouvrir WhatsApp',
        submit: 'Envoyer la demande',
        cancel: 'Annuler'
      },
      warnings: {
        emergency: 'En cas d\'urgence médicale grave, appelez immédiatement le 15 (SAMU)',
        police: 'En cas d\'urgence sécuritaire, appelez le 17 (Police)',
        fire: 'En cas d\'incendie, appelez le 18 (Pompiers)'
      },
      success: 'Votre demande d\'urgence a été envoyée. Nous vous contacterons immédiatement.'
    },
    en: {
      title: 'Emergency Contact',
      subtitle: 'For current guests only',
      description: 'Use this form only for emergencies during your stay',
      emergencyTypes: {
        maintenance: 'Maintenance issue',
        security: 'Security issue',
        medical: 'Medical emergency',
        access: 'Access problem',
        other: 'Other emergency'
      },
      fields: {
        type: 'Emergency type',
        name: 'Your name',
        phone: 'Your phone',
        description: 'Emergency description',
        descriptionPlaceholder: 'Briefly describe the situation...'
      },
      contacts: {
        phone: {
          description: '24/7 Emergency line',
          availability: 'Available 24/7'
        },
        sms: {
          description: 'Emergency SMS',
          availability: 'Quick response'
        },
        whatsapp: {
          description: 'Emergency WhatsApp',
          availability: 'Instant messages'
        }
      },
      actions: {
        call: 'Call now',
        sms: 'Send SMS',
        whatsapp: 'Open WhatsApp',
        submit: 'Send request',
        cancel: 'Cancel'
      },
      warnings: {
        emergency: 'For serious medical emergencies, call 15 (SAMU) immediately',
        police: 'For security emergencies, call 17 (Police)',
        fire: 'For fire emergencies, call 18 (Fire Department)'
      },
      success: 'Your emergency request has been sent. We will contact you immediately.'
    },
    ar: {
      title: 'اتصال طوارئ',
      subtitle: 'للضيوف الحاليين فقط',
      description: 'استخدم هذا النموذج فقط للطوارئ أثناء إقامتك',
      emergencyTypes: {
        maintenance: 'مشكلة صيانة',
        security: 'مشكلة أمنية',
        medical: 'طوارئ طبية',
        access: 'مشكلة وصول',
        other: 'طوارئ أخرى'
      },
      fields: {
        type: 'نوع الطوارئ',
        name: 'اسمك',
        phone: 'هاتفك',
        description: 'وصف الطوارئ',
        descriptionPlaceholder: 'اوصف الموقف بإيجاز...'
      },
      contacts: {
        phone: {
          description: 'خط الطوارئ 24/7',
          availability: 'متاح 24/7'
        },
        sms: {
          description: 'رسائل طوارئ',
          availability: 'استجابة سريعة'
        },
        whatsapp: {
          description: 'واتساب طوارئ',
          availability: 'رسائل فورية'
        }
      },
      actions: {
        call: 'اتصل الآن',
        sms: 'أرسل رسالة',
        whatsapp: 'افتح واتساب',
        submit: 'أرسل الطلب',
        cancel: 'إلغاء'
      },
      warnings: {
        emergency: 'في حالة الطوارئ الطبية الخطيرة، اتصل بـ 15 (SAMU) فوراً',
        police: 'في حالة طوارئ الأمن، اتصل بـ 17 (الشرطة)',
        fire: 'في حالة الحريق، اتصل بـ 18 (الإطفاء)'
      },
      success: 'تم إرسال طلب الطوارئ. سنتصل بك فوراً.'
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  // Emergency contact numbers
  const emergencyContacts: EmergencyContact[] = [
    {
      type: 'phone',
      number: '+213 XX XX XX XX',
      description: text.contacts.phone.description,
      availability: text.contacts.phone.availability
    },
    {
      type: 'sms',
      number: '+213 XX XX XX XX',
      description: text.contacts.sms.description,
      availability: text.contacts.sms.availability
    },
    {
      type: 'whatsapp',
      number: '+213XXXXXXXXX',
      description: text.contacts.whatsapp.description,
      availability: text.contacts.whatsapp.availability
    }
  ];

  const handleContactMethod = (contact: EmergencyContact) => {
    const message = `URGENCE - ${emergencyType ? text.emergencyTypes[emergencyType as keyof typeof text.emergencyTypes] : 'Non spécifié'}
Nom: ${guestName}
Téléphone: ${guestPhone}
Réservation: ${userContext.bookingId || 'Non spécifiée'}
Loft: ${userContext.loftId || 'Non spécifié'}

Description: ${description}`;

    switch (contact.type) {
      case 'phone':
        window.location.href = `tel:${contact.number}`;
        break;
      case 'sms':
        window.location.href = `sms:${contact.number}?body=${encodeURIComponent(message)}`;
        break;
      case 'whatsapp':
        window.open(`https://wa.me/${contact.number.replace(/\s/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
        break;
    }
  };

  const handleSubmitEmergency = async () => {
    setIsSubmitting(true);
    
    try {
      const emergencyData = {
        type: emergencyType,
        description,
        guestName,
        guestPhone,
        bookingId: userContext.bookingId,
        loftId: userContext.loftId,
        timestamp: new Date().toISOString(),
        priority: 'urgent'
      };

      const response = await fetch('/api/emergency-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emergencyData)
      });

      if (response.ok) {
        alert(text.success);
        onClose();
      } else {
        throw new Error('Failed to send emergency request');
      }
    } catch (error) {
      console.error('Emergency contact error:', error);
      alert('Erreur lors de l\'envoi. Veuillez appeler directement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="border-0 shadow-none">
            <CardHeader className="border-b border-red-200 bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-red-800 dark:text-red-200">
                    {text.title}
                  </CardTitle>
                  <CardDescription className="text-red-600 dark:text-red-300">
                    {text.subtitle}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Warning Messages */}
              <div className="space-y-2">
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                    🚨 {text.warnings.emergency}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      👮 {text.warnings.police}
                    </p>
                  </div>
                  <div className="p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded">
                    <p className="text-xs text-orange-800 dark:text-orange-200">
                      🚒 {text.warnings.fire}
                    </p>
                  </div>
                </div>
              </div>

              {/* Emergency Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergency-type">{text.fields.type} *</Label>
                    <Select value={emergencyType} onValueChange={setEmergencyType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez le type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(text.emergencyTypes).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guest-name">{text.fields.name} *</Label>
                    <Input
                      id="guest-name"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Nom complet"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guest-phone">{text.fields.phone} *</Label>
                  <Input
                    id="guest-phone"
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+213 XX XX XX XX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{text.fields.description} *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={text.fields.descriptionPlaceholder}
                    rows={3}
                  />
                </div>

                {/* Context Information */}
                {(userContext.bookingId || userContext.loftId) && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Informations de réservation:</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {userContext.bookingId && (
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>Réservation: {userContext.bookingId}</span>
                        </div>
                      )}
                      {userContext.loftId && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>Loft: {userContext.loftId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Emergency Contact Methods */}
              <div className="space-y-3">
                <h4 className="font-medium">Méthodes de contact d'urgence:</h4>
                <div className="grid grid-cols-1 gap-3">
                  {emergencyContacts.map((contact, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => handleContactMethod(contact)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-full">
                          {contact.type === 'phone' && <Phone className="w-4 h-4 text-red-600" />}
                          {contact.type === 'sms' && <MessageSquare className="w-4 h-4 text-red-600" />}
                          {contact.type === 'whatsapp' && <MessageSquare className="w-4 h-4 text-red-600" />}
                        </div>
                        <div>
                          <p className="font-medium">{contact.description}</p>
                          <p className="text-sm text-muted-foreground">{contact.number}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {contact.availability}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {contact.type === 'phone' && text.actions.call}
                          {contact.type === 'sms' && text.actions.sms}
                          {contact.type === 'whatsapp' && text.actions.whatsapp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t">
                <Button
                  onClick={handleSubmitEmergency}
                  disabled={!emergencyType || !guestName || !guestPhone || !description || isSubmitting}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {isSubmitting ? 'Envoi...' : text.actions.submit}
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  {text.actions.cancel}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}