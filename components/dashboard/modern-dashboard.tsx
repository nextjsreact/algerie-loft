"use client";

import { useEffect, useState } from "react";
import { Currency } from "../../types/currency";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Users, 
  Building2, 
  DollarSign,
  Zap,
  Droplets,
  Phone,
  Wifi,
  Flame,
  Tv,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  ClipboardList,
  RefreshCw,
  BarChart3
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { BillPaymentModal } from "@/components/modals/bill-payment-modal";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { fr, ar, enUS } from "date-fns/locale";
import { useTranslations, useLocale } from "next-intl";
import { formatCurrencyAuto } from "@/utils/currency-formatter";

type UtilityType = "eau" | "energie" | "telephone" | "internet" | "tv" | "gas";

interface BillAlert {
  loft_id: string;
  loft_name: string;
  utility_type: UtilityType;
  due_date: string;
  frequency: string;
  days_until_due?: number;
  days_overdue?: number;
}

interface DashboardStats {
  totalLofts: number;
  occupiedLofts: number;
  monthlyRevenue: number;
  activeTasks: number;
  totalTeams: number;
  upcomingBills: number;
  overdueBills: number;
  dueToday: number;
  totalLoftsWithBills: number;
}

interface BillMonitoringStats {
  upcomingBills: number;
  overdueBills: number;
  dueToday: number;
  totalLoftsWithBills: number;
}

interface MonthlyRevenueData {
  month: string;
  revenue: number;
  expenses: number;
}

interface RecentTask {
  id: string;
  title: string;
  status: string;
  due_date?: string;
  assigned_user?: { full_name: string } | null;
  loft?: { name: string } | null;
}

const UTILITY_CONFIG = {
  eau: { 
    icon: <Droplets className="h-4 w-4" />, 
    color: "bg-blue-500",
    lightColor: "bg-blue-50 text-blue-700 border-blue-200"
  },
  energie: { 
    icon: <Zap className="h-4 w-4" />, 
    color: "bg-yellow-500",
    lightColor: "bg-yellow-50 text-yellow-700 border-yellow-200"
  },
  telephone: { 
    icon: <Phone className="h-4 w-4" />, 
    color: "bg-green-500",
    lightColor: "bg-green-50 text-green-700 border-green-200"
  },
  internet: { 
    icon: <Wifi className="h-4 w-4" />, 
    color: "bg-purple-500",
    lightColor: "bg-purple-50 text-purple-700 border-purple-200"
  },
  tv: { 
    icon: <Tv className="h-4 w-4" />, 
    color: "bg-red-500",
    lightColor: "bg-red-50 text-red-700 border-red-200"
  },
  gas: { 
    icon: <Flame className="h-4 w-4" />, 
    color: "bg-orange-500",
    lightColor: "bg-orange-50 text-orange-700 border-orange-200"
  }
};

