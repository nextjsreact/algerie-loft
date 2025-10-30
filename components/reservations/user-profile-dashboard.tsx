'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User,
  Settings,
  History,
  Star,
  MapPin,
  Calendar,
  Euro,
  TrendingUp,
  Heart,
  Building,
  Phone,
  Mail,
  Globe,
  Bell,
  CreditCard,
  Award,
  Target,
  Activity
} from 'lucide-react';
import { UserProfileIntegration } from './user-profile-integration';
import { BookingHistory } from './booking-history';
import { toast } from 'sonner';

interface UserProfileDashboardProps {
  user: any;
  className?: string;
}

interface UserStatistics {
  totalBookings: number;
  completedBookings: number;
  totalSpent: number;
  averageRating: number;
  favoriteDestinations: string[];
}

export function UserProfileDashboard({ user, className }: UserProfileDashboardProps) {
  const t = useTranslations('profileDashboard');
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadUserStatistics();
  }, [user]);

  const loadUserStatistics = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would fetch from your API
      // For now, we'll simulate with mock data
      const mockStatistics: UserStatistics = {
        totalBookings: 12,
        completedBookings: 10,
        totalSpent: 2450.00,
        averageRating: 4.8,
        favoriteDestinations: ['Algiers', 'Oran', 'Constantine']
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStatistics(mockStatistics);
    } catch (error) {
      console.error('Error loading user statistics:', error);
      toast.error(t('statisticsLoadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getLoyaltyLevel = (totalBookings: number) => {
    if (totalBookings >= 20) return { level: 'Platinum', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
    if (totalBookings >= 10) return { level: 'Gold', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' };
    if (totalBookings >= 5) return { level: 'Silver', color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' };
    return { level: 'Bronze', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' };
  };

  if (isLoading) {
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

  const loyaltyLevel = statistics ? getLoyaltyLevel(statistics.totalBookings) : null;

  return (
    <div className={className}>
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <Avatar className="h-20 w-20 border-4 border-white/20">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xl">
                {getInitials(user.full_name || user.email || 'User')}
              </AvatarFallback>
            </Avatar>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{user.full_name || t('welcomeUser')}</h1>
                  <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </p>
                  {user.phone && (
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4" />
                      {user.phone}
                    </p>
                  )}
                </div>
                
                {loyaltyLevel && (
                  <Badge className={loyaltyLevel.color}>
                    <Award className="h-4 w-4 mr-1" />
                    {loyaltyLevel.level} {t('member')}
                  </Badge>
                )}
              </div>

              {/* Quick Stats */}
              {statistics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-500">{statistics.totalBookings}</div>
                    <div className="text-sm text-muted-foreground">{t('totalBookings')}</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-500">€{statistics.totalSpent.toFixed(0)}</div>
                    <div className="text-sm text-muted-foreground">{t('totalSpent')}</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-500">{statistics.averageRating}</div>
                    <div className="text-sm text-muted-foreground">{t('averageRating')}</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-500">{statistics.completedBookings}</div>
                    <div className="text-sm text-muted-foreground">{t('completedStays')}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {t('overview')}
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {t('profile')}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            {t('bookingHistory')}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t('preferences')}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  {t('recentActivity')}
                </CardTitle>
                <CardDescription>{t('recentActivityDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{t('bookingCompleted')}</p>
                      <p className="text-sm text-muted-foreground">Luxury Apartment Downtown - 2 days ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Star className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{t('reviewSubmitted')}</p>
                      <p className="text-sm text-muted-foreground">5-star review for Cozy Studio - 1 week ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Calendar className="h-4 w-4 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{t('upcomingBooking')}</p>
                      <p className="text-sm text-muted-foreground">Modern Loft City Center - Next month</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Favorite Destinations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  {t('favoriteDestinations')}
                </CardTitle>
                <CardDescription>{t('favoriteDestinationsDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                {statistics && statistics.favoriteDestinations.length > 0 ? (
                  <div className="space-y-3">
                    {statistics.favoriteDestinations.map((destination, index) => (
                      <div key={destination} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="p-2 bg-orange-500/20 rounded-lg">
                          <MapPin className="h-4 w-4 text-orange-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{destination}</p>
                          <p className="text-sm text-muted-foreground">
                            {index === 0 ? t('mostVisited') : `${index + 1} ${t('visits')}`}
                          </p>
                        </div>
                        <Badge variant="outline">#{index + 1}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('noDestinations')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {t('achievements')}
              </CardTitle>
              <CardDescription>{t('achievementsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
                  <div className="p-3 bg-blue-500/20 rounded-full w-fit mx-auto mb-3">
                    <User className="h-6 w-6 text-blue-500" />
                  </div>
                  <h4 className="font-medium">{t('firstBooking')}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{t('firstBookingDescription')}</p>
                  <Badge className="mt-2 bg-blue-500/20 text-blue-300 border-blue-500/30">
                    {t('achieved')}
                  </Badge>
                </div>

                <div className="text-center p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                  <div className="p-3 bg-green-500/20 rounded-full w-fit mx-auto mb-3">
                    <Star className="h-6 w-6 text-green-500" />
                  </div>
                  <h4 className="font-medium">{t('fiveStarReviewer')}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{t('fiveStarReviewerDescription')}</p>
                  <Badge className="mt-2 bg-green-500/20 text-green-300 border-green-500/30">
                    {t('achieved')}
                  </Badge>
                </div>

                <div className="text-center p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                  <div className="p-3 bg-purple-500/20 rounded-full w-fit mx-auto mb-3">
                    <Award className="h-6 w-6 text-purple-500" />
                  </div>
                  <h4 className="font-medium">{t('loyalGuest')}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{t('loyalGuestDescription')}</p>
                  <Badge className="mt-2 bg-purple-500/20 text-purple-300 border-purple-500/30">
                    {statistics && statistics.totalBookings >= 10 ? t('achieved') : `${statistics?.totalBookings || 0}/10`}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <UserProfileIntegration
            user={user}
            onProfileUpdate={(profile) => {
              toast.success(t('profileUpdated'));
            }}
          />
        </TabsContent>

        {/* Booking History Tab */}
        <TabsContent value="history">
          <BookingHistory userId={user.id} />
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t('notificationPreferences')}
              </CardTitle>
              <CardDescription>{t('notificationPreferencesDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{t('emailNotifications')}</p>
                    <p className="text-sm text-muted-foreground">{t('emailNotificationsDescription')}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    {t('manage')}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{t('smsNotifications')}</p>
                    <p className="text-sm text-muted-foreground">{t('smsNotificationsDescription')}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    {t('manage')}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{t('marketingEmails')}</p>
                    <p className="text-sm text-muted-foreground">{t('marketingEmailsDescription')}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    {t('manage')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t('languageAndRegion')}
              </CardTitle>
              <CardDescription>{t('languageAndRegionDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{t('language')}</p>
                    <p className="text-sm text-muted-foreground">Français</p>
                  </div>
                  <Button variant="outline" size="sm">
                    {t('change')}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{t('currency')}</p>
                    <p className="text-sm text-muted-foreground">EUR (€)</p>
                  </div>
                  <Button variant="outline" size="sm">
                    {t('change')}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{t('timezone')}</p>
                    <p className="text-sm text-muted-foreground">Central European Time (CET)</p>
                  </div>
                  <Button variant="outline" size="sm">
                    {t('change')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t('paymentMethods')}
              </CardTitle>
              <CardDescription>{t('paymentMethodsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">{t('noPaymentMethods')}</p>
                <Button variant="outline">
                  {t('addPaymentMethod')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}