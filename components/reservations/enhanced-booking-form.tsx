'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  bookingFormSchema, 
  type BookingFormData, 
  type BookingFormStep,
  type PricingBreakdown,
  type ReservationRequest,
  type GuestInfo,
  type AdditionalGuest
} from '@/lib/schemas/booking';
import { User, Loft } from '@/lib/types';
import { UserProfileIntegration, type UserProfile } from './user-profile-integration';
import { toast } from 'sonner';
import { CalendarDays, Users, MapPin, Euro, Clock, CheckCircle, AlertCircle, User as UserIcon, Settings, Sparkles } from 'lucide-react';

interface EnhancedBookingFormProps {
  loft: Loft;
  checkIn: string;
  checkOut: string;
  guests: number;
  user: User;
  pricing: PricingBreakdown;
  onSubmit: (reservation: ReservationRequest) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

const FORM_STEPS: { key: BookingFormStep; title: string; description: string }[] = [
  { key: 'guest-info', title: 'Guest Information', description: 'Primary guest details' },
  { key: 'additional-guests', title: 'Additional Guests', description: 'Other guests information' },
  { key: 'preferences', title: 'Preferences', description: 'Special requests and preferences' },
  { key: 'review', title: 'Review & Confirm', description: 'Review your booking details' }
];

export function EnhancedBookingForm({ 
  loft, 
  checkIn, 
  checkOut, 
  guests, 
  user, 
  pricing, 
  onSubmit, 
  onCancel,
  className 
}: EnhancedBookingFormProps) {
  const t = useTranslations('booking');
  const [currentStep, setCurrentStep] = useState<BookingFormStep>('guest-info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showProfileIntegration, setShowProfileIntegration] = useState(false);
  const [profileUpdatePending, setProfileUpdatePending] = useState(false);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      loftId: loft.id,
      checkIn,
      checkOut,
      guests,
      primaryGuest: {
        firstName: user.full_name?.split(' ')[0] || '',
        lastName: user.full_name?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phone: '',
        nationality: '',
        dateOfBirth: '',
        idNumber: '',
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        }
      },
      additionalGuests: [],
      preferences: {
        arrivalTime: '',
        specialRequests: '',
        accessibilityNeeds: '',
        dietaryRestrictions: ''
      },
      termsAccepted: false,
      privacyAccepted: false,
      marketingConsent: false,
      website: '' // Honeypot field
    }
  });

  const { fields: additionalGuestFields, append: addGuest, remove: removeGuest } = useFieldArray({
    control: form.control,
    name: 'additionalGuests'
  });

  // Calculate nights
  const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));

  // Get current step index
  const currentStepIndex = FORM_STEPS.findIndex(step => step.key === currentStep);
  const progress = ((currentStepIndex + 1) / FORM_STEPS.length) * 100;

  // Handle profile data pre-fill
  const handleProfilePreFill = useCallback((profile: UserProfile) => {
    const currentValues = form.getValues();
    
    // Update form with profile data
    form.setValue('primaryGuest.firstName', profile.firstName);
    form.setValue('primaryGuest.lastName', profile.lastName);
    form.setValue('primaryGuest.email', profile.email);
    form.setValue('primaryGuest.phone', profile.phone);
    form.setValue('primaryGuest.nationality', profile.nationality);
    form.setValue('primaryGuest.dateOfBirth', profile.dateOfBirth);
    
    if (profile.emergencyContact) {
      form.setValue('primaryGuest.emergencyContact.name', profile.emergencyContact.name);
      form.setValue('primaryGuest.emergencyContact.phone', profile.emergencyContact.phone);
      form.setValue('primaryGuest.emergencyContact.relationship', profile.emergencyContact.relationship);
    }

    toast.success(t('profileDataPreFilled'));
  }, [form, t]);

  // Handle profile update
  const handleProfileUpdate = useCallback((profile: UserProfile) => {
    setProfileUpdatePending(true);
    
    // In a real implementation, you would update the user's profile in the database
    // For now, we'll just simulate the update
    setTimeout(() => {
      setProfileUpdatePending(false);
      toast.success(t('profileUpdated'));
    }, 1000);
  }, [t]);

  // Navigation functions
  const goToNextStep = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < FORM_STEPS.length) {
      setCurrentStep(FORM_STEPS[nextIndex].key);
    }
  }, [currentStepIndex]);

  const goToPreviousStep = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(FORM_STEPS[prevIndex].key);
    }
  }, [currentStepIndex]);

  // Form submission
  const handleSubmit = async (data: BookingFormData) => {
    // Check honeypot field
    if (data.website) {
      console.log('Spam detected via honeypot field');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const reservationRequest: ReservationRequest = {
        userId: user.id,
        loftId: data.loftId,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        guests: data.guests,
        guestInfo: {
          primaryGuest: data.primaryGuest,
          additionalGuests: data.additionalGuests
        },
        pricing,
        preferences: data.preferences,
        status: 'pending'
      };

      await onSubmit(reservationRequest);
      toast.success(t('form.successMessage'));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('form.submitError');
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step validation
  const validateCurrentStep = async () => {
    const fieldsToValidate: (keyof BookingFormData)[] = [];
    
    switch (currentStep) {
      case 'guest-info':
        fieldsToValidate.push('primaryGuest');
        break;
      case 'additional-guests':
        fieldsToValidate.push('additionalGuests');
        break;
      case 'preferences':
        fieldsToValidate.push('preferences');
        break;
      case 'review':
        fieldsToValidate.push('termsAccepted', 'privacyAccepted');
        break;
    }

    const isValid = await form.trigger(fieldsToValidate);
    return isValid;
  };

  const handleNextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      if (currentStep === 'review') {
        // Submit the form
        const formData = form.getValues();
        await handleSubmit(formData);
      } else {
        goToNextStep();
      }
    }
  };

  // Add additional guest
  const handleAddGuest = () => {
    if (additionalGuestFields.length < guests - 1) {
      addGuest({ firstName: '', lastName: '', age: 18 });
    }
  };

  return (
    <div className={className}>
      {/* Profile Integration Panel */}
      {showProfileIntegration && (
        <div className="mb-6">
          <UserProfileIntegration
            user={user}
            onProfileUpdate={handleProfileUpdate}
            onDataPreFill={handleProfilePreFill}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{t('form.title')}</CardTitle>
              <CardDescription>{t('form.description')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProfileIntegration(!showProfileIntegration)}
                disabled={isSubmitting}
              >
                {showProfileIntegration ? (
                  <>
                    <UserIcon className="h-4 w-4 mr-2" />
                    {t('hideProfile')}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {t('useProfile')}
                  </>
                )}
              </Button>
              <Badge variant="outline" className="text-sm">
                {t('form.step', { current: currentStepIndex + 1, total: FORM_STEPS.length })}
              </Badge>
            </div>
          </div>
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground">
              {FORM_STEPS.map((step, index) => (
                <span 
                  key={step.key} 
                  className={index <= currentStepIndex ? 'text-primary font-medium' : ''}
                >
                  {step.title}
                </span>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Booking Summary */}
          <Card className="mb-6 bg-muted/50">
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{loft.name}</p>
                    <p className="text-muted-foreground">{loft.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{new Date(checkIn).toLocaleDateString()} - {new Date(checkOut).toLocaleDateString()}</p>
                    <p className="text-muted-foreground">{nights} {nights === 1 ? 'night' : 'nights'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{guests} {guests === 1 ? 'guest' : 'guests'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">€{pricing.total.toFixed(2)}</p>
                    <p className="text-muted-foreground">Total</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Honeypot field */}
              <input
                type="text"
                {...form.register('website')}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
              />

              {/* Step Content */}
              {currentStep === 'guest-info' && (
                <EnhancedGuestInfoStep 
                  form={form} 
                  t={t} 
                  onProfilePreFill={handleProfilePreFill}
                  user={user}
                />
              )}

              {currentStep === 'additional-guests' && (
                <AdditionalGuestsStep 
                  form={form} 
                  t={t} 
                  fields={additionalGuestFields}
                  onAddGuest={handleAddGuest}
                  onRemoveGuest={removeGuest}
                  maxGuests={guests - 1}
                />
              )}

              {currentStep === 'preferences' && (
                <PreferencesStep form={form} t={t} />
              )}

              {currentStep === 'review' && (
                <ReviewStep 
                  form={form} 
                  t={t} 
                  loft={loft}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  guests={guests}
                  nights={nights}
                  pricing={pricing}
                />
              )}

              {/* Error Display */}
              {submitError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              {/* Profile Update Pending */}
              {profileUpdatePending && (
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>{t('profileUpdatePending')}</AlertDescription>
                </Alert>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <div>
                  {currentStepIndex > 0 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={goToPreviousStep}
                      disabled={isSubmitting}
                    >
                      {t('form.previous')}
                    </Button>
                  )}
                  {onCancel && currentStepIndex === 0 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={onCancel}
                      disabled={isSubmitting}
                    >
                      {t('form.cancel')}
                    </Button>
                  )}
                </div>
                <Button 
                  type="button"
                  onClick={handleNextStep}
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {t('form.submitting')}
                    </div>
                  ) : currentStep === 'review' ? (
                    t('form.confirmBooking')
                  ) : (
                    t('form.next')
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// Enhanced Guest Info Step with profile integration
function EnhancedGuestInfoStep({ 
  form, 
  t, 
  onProfilePreFill, 
  user 
}: { 
  form: any; 
  t: any; 
  onProfilePreFill: (profile: UserProfile) => void;
  user: User;
}) {
  const handleQuickFill = () => {
    // Quick fill with basic user data
    const profile: UserProfile = {
      firstName: user.full_name?.split(' ')[0] || '',
      lastName: user.full_name?.split(' ').slice(1).join(' ') || '',
      email: user.email || '',
      phone: '',
      nationality: '',
      dateOfBirth: '',
      preferences: {
        language: 'fr',
        currency: 'EUR',
        notifications: {
          email: true,
          sms: false,
          marketing: false
        }
      }
    };
    onProfilePreFill(profile);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">{t('steps.guestInfo.title')}</h3>
          <p className="text-muted-foreground">{t('steps.guestInfo.description')}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleQuickFill}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {t('quickFill')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="primaryGuest.firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.firstName')} *</FormLabel>
              <FormControl>
                <Input placeholder={t('form.firstNamePlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="primaryGuest.lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.lastName')} *</FormLabel>
              <FormControl>
                <Input placeholder={t('form.lastNamePlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="primaryGuest.email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.email')} *</FormLabel>
              <FormControl>
                <Input type="email" placeholder={t('form.emailPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="primaryGuest.phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.phone')} *</FormLabel>
              <FormControl>
                <Input type="tel" placeholder={t('form.phonePlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="primaryGuest.nationality"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.nationality')} *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('form.nationalityPlaceholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="DZ">Algeria</SelectItem>
                  <SelectItem value="MA">Morocco</SelectItem>
                  <SelectItem value="TN">Tunisia</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="ES">Spain</SelectItem>
                  <SelectItem value="IT">Italy</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="primaryGuest.dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.dateOfBirth')} *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="primaryGuest.idNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form.idNumber')}</FormLabel>
            <FormControl>
              <Input placeholder={t('form.idNumberPlaceholder')} {...field} />
            </FormControl>
            <FormDescription>{t('form.idNumberDescription')}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />

      <div>
        <h4 className="font-medium mb-4">{t('form.emergencyContact')}</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="primaryGuest.emergencyContact.name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.emergencyContactName')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('form.emergencyContactNamePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="primaryGuest.emergencyContact.phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.emergencyContactPhone')}</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder={t('form.emergencyContactPhonePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="primaryGuest.emergencyContact.relationship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.emergencyContactRelationship')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.emergencyContactRelationshipPlaceholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="friend">Friend</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}

// Re-export existing step components with minor modifications
function AdditionalGuestsStep({ 
  form, 
  t, 
  fields, 
  onAddGuest, 
  onRemoveGuest, 
  maxGuests 
}: { 
  form: any; 
  t: any; 
  fields: any[]; 
  onAddGuest: () => void; 
  onRemoveGuest: (index: number) => void;
  maxGuests: number;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('steps.additionalGuests.title')}</h3>
        <p className="text-muted-foreground mb-6">{t('steps.additionalGuests.description')}</p>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{t('steps.additionalGuests.noGuests')}</p>
          {maxGuests > 0 && (
            <Button type="button" variant="outline" onClick={onAddGuest}>
              {t('steps.additionalGuests.addGuest')}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">{t('steps.additionalGuests.guest', { number: index + 1 })}</h4>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onRemoveGuest(index)}
                  >
                    {t('form.remove')}
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name={`additionalGuests.${index}.firstName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.firstName')} *</FormLabel>
                        <FormControl>
                          <Input placeholder={t('form.firstNamePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`additionalGuests.${index}.lastName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.lastName')} *</FormLabel>
                        <FormControl>
                          <Input placeholder={t('form.lastNamePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`additionalGuests.${index}.age`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.age')} *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="120" 
                            placeholder={t('form.agePlaceholder')} 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {fields.length < maxGuests && (
            <Button type="button" variant="outline" onClick={onAddGuest} className="w-full">
              {t('steps.additionalGuests.addGuest')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function PreferencesStep({ form, t }: { form: any; t: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('steps.preferences.title')}</h3>
        <p className="text-muted-foreground mb-6">{t('steps.preferences.description')}</p>
      </div>

      <FormField
        control={form.control}
        name="preferences.arrivalTime"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form.arrivalTime')}</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t('form.arrivalTimePlaceholder')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="morning">Morning (8:00 - 12:00)</SelectItem>
                <SelectItem value="afternoon">Afternoon (12:00 - 18:00)</SelectItem>
                <SelectItem value="evening">Evening (18:00 - 22:00)</SelectItem>
                <SelectItem value="flexible">Flexible</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="preferences.specialRequests"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form.specialRequests')}</FormLabel>
            <FormControl>
              <Textarea 
                placeholder={t('form.specialRequestsPlaceholder')} 
                rows={4}
                {...field} 
              />
            </FormControl>
            <FormDescription>{t('form.specialRequestsDescription')}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="preferences.accessibilityNeeds"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form.accessibilityNeeds')}</FormLabel>
            <FormControl>
              <Textarea 
                placeholder={t('form.accessibilityNeedsPlaceholder')} 
                rows={3}
                {...field} 
              />
            </FormControl>
            <FormDescription>{t('form.accessibilityNeedsDescription')}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="preferences.dietaryRestrictions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form.dietaryRestrictions')}</FormLabel>
            <FormControl>
              <Textarea 
                placeholder={t('form.dietaryRestrictionsPlaceholder')} 
                rows={3}
                {...field} 
              />
            </FormControl>
            <FormDescription>{t('form.dietaryRestrictionsDescription')}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function ReviewStep({ 
  form, 
  t, 
  loft, 
  checkIn, 
  checkOut, 
  guests, 
  nights, 
  pricing 
}: { 
  form: any; 
  t: any; 
  loft: Loft; 
  checkIn: string; 
  checkOut: string; 
  guests: number; 
  nights: number; 
  pricing: PricingBreakdown; 
}) {
  const formData = form.getValues();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('steps.review.title')}</h3>
        <p className="text-muted-foreground mb-6">{t('steps.review.description')}</p>
      </div>

      {/* Booking Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('review.bookingSummary')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">{t('review.property')}</Label>
              <p className="font-medium">{loft.name}</p>
              <p className="text-sm text-muted-foreground">{loft.address}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">{t('review.dates')}</Label>
              <p className="font-medium">{new Date(checkIn).toLocaleDateString()} - {new Date(checkOut).toLocaleDateString()}</p>
              <p className="text-sm text-muted-foreground">{nights} {nights === 1 ? 'night' : 'nights'}</p>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">{t('review.guests')}</Label>
            <p className="font-medium">{guests} {guests === 1 ? 'guest' : 'guests'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Guest Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('review.guestInformation')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">{t('review.primaryGuest')}</Label>
            <p className="font-medium">{formData.primaryGuest.firstName} {formData.primaryGuest.lastName}</p>
            <p className="text-sm text-muted-foreground">{formData.primaryGuest.email}</p>
            <p className="text-sm text-muted-foreground">{formData.primaryGuest.phone}</p>
          </div>
          {formData.additionalGuests && formData.additionalGuests.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">{t('review.additionalGuests')}</Label>
              {formData.additionalGuests.map((guest: AdditionalGuest, index: number) => (
                <p key={index} className="text-sm">
                  {guest.firstName} {guest.lastName} ({guest.age} years old)
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('review.pricingBreakdown')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>€{pricing.nightlyRate.toFixed(2)} × {nights} nights</span>
            <span>€{pricing.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('pricing.cleaningFee')}</span>
            <span>€{pricing.cleaningFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('pricing.serviceFee')}</span>
            <span>€{pricing.serviceFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('pricing.taxes')}</span>
            <span>€{pricing.taxes.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>{t('pricing.total')}</span>
            <span>€{pricing.total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="termsAccepted"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm">
                  {t('form.termsAcceptance')} *
                </FormLabel>
                <FormDescription>
                  {t('form.termsDescription')}
                </FormDescription>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="privacyAccepted"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm">
                  {t('form.privacyAcceptance')} *
                </FormLabel>
                <FormDescription>
                  {t('form.privacyDescription')}
                </FormDescription>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="marketingConsent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm">
                  {t('form.marketingConsent')}
                </FormLabel>
                <FormDescription>
                  {t('form.marketingDescription')}
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}