export function ModernDashboard() {
  // Multiple translation hooks for different namespaces
  const t = useTranslations('dashboard');
  const tTasks = useTranslations('tasks');
  const tBills = useTranslations('bills');
  const locale = useLocale();

  // Helper function to get date-fns locale
  const getDateFnsLocale = () => {
    switch (locale) {
      case 'ar': return ar;
      case 'fr': return fr;
      case 'en': return enUS;
      default: return fr;
    }
  };

  // Helper function to get browser locale
  const getBrowserLocale = () => {
    switch (locale) {
      case 'ar': return 'ar-DZ';
      case 'fr': return 'fr-FR';
      case 'en': return 'en-US';
      default: return 'fr-FR';
    }
  };
  
  const [upcomingBills, setUpcomingBills] = useState<BillAlert[]>([]);
  const [overdueBills, setOverdueBills] = useState<BillAlert[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalLofts: 0,
    occupiedLofts: 0,
    monthlyRevenue: 0,
    activeTasks: 0,
    totalTeams: 0,
    upcomingBills: 0,
    overdueBills: 0,
    dueToday: 0,
    totalLoftsWithBills: 0
  });
  const [billMonitoringStats, setBillMonitoringStats] = useState<BillMonitoringStats>({
    upcomingBills: 0,
    overdueBills: 0,
    dueToday: 0,
    totalLoftsWithBills: 0
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenueData[]>([]);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedBill, setSelectedBill] = useState<BillAlert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultCurrencySymbol, setDefaultCurrencySymbol] = useState<string>('$'); // New state for currency symbol
  const supabase = createClient();

  // Currency formatting function (uses global utility)
  const formatCurrency = (amount: number) => {
    return formatCurrencyAuto(amount, 'DZD', window.location.pathname)
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch bills data
      const [upcomingRes, overdueRes] = await Promise.all([
        supabase.rpc("get_upcoming_bills", { days_ahead: 30 }),
        supabase.rpc("get_overdue_bills")
      ]);

      if (!upcomingRes.error) setUpcomingBills(upcomingRes.data || []);
      if (!overdueRes.error) setOverdueBills(overdueRes.data || []);

      // Fetch default currency symbol
      const { data: defaultCurrencyData, error: currencyError } = await supabase
        .from('currencies')
        .select('symbol')
        .eq('is_default', true)
        .single();

      if (!currencyError && defaultCurrencyData) {
        setDefaultCurrencySymbol(defaultCurrencyData.symbol);
      } else {
        console.error('Error fetching default currency:', currencyError);
        // Fallback to '$' if fetching fails
        setDefaultCurrencySymbol('$');
      }

      // Fetch bill monitoring stats (only if user is authenticated)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const billStatsResponse = await fetch('/api/bill-monitoring/stats');
          if (billStatsResponse.ok) {
            const billStatsResult = await billStatsResponse.json();
            if (billStatsResult.success) {
              setBillMonitoringStats(billStatsResult.data);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching bill monitoring stats:', error);
      }

      // Mock data for demo (replace with real API calls)
      setStats({
        totalLofts: 31,
        occupiedLofts: 28,
        monthlyRevenue: 45000,
        activeTasks: 12,
        totalTeams: 3,
        upcomingBills: upcomingRes.data?.length || 0,
        overdueBills: overdueRes.data?.length || 0,
        dueToday: 0,
        totalLoftsWithBills: 3
      });

      // Mock monthly revenue data
      setMonthlyRevenue([
        { month: "Jan", revenue: 42000, expenses: 28000 },
        { month: "Feb", revenue: 38000, expenses: 25000 },
        { month: "Mar", revenue: 45000, expenses: 30000 },
        { month: "Apr", revenue: 48000, expenses: 32000 },
        { month: "May", revenue: 52000, expenses: 35000 },
        { month: "Jun", revenue: 45000, expenses: 29000 }
      ]);

      // Mock recent tasks
      setRecentTasks([
        {
          id: "1",
          title: "Plumbing repair",
          status: "in_progress",
          due_date: "2024-08-20",
          assigned_user: { full_name: "Ahmed Benali" },
          loft: { name: "Loft Artistique Hydra" }
        },
        {
          id: "2", 
          title: "Monthly cleaning",
          status: "todo",
          due_date: "2024-08-22",
          assigned_user: { full_name: "Fatima Zohra" },
          loft: { name: "Loft Moderne Centre-Ville" }
        },
        {
          id: "3",
          title: "Electrical inspection",
          status: "completed",
          due_date: "2024-08-15",
          assigned_user: { full_name: "Karim Messaoud" },
          loft: { name: "Loft Industriel Kouba" }
        }
      ]);

      setLastUpdated(new Date());

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const markBillAsPaid = (bill: BillAlert) => {
    setSelectedBill(bill);
    setIsModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    fetchDashboardData();
  };

  const getDaysText = (days: number, isOverdue: boolean = false) => {
    if (days === 0) return t("today");
    if (days === 1) return isOverdue ? t("dayOverdue") : t("tomorrow");
    return isOverdue ? t("daysOverdue", { count: days }) : `${days} ${t("days")}`;
  };

  const getUtilityLabel = (utilityType: UtilityType) => {
    const fallbacks = {
      eau: "💧 Water",
      energie: "⚡ Energy",
      telephone: "📞 Phone",
      internet: "🌐 Internet",
      tv: "📺 TV",
      gas: "🔥 Gas"
    };
    
    try {
      const translation = tBills(`utilities.${utilityType}`);
      if (translation && translation !== `utilities.${utilityType}`) {
        // Add emoji prefix based on type
        const emoji = utilityType === 'eau' ? '💧 ' : 
                     utilityType === 'energie' ? '⚡ ' :
                     utilityType === 'telephone' ? '📞 ' :
                     utilityType === 'internet' ? '🌐 ' :
                     utilityType === 'tv' ? '📺 ' :
                     utilityType === 'gas' ? '🔥 ' : '';
        return emoji + translation;
      }
    } catch (e) {
      // Fallback to English
      console.warn(`Translation missing for bills.utilities.${utilityType}`);
    }
    
    return fallbacks[utilityType] || utilityType;
  };

  const getUrgencyColor = (days: number, isOverdue: boolean = false) => {
    if (isOverdue) return "border-l-red-500 bg-red-50";
    if (days === 0) return "border-l-red-500 bg-red-50";
    if (days <= 3) return "border-l-orange-500 bg-orange-50";
    if (days <= 7) return "border-l-yellow-500 bg-yellow-50";
    return "border-l-blue-500 bg-blue-50";
  };

  const getStatusColor = (count: number, type: 'overdue' | 'due_today' | 'upcoming') => {
    if (count === 0) return 'text-green-600';
    
    switch (type) {
      case 'overdue':
        return 'text-red-600';
      case 'due_today':
        return 'text-orange-600';
      case 'upcoming':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (count: number, type: 'overdue' | 'due_today' | 'upcoming') => {
    if (count === 0) return <CheckCircle className="h-4 w-4 text-green-500" />;
    
    switch (type) {
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'due_today':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'upcoming':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {t("title")}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">{t("totalLofts")}</p>
                <p className="text-3xl font-bold">{stats.totalLofts}</p>
                <p className="text-blue-100 text-xs mt-1">
                  {stats.occupiedLofts} {t("occupiedLofts")}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">{t("monthlyRevenue")}</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.monthlyRevenue)}</p>
                <div className="flex items-center text-green-100 text-xs mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +12% {t("thisMonth")}
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">{t("activeTasks")}</p>
                <p className="text-3xl font-bold">{stats.activeTasks}</p>
                <p className="text-purple-100 text-xs mt-1">
                  8 {t("inProgress")}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">{t("bills.title")}</p>
                <p className="text-3xl font-bold">{stats.upcomingBills + stats.overdueBills}</p>
                <p className="text-orange-100 text-xs mt-1">
                  {stats.overdueBills} {t("overdue")}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bill Monitoring Stats */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-50 to-blue-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <TrendingUp className="h-6 w-6 text-indigo-600" />
            {t("billMonitoring")}
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                {t("updated")} {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchDashboardData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Overdue Bills */}
            <div className="flex items-center justify-between p-4 border rounded-xl bg-red-50 border-red-200 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium">{t("overdue")}</p>
                  <p className="text-xs text-gray-600">{t("billsPastDue")}</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {billMonitoringStats.overdueBills}
              </div>
            </div>

            {/* Due Today */}
            <div className="flex items-center justify-between p-4 border rounded-xl bg-orange-50 border-orange-200 shadow-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">{t("dueToday")}</p>
                  <p className="text-xs text-gray-600">{t("billsDueNow")}</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {billMonitoringStats.dueToday}
              </div>
            </div>

            {/* Upcoming Bills */}
            <div className="flex items-center justify-between p-4 border rounded-xl bg-blue-50 border-blue-200 shadow-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">{t("upcoming")}</p>
                  <p className="text-xs text-gray-600">{t("next30Days")}</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {billMonitoringStats.upcomingBills}
              </div>
            </div>

            {/* Active Lofts */}
            <div className="flex items-center justify-between p-4 border rounded-xl bg-green-50 border-green-200 shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">{t("active")}</p>
                  <p className="text-xs text-gray-600">{t("loftsWithBills")}</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {billMonitoringStats.totalLoftsWithBills}
              </div>
            </div>
          </div>

          {/* Status Summary */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t("systemStatus")}</span>
              <div className="flex items-center gap-2">
                {billMonitoringStats.overdueBills === 0 && billMonitoringStats.dueToday === 0 ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    {t("allBillsCurrent")}
                  </Badge>
                ) : billMonitoringStats.overdueBills > 0 ? (
                  <Badge variant="destructive">
                    {t("actionRequired")}
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    {t("attentionNeeded")}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
 
     {/* Bills Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Overdue Bills */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6" />
                  {t("overdueBillsTitle")}
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  {overdueBills.length} {t("billsNeedAttention")}
                </p>
              </div>
              <Badge variant="destructive" className="text-lg px-3 py-1">
                {overdueBills.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {overdueBills.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                <p className="text-lg font-medium text-green-600">{t("excellent")}</p>
                <p className="text-muted-foreground">{t("noOverdueBills")}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {overdueBills.map((bill, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border-l-4 ${getUrgencyColor(bill.days_overdue || 0, true)} transition-all hover:shadow-md`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${UTILITY_CONFIG[bill.utility_type].lightColor}`}>
                          {UTILITY_CONFIG[bill.utility_type].icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{bill.loft_name}</h4>
                          <p className="text-sm text-gray-600">
                            {getUtilityLabel(bill.utility_type)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {t("bills.due")}: {new Date(bill.due_date).toLocaleDateString(getBrowserLocale())}
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <Badge variant="destructive" className="text-xs">
                          {getDaysText(bill.days_overdue || 0, true)}
                        </Badge>
                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                          onClick={() => markBillAsPaid(bill)}
                        >
                          {t("pay")}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Bills */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-blue-600 flex items-center gap-2">
                  <Clock className="h-6 w-6" />
                  {t("upcomingBillsTitle")}
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  {t("nextDueDates")}
                </p>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {upcomingBills.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingBills.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 mx-auto text-blue-500 mb-4" />
                <p className="text-lg font-medium text-blue-600">{t("noUpcomingBills")}</p>
                <p className="text-muted-foreground">{t("upToDate")}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {upcomingBills.slice(0, 8).map((bill, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border-l-4 ${getUrgencyColor(bill.days_until_due || 0)} transition-all hover:shadow-md`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${UTILITY_CONFIG[bill.utility_type].lightColor}`}>
                          {UTILITY_CONFIG[bill.utility_type].icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{bill.loft_name}</h4>
                          <p className="text-sm text-gray-600">
                            {getUtilityLabel(bill.utility_type)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {t("bills.due")}: {new Date(bill.due_date).toLocaleDateString(getBrowserLocale())}
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <Badge 
                          variant={bill.days_until_due! <= 3 ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {getDaysText(bill.days_until_due || 0)}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full hover:bg-blue-50"
                          onClick={() => markBillAsPaid(bill)}
                        >
                          {t("pay")}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart and Recent Tasks */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="lg:col-span-4 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              {t("revenueVsExpenses")}
            </CardTitle>
            <CardDescription>{t("monthlyFinancialOverview")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer 
              config={{
                revenue: {
                  label: "Revenus",
                  color: "hsl(var(--chart-1))",
                },
                expenses: {
                  label: "Dépenses", 
                  color: "hsl(var(--chart-2))",
                },
              }} 
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenue}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card className="lg:col-span-3 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <ClipboardList className="h-6 w-6 text-purple-600" />
              {t("recentTasks")}
            </CardTitle>
            <CardDescription>{t("latestTaskUpdates")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-r from-gray-50 to-blue-50 hover:shadow-md transition-all">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{task.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {task.loft?.name} • {task.assigned_user?.full_name}
                    </p>
                    {task.due_date && (
                      <p className="text-xs text-muted-foreground">
                        {t("due")}: {format(new Date(task.due_date), "d MMM yyyy", { locale: getDateFnsLocale() })}
                      </p>
                    )}
                  </div>
                  <Badge 
                    className={
                      task.status === 'completed' 
                        ? "bg-green-100 text-green-800 border-green-200" 
                        : task.status === 'in_progress'
                        ? "bg-blue-100 text-blue-800 border-blue-200"
                        : "bg-gray-100 text-gray-800 border-gray-200"
                    }
                  >
                    {task.status === 'todo' ? t("tasks.status.todo") : 
                     task.status === 'in_progress' ? t("tasks.status.inProgress") : 
                     task.status === 'completed' ? t("tasks.status.completed") : task.status}
                  </Badge>
                </div>
              ))}
              {recentTasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>{t("noRecentTasks")}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-xl font-bold">{t("quickActions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-20 flex-col gap-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
              <Building2 className="h-6 w-6" />
              <span className="text-sm">{t("lofts.addLoft")}</span>
            </Button>
            <Button className="h-20 flex-col gap-2 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
              <Users className="h-6 w-6" />
              <span className="text-sm">{tTasks("addTask")}</span>
            </Button>
            <Button className="h-20 flex-col gap-2 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
              <DollarSign className="h-6 w-6" />
              <span className="text-sm">{t("addTransaction")}</span>
            </Button>
            <Button className="h-20 flex-col gap-2 bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">{t("viewReports")}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {selectedBill && (
        <BillPaymentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          loftId={selectedBill.loft_id}
          loftName={selectedBill.loft_name}
          utilityType={selectedBill.utility_type}
          dueDate={selectedBill.due_date}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}