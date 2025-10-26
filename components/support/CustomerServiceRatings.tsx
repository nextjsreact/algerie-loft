'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  Clock, 
  Users, 
  MessageCircle, 
  Phone, 
  Mail,
  TrendingUp,
  Award,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SupportAvailabilityIndicator } from './SupportAvailabilityIndicator';

interface CustomerServiceRatingsProps {
  locale?: string;
  className?: string;
  showDetailedMetrics?: boolean;
}

interface SupportMetrics {
  overallRating: number;
  totalReviews: number;
  responseTime: {
    chat: string;
    email: string;
    phone: string;
  };
  availability: {
    chat: boolean;
    email: boolean;
    phone: boolean;
  };
  satisfactionRate: number;
  resolutionRate: number;
  channels: {
    id: string;
    name: string;
    rating: number;
    responseTime: string;
    availability: string;
    isAvailable: boolean;
    icon: React.ReactNode;
  }[];
}

/**
 * Customer Service Ratings and Availability Display Component
 * Shows customer service ratings, response times, and availability hours
 * Requirements: 8.5 - Display customer service ratings and availability hours
 */
export function CustomerServiceRatings({ 
  locale = 'fr', 
  className = '',
  showDetailedMetrics = true 
}: CustomerServiceRatingsProps) {
  const [metrics, setMetrics] = useState<SupportMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Multilingual content
  const content = {
    fr: {
      title: "Qualité de notre service client",
      subtitle: "Nos équipes sont là pour vous accompagner",
      overallRating: "Note globale",
      basedOnReviews: "basée sur {count} avis",
      responseTime: "Temps de réponse",
      availability: "Disponibilité",
      satisfactionRate: "Taux de satisfaction",
      resolutionRate: "Taux de résolution",
      channels: {
        chat: "Chat en direct",
        email: "Email",
        phone: "Téléphone"
      },
      status: {
        available: "Disponible",
        unavailable: "Indisponible",
        busy: "Occupé"
      },
      metrics: {
        excellent: "Excellent",
        good: "Bon",
        average: "Moyen",
        poor: "À améliorer"
      },
      hours: {
        "24/7": "24h/24, 7j/7",
        "business": "Lun-Ven 8h-18h",
        "extended": "Lun-Dim 8h-22h"
      }
    },
    en: {
      title: "Our customer service quality",
      subtitle: "Our teams are here to support you",
      overallRating: "Overall rating",
      basedOnReviews: "based on {count} reviews",
      responseTime: "Response time",
      availability: "Availability",
      satisfactionRate: "Satisfaction rate",
      resolutionRate: "Resolution rate",
      channels: {
        chat: "Live Chat",
        email: "Email",
        phone: "Phone"
      },
      status: {
        available: "Available",
        unavailable: "Unavailable",
        busy: "Busy"
      },
      metrics: {
        excellent: "Excellent",
        good: "Good",
        average: "Average",
        poor: "Needs improvement"
      },
      hours: {
        "24/7": "24/7",
        "business": "Mon-Fri 8am-6pm",
        "extended": "Mon-Sun 8am-10pm"
      }
    },
    ar: {
      title: "جودة خدمة العملاء لدينا",
      subtitle: "فرقنا هنا لدعمك",
      overallRating: "التقييم العام",
      basedOnReviews: "بناءً على {count} تقييم",
      responseTime: "وقت الاستجابة",
      availability: "التوفر",
      satisfactionRate: "معدل الرضا",
      resolutionRate: "معدل الحل",
      channels: {
        chat: "دردشة مباشرة",
        email: "بريد إلكتروني",
        phone: "هاتف"
      },
      status: {
        available: "متاح",
        unavailable: "غير متاح",
        busy: "مشغول"
      },
      metrics: {
        excellent: "ممتاز",
        good: "جيد",
        average: "متوسط",
        poor: "يحتاج تحسين"
      },
      hours: {
        "24/7": "24/7",
        "business": "الإثنين-الجمعة 8ص-6م",
        "extended": "الإثنين-الأحد 8ص-10م"
      }
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  // Simulate fetching support metrics (replace with real API call)
  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with real API call
      const mockMetrics: SupportMetrics = {
        overallRating: 4.8,
        totalReviews: 2847,
        responseTime: {
          chat: "< 2 min",
          email: "2-4h",
          phone: "Immédiat"
        },
        availability: {
          chat: true,
          email: true,
          phone: true
        },
        satisfactionRate: 96,
        resolutionRate: 94,
        channels: [
          {
            id: 'chat',
            name: text.channels.chat,
            rating: 4.9,
            responseTime: "< 2 min",
            availability: text.hours["24/7"],
            isAvailable: true,
            icon: <MessageCircle className="w-5 h-5" />
          },
          {
            id: 'phone',
            name: text.channels.phone,
            rating: 4.8,
            responseTime: text.responseTime === content.fr.responseTime ? "Immédiat" : "Immediate",
            availability: text.hours.extended,
            isAvailable: true,
            icon: <Phone className="w-5 h-5" />
          },
          {
            id: 'email',
            name: text.channels.email,
            rating: 4.7,
            responseTime: "2-4h",
            availability: text.hours["24/7"],
            isAvailable: true,
            icon: <Mail className="w-5 h-5" />
          }
        ]
      };
      
      setMetrics(mockMetrics);
      setLoading(false);
    };

    fetchMetrics();
  }, [locale]);

  const getRatingColor = (rating: number) => {
    if (rating >= 4.8) return 'text-green-600';
    if (rating >= 4.5) return 'text-yellow-600';
    if (rating >= 4.0) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRatingBgColor = (rating: number) => {
    if (rating >= 4.8) return 'bg-green-100 dark:bg-green-900/20';
    if (rating >= 4.5) return 'bg-yellow-100 dark:bg-yellow-900/20';
    if (rating >= 4.0) return 'bg-orange-100 dark:bg-orange-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  const getRatingText = (rating: number) => {
    if (rating >= 4.8) return text.metrics.excellent;
    if (rating >= 4.5) return text.metrics.good;
    if (rating >= 4.0) return text.metrics.average;
    return text.metrics.poor;
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          {text.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {text.subtitle}
        </p>
      </div>

      {/* Overall Rating Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="text-center">
          <CardHeader>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className={`p-3 rounded-full ${getRatingBgColor(metrics.overallRating)}`}>
                <Award className={`w-6 h-6 ${getRatingColor(metrics.overallRating)}`} />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">
              {metrics.overallRating}
              <span className="text-lg font-normal text-muted-foreground ml-1">/5</span>
            </CardTitle>
            <CardDescription>
              <div className="flex items-center justify-center space-x-1 mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.floor(metrics.overallRating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className={getRatingColor(metrics.overallRating)}>
                {getRatingText(metrics.overallRating)}
              </span>
              <br />
              <span className="text-sm">
                {text.basedOnReviews.replace('{count}', metrics.totalReviews.toLocaleString())}
              </span>
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Support Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.channels.map((channel, index) => (
          <motion.div
            key={channel.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getRatingBgColor(channel.rating)}`}>
                      {channel.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{channel.name}</CardTitle>
                      <div className="flex items-center space-x-1 mt-1">
                        <Star className={`w-4 h-4 ${getRatingColor(channel.rating)}`} />
                        <span className={`text-sm font-medium ${getRatingColor(channel.rating)}`}>
                          {channel.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                  <SupportAvailabilityIndicator 
                    isAvailable={channel.isAvailable}
                    size="md"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {text.responseTime}
                  </span>
                  <span className="font-medium">{channel.responseTime}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{text.availability}</span>
                  <span className="font-medium">{channel.availability}</span>
                </div>
                <div className="pt-2">
                  <Badge 
                    variant={channel.isAvailable ? "default" : "secondary"}
                    className="w-full justify-center"
                  >
                    {channel.isAvailable ? text.status.available : text.status.unavailable}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Detailed Metrics */}
      {showDetailedMetrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>{text.satisfactionRate}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-green-600">
                    {metrics.satisfactionRate}%
                  </span>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <Progress value={metrics.satisfactionRate} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  Clients satisfaits de notre service
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>{text.resolutionRate}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-green-600">
                    {metrics.resolutionRate}%
                  </span>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <Progress value={metrics.resolutionRate} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  Problèmes résolus au premier contact
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}