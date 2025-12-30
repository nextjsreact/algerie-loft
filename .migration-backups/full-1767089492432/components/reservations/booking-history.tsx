'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Calendar,
  MapPin,
  Users,
  Euro,
  Clock,
  Eye,
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Building,
  Star,
  MessageCircle,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

// Booking history types
interface BookingHistoryItem {
  id: string;
  loft: {
    id: string;
    name: string;
    address: string;
    images?: string[];
  };
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  totalAmount: number;
  currency: string;
  bookingReference: string;
  createdAt: string;
  specialRequests?: string;
  rating?: number;
  review?: string;
}

interface BookingHistoryFilters {
  status?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

interface BookingHistoryProps {
  userId: string;
  className?: string;
}

export function BookingHistory({ userId, className }: BookingHistoryProps) {
  const t = useTranslations('bookingHistory');
  const [bookings, setBookings] = useState<BookingHistoryItem[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<BookingHistoryFilters>({});
  const [selectedBooking, setSelectedBooking] = useState<BookingHistoryItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Load booking history
  useEffect(() => {
    loadBookingHistory();
  }, [userId]);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [bookings, filters]);

  const loadBookingHistory = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would fetch from your API
      // For now, we'll simulate with mock data
      const mockBookings: BookingHistoryItem[] = [
        {
          id: '1',
          loft: {
            id: 'loft-1',
            name: 'Luxury Apartment Downtown',
            address: '123 Main Street, Algiers',
            images: ['/images/loft1.jpg']
          },
          checkIn: '2024-01-15',
          checkOut: '2024-01-20',
          guests: 2,
          nights: 5,
          status: 'completed',
          paymentStatus: 'paid',
          totalAmount: 750.00,
          currency: 'EUR',
          bookingReference: 'BK-2024-001',
          createdAt: '2024-01-10T10:00:00Z',
          specialRequests: 'Late check-in requested',
          rating: 5,
          review: 'Excellent stay, highly recommended!'
        },
        {
          id: '2',
          loft: {
            id: 'loft-2',
            name: 'Cozy Studio Near Beach',
            address: '456 Beach Road, Oran',
            images: ['/images/loft2.jpg']
          },
          checkIn: '2024-02-10',
          checkOut: '2024-02-12',
          guests: 1,
          nights: 2,
          status: 'confirmed',
          paymentStatus: 'paid',
          totalAmount: 200.00,
          currency: 'EUR',
          bookingReference: 'BK-2024-002',
          createdAt: '2024-02-05T14:30:00Z'
        },
        {
          id: '3',
          loft: {
            id: 'loft-3',
            name: 'Modern Loft City Center',
            address: '789 Center Plaza, Constantine',
            images: ['/images/loft3.jpg']
          },
          checkIn: '2024-03-01',
          checkOut: '2024-03-05',
          guests: 4,
          nights: 4,
          status: 'pending',
          paymentStatus: 'pending',
          totalAmount: 600.00,
          currency: 'EUR',
          bookingReference: 'BK-2024-003',
          createdAt: '2024-02-25T09:15:00Z',
          specialRequests: 'Extra towels and early check-in'
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setBookings(mockBookings);
    } catch (error) {
      console.error('Error loading booking history:', error);
      toast.error(t('loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    // Status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(booking => booking.status === filters.status);
    }

    // Payment status filter
    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      filtered = filtered.filter(booking => booking.paymentStatus === filters.paymentStatus);
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(booking => 
        new Date(booking.checkIn) >= new Date(filters.dateFrom!)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(booking => 
        new Date(booking.checkOut) <= new Date(filters.dateTo!)
      );
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.loft.name.toLowerCase().includes(searchTerm) ||
        booking.loft.address.toLowerCase().includes(searchTerm) ||
        booking.bookingReference.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredBookings(filtered);
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'confirmed': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'refunded': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'failed': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleDownloadReceipt = (booking: BookingHistoryItem) => {
    // In a real implementation, this would generate and download a PDF receipt
    toast.success(t('receiptDownloaded'));
  };

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

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

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{t('title')}</CardTitle>
              <CardDescription>{t('description')}</CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              {filteredBookings.length} {t('bookings')}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="search" className="text-sm">{t('search')}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder={t('searchPlaceholder')}
                    value={filters.search || ''}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status" className="text-sm">{t('status')}</Label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('allStatuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allStatuses')}</SelectItem>
                    <SelectItem value="pending">{t('statusPending')}</SelectItem>
                    <SelectItem value="confirmed">{t('statusConfirmed')}</SelectItem>
                    <SelectItem value="completed">{t('statusCompleted')}</SelectItem>
                    <SelectItem value="cancelled">{t('statusCancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentStatus" className="text-sm">{t('paymentStatus')}</Label>
                <Select
                  value={filters.paymentStatus || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, paymentStatus: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('allPaymentStatuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allPaymentStatuses')}</SelectItem>
                    <SelectItem value="pending">{t('paymentPending')}</SelectItem>
                    <SelectItem value="paid">{t('paymentPaid')}</SelectItem>
                    <SelectItem value="refunded">{t('paymentRefunded')}</SelectItem>
                    <SelectItem value="failed">{t('paymentFailed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dateFrom" className="text-sm">{t('dateFrom')}</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="dateTo" className="text-sm">{t('dateTo')}</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({})}
              >
                <Filter className="h-4 w-4 mr-2" />
                {t('clearFilters')}
              </Button>
            </div>
          </div>

          {/* Booking List */}
          {currentBookings.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('noBookings')}</h3>
              <p className="text-muted-foreground">{t('noBookingsDescription')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentBookings.map((booking) => (
                <Card key={booking.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          {/* Loft Image */}
                          <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                            <Building className="h-8 w-8 text-muted-foreground" />
                          </div>

                          {/* Booking Details */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">{booking.loft.name}</h3>
                                <p className="text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {booking.loft.address}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-lg">
                                  {booking.currency === 'EUR' ? '€' : booking.currency}{booking.totalAmount.toFixed(2)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {t('reference')}: {booking.bookingReference}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">
                                    {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {booking.nights} {booking.nights === 1 ? t('night') : t('nights')}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">
                                    {booking.guests} {booking.guests === 1 ? t('guest') : t('guests')}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(booking.status)}>
                                  {getStatusIcon(booking.status)}
                                  <span className="ml-1">{t(`status${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}`)}</span>
                                </Badge>
                              </div>

                              <div className="flex items-center gap-2">
                                <Badge className={getPaymentStatusColor(booking.paymentStatus)}>
                                  <Euro className="h-3 w-3" />
                                  <span className="ml-1">{t(`payment${booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}`)}</span>
                                </Badge>
                              </div>
                            </div>

                            {/* Rating and Review */}
                            {booking.rating && (
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < booking.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {booking.rating}/5
                                </span>
                              </div>
                            )}

                            {booking.review && (
                              <p className="text-sm text-muted-foreground italic">
                                "{booking.review}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedBooking(booking)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              {t('viewDetails')}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{t('bookingDetails')}</DialogTitle>
                              <DialogDescription>
                                {t('bookingDetailsDescription')}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedBooking && (
                              <BookingDetailsModal booking={selectedBooking} t={t} />
                            )}
                          </DialogContent>
                        </Dialog>

                        {booking.paymentStatus === 'paid' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadReceipt(booking)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {t('receipt')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                {t('showingResults', {
                  start: startIndex + 1,
                  end: Math.min(endIndex, filteredBookings.length),
                  total: filteredBookings.length
                })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t('previous')}
                </Button>
                <span className="text-sm">
                  {t('pageOf', { current: currentPage, total: totalPages })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  {t('next')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Booking details modal component
function BookingDetailsModal({ booking, t }: { booking: BookingHistoryItem; t: any }) {
  return (
    <div className="space-y-6">
      {/* Loft Information */}
      <div>
        <h4 className="font-medium mb-3">{t('loftInformation')}</h4>
        <div className="p-4 bg-muted/50 rounded-lg">
          <h5 className="font-medium">{booking.loft.name}</h5>
          <p className="text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-4 w-4" />
            {booking.loft.address}
          </p>
        </div>
      </div>

      {/* Booking Information */}
      <div>
        <h4 className="font-medium mb-3">{t('bookingInformation')}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <Label className="text-sm text-muted-foreground">{t('checkIn')}</Label>
            <p className="font-medium">{new Date(booking.checkIn).toLocaleDateString()}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <Label className="text-sm text-muted-foreground">{t('checkOut')}</Label>
            <p className="font-medium">{new Date(booking.checkOut).toLocaleDateString()}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <Label className="text-sm text-muted-foreground">{t('guests')}</Label>
            <p className="font-medium">{booking.guests}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <Label className="text-sm text-muted-foreground">{t('nights')}</Label>
            <p className="font-medium">{booking.nights}</p>
          </div>
        </div>
      </div>

      {/* Status Information */}
      <div>
        <h4 className="font-medium mb-3">{t('statusInformation')}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <Label className="text-sm text-muted-foreground">{t('bookingStatus')}</Label>
            <Badge className={`mt-1 ${booking.status === 'completed' ? 'bg-green-500/20 text-green-300' : 
              booking.status === 'confirmed' ? 'bg-blue-500/20 text-blue-300' :
              booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-red-500/20 text-red-300'}`}>
              {t(`status${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}`)}
            </Badge>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <Label className="text-sm text-muted-foreground">{t('paymentStatus')}</Label>
            <Badge className={`mt-1 ${booking.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-300' : 
              booking.paymentStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
              booking.paymentStatus === 'refunded' ? 'bg-blue-500/20 text-blue-300' :
              'bg-red-500/20 text-red-300'}`}>
              {t(`payment${booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}`)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Pricing Information */}
      <div>
        <h4 className="font-medium mb-3">{t('pricingInformation')}</h4>
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">{t('totalAmount')}</span>
            <span className="font-semibold text-lg">
              {booking.currency === 'EUR' ? '€' : booking.currency}{booking.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Special Requests */}
      {booking.specialRequests && (
        <div>
          <h4 className="font-medium mb-3">{t('specialRequests')}</h4>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p>{booking.specialRequests}</p>
          </div>
        </div>
      )}

      {/* Review */}
      {booking.rating && booking.review && (
        <div>
          <h4 className="font-medium mb-3">{t('yourReview')}</h4>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < booking.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="text-sm text-muted-foreground">
                {booking.rating}/5
              </span>
            </div>
            <p>{booking.review}</p>
          </div>
        </div>
      )}
    </div>
  );
}