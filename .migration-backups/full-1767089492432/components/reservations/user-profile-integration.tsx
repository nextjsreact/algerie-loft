'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { User, Settings, Edit, Save, X, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

// User profile schema
const userProfileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50, "First name is too long"),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50, "Last name is too long"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  nationality: z.string().min(2, "Please select your nationality"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  emergencyContact: z.object({
    name: z.string().min(2, "Emergency contact name is required"),
    phone: z.string().min(10, "Emergency contact phone is required"),
    relationship: z.string().min(1, "Relationship is required")
  }).optional(),
  preferences: z.object({
    language: z.string().default('fr'),
    currency: z.string().default('EUR'),
    notifications: z.object({
      email: z.boolean().default(true),
      sms: z.boolean().default(false),
      marketing: z.boolean().default(false)
    })
  })
});

// User profile type
export type UserProfile = z.infer<typeof userProfileSchema>;

interface UserProfileIntegrationProps {
  user: any; // Current user from auth
  onProfileUpdate?: (profile: UserProfile) => void;
  onDataPreFill?: (data: Partial<UserProfile>) => void;
  className?: string;
}

export function UserProfileIntegration({ 
  user, 
  onProfileUpdate, 
  onDataPreFill,
  className 
}: UserProfileIntegrationProps) {
  const t = useTranslations('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const form = useForm<UserProfile>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      nationality: '',
      dateOfBirth: '',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
      preferences: {
        language: 'fr',
        currency: 'EUR',
        notifications: {
          email: true,
          sms: false,
          marketing: false
        }
      }
    }
  });

  // Load user profile data
  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would fetch from your API
      // For now, we'll use the user data and create a profile structure
      const userProfile: UserProfile = {
        firstName: user.full_name?.split(' ')[0] || '',
        lastName: user.full_name?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || '',
        nationality: user.nationality || '',
        dateOfBirth: user.date_of_birth || '',
        emergencyContact: user.emergency_contact || {
          name: '',
          phone: '',
          relationship: ''
        },
        preferences: user.preferences || {
          language: 'fr',
          currency: 'EUR',
          notifications: {
            email: true,
            sms: false,
            marketing: false
          }
        }
      };

      setProfile(userProfile);
      form.reset(userProfile);

      // Pre-fill booking form data if callback provided
      if (onDataPreFill) {
        onDataPreFill(userProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast.error(t('loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (data: UserProfile) => {
    setIsLoading(true);
    try {
      // In a real implementation, this would save to your API
      // For now, we'll simulate the save and update local state
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProfile(data);
      setIsEditing(false);
      
      if (onProfileUpdate) {
        onProfileUpdate(data);
      }
      
      toast.success(t('saveSuccess'));
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(t('saveError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreFillBookingForm = () => {
    if (profile && onDataPreFill) {
      onDataPreFill(profile);
      toast.success(t('preFillSuccess'));
    }
  };

  if (isLoading && !profile) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="ml-2">{t('loading')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <User className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">{t('title')}</CardTitle>
              <CardDescription>{t('description')}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreFillBookingForm}
                disabled={isLoading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {t('preFillForm')}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              disabled={isLoading}
            >
              {isEditing ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  {t('cancel')}
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('edit')}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!isEditing && profile ? (
          <ProfileDisplay profile={profile} t={t} />
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveProfile)} className="space-y-6">
              <ProfileEditForm form={form} t={t} />
              
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isLoading}
                >
                  {t('cancel')}
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {t('saving')}
                    </div>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {t('save')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}

// Profile display component
function ProfileDisplay({ profile, t }: { profile: UserProfile; t: any }) {
  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <User className="h-4 w-4" />
          {t('personalInfo')}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <Label className="text-sm text-muted-foreground">{t('firstName')}</Label>
            <p className="font-medium">{profile.firstName}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <Label className="text-sm text-muted-foreground">{t('lastName')}</Label>
            <p className="font-medium">{profile.lastName}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <Label className="text-sm text-muted-foreground">{t('email')}</Label>
            <p className="font-medium">{profile.email}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <Label className="text-sm text-muted-foreground">{t('phone')}</Label>
            <p className="font-medium">{profile.phone}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <Label className="text-sm text-muted-foreground">{t('nationality')}</Label>
            <p className="font-medium">{profile.nationality}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <Label className="text-sm text-muted-foreground">{t('dateOfBirth')}</Label>
            <p className="font-medium">{profile.dateOfBirth}</p>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      {profile.emergencyContact && (
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {t('emergencyContact')}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <Label className="text-sm text-muted-foreground">{t('emergencyContactName')}</Label>
              <p className="font-medium">{profile.emergencyContact.name}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <Label className="text-sm text-muted-foreground">{t('emergencyContactPhone')}</Label>
              <p className="font-medium">{profile.emergencyContact.phone}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <Label className="text-sm text-muted-foreground">{t('emergencyContactRelationship')}</Label>
              <p className="font-medium">{profile.emergencyContact.relationship}</p>
            </div>
          </div>
        </div>
      )}

      {/* Preferences */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Settings className="h-4 w-4" />
          {t('preferences')}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <Label className="text-sm text-muted-foreground">{t('language')}</Label>
            <p className="font-medium">{profile.preferences.language}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <Label className="text-sm text-muted-foreground">{t('currency')}</Label>
            <p className="font-medium">{profile.preferences.currency}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <Label className="text-sm text-muted-foreground">{t('notifications')}</Label>
            <div className="flex gap-2 mt-1">
              {profile.preferences.notifications.email && (
                <Badge variant="secondary" className="text-xs">Email</Badge>
              )}
              {profile.preferences.notifications.sms && (
                <Badge variant="secondary" className="text-xs">SMS</Badge>
              )}
              {profile.preferences.notifications.marketing && (
                <Badge variant="secondary" className="text-xs">Marketing</Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile edit form component
function ProfileEditForm({ form, t }: { form: any; t: any }) {
  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <div>
        <h4 className="font-medium mb-4">{t('personalInfo')}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('firstName')} *</FormLabel>
                <FormControl>
                  <Input placeholder={t('firstNamePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('lastName')} *</FormLabel>
                <FormControl>
                  <Input placeholder={t('lastNamePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('email')} *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder={t('emailPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('phone')} *</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder={t('phonePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('nationality')} *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('nationalityPlaceholder')} />
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
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('dateOfBirth')} *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <Separator />

      {/* Emergency Contact */}
      <div>
        <h4 className="font-medium mb-4">{t('emergencyContact')}</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="emergencyContact.name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('emergencyContactName')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('emergencyContactNamePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emergencyContact.phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('emergencyContactPhone')}</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder={t('emergencyContactPhonePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emergencyContact.relationship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('emergencyContactRelationship')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('emergencyContactRelationshipPlaceholder')} />
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

      <Separator />

      {/* Preferences */}
      <div>
        <h4 className="font-medium mb-4">{t('preferences')}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="preferences.language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('language')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('languagePlaceholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="preferences.currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('currency')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('currencyPlaceholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="DZD">DZD (د.ج)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mt-4">
          <Label className="text-sm font-medium">{t('notificationPreferences')}</Label>
          <div className="space-y-3 mt-2">
            <FormField
              control={form.control}
              name="preferences.notifications.email"
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
                      {t('emailNotifications')}
                    </FormLabel>
                    <FormDescription>
                      {t('emailNotificationsDescription')}
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferences.notifications.sms"
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
                      {t('smsNotifications')}
                    </FormLabel>
                    <FormDescription>
                      {t('smsNotificationsDescription')}
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferences.notifications.marketing"
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
                      {t('marketingNotifications')}
                    </FormLabel>
                    <FormDescription>
                      {t('marketingNotificationsDescription')}
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}