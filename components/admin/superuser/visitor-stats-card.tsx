"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Eye, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface VisitorStats {
  total_visitors: number;
  today_visitors: number;
  unique_today: number;
  total_page_views: number;
  today_page_views: number;
  avg_session_duration: number;
}

export function VisitorStatsCard() {
  const t = useTranslations('superuser.dashboard');
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisitorStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchVisitorStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchVisitorStats = async () => {
    try {
      const response = await fetch('/api/superuser/visitor-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching visitor stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Visitors */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {t('visitorStats.totalVisitors')}
          </CardTitle>
          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {stats.total_visitors.toLocaleString()}
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            {t('visitorStats.allTime')}
          </p>
        </CardContent>
      </Card>

      {/* Today's Visitors */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">
            {t('visitorStats.todayVisitors')}
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {stats.today_visitors.toLocaleString()}
          </div>
          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
            {t('visitorStats.newToday')}: {stats.unique_today.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Total Page Views */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">
            {t('visitorStats.totalPageViews')}
          </CardTitle>
          <Eye className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {stats.total_page_views.toLocaleString()}
          </div>
          <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
            {t('visitorStats.todayViews')}: {stats.today_page_views.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Average Session Duration */}
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">
            {t('visitorStats.avgDuration')}
          </CardTitle>
          <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {formatDuration(stats.avg_session_duration)}
          </div>
          <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
            {t('visitorStats.perSession')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
