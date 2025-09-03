"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, Clock, CheckCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { BillPaymentModal } from "@/components/modals/bill-payment-modal";
import { useTranslation } from "@/lib/i18n/context";

interface BillAlert {
  loft_id: string;
  loft_name: string;
  owner_id: string;
  utility_type: string;
  due_date: string;
  frequency: string;
  days_until_due?: number;
  days_overdue?: number;
}

const getUtilityLabel = (utilityType: string, t: any) => {
  switch (utilityType) {
    case "eau":
      return t("utilities.eau");
    case "energie":
      return t("utilities.energie");
    case "telephone":
      return t("utilities.telephone");
    case "internet":
      return t("utilities.internet");
    default:
      return utilityType;
  }
};

const UTILITY_COLORS = {
  eau: "bg-blue-100 text-blue-800",
  energie: "bg-yellow-100 text-yellow-800",
  telephone: "bg-green-100 text-green-800",
  internet: "bg-purple-100 text-purple-800",
};

// Traductions intégrées par langue
const TRANSLATIONS = {
  ar: {
    title: "تنبيهات الفواتير",
    overdue: "متأخرة",
    upcoming: "القادمة",
    markPaid: "تسجيل كمدفوعة",
    due: "مستحق",
    today: "اليوم",
    tomorrow: "غداً",
    days: "أيام",
    dayOverdue: "يوم واحد متأخر",
    daysOverdue: "أيام متأخرة",
    noAlerts: "لا توجد تنبيهات فواتير عاجلة"
  },
  fr: {
    title: "Alertes Factures",
    overdue: "En Retard",
    upcoming: "À Venir",
    markPaid: "Marquer payée",
    due: "Échéance",
    today: "Aujourd'hui",
    tomorrow: "Demain",
    days: "jours",
    dayOverdue: "1 jour de retard",
    daysOverdue: "jours de retard",
    noAlerts: "Aucune alerte de facture urgente"
  },
  en: {
    title: "Bill Alerts",
    overdue: "Overdue",
    upcoming: "Upcoming",
    markPaid: "Mark Paid",
    due: "Due",
    today: "Today",
    tomorrow: "Tomorrow",
    days: "days",
    dayOverdue: "1 day overdue",
    daysOverdue: "days overdue",
    noAlerts: "No urgent bill alerts"
  }
};

export function BillAlerts() {
  const t = useTranslations('dashboard')
  const [upcomingBills, setUpcomingBills] = useState<BillAlert[]>([]);
  const [overdueBills, setOverdueBills] = useState<BillAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<BillAlert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const supabase = createClient();

  // Détection automatique de la langue
  const currentLang = i18n?.language || 'ar';
  const lang = currentLang.startsWith('ar') ? 'ar' : currentLang.startsWith('fr') ? 'fr' : 'en';
  const tr = TRANSLATIONS[lang as keyof typeof TRANSLATIONS];

  useEffect(() => {
    fetchBillAlerts();
  }, []);

  const fetchBillAlerts = async () => {
    try {
      setLoading(true);

      // Fetch upcoming bills (next 30 days) using RPC
      const { data: upcoming, error: upcomingError } = await supabase.rpc(
        "get_upcoming_bills",
        { days_ahead: 30 }
      );

      if (upcomingError) {
        console.error("Error fetching upcoming bills:", upcomingError);
      } else {
        setUpcomingBills(upcoming || []);
      }

      // Fetch overdue bills using RPC
      const { data: overdue, error: overdueError } = await supabase.rpc(
        "get_overdue_bills"
      );

      if (overdueError) {
        console.error("Error fetching overdue bills:", overdueError);
      } else {
        setOverdueBills(overdue || []);
      }
    } catch (error) {
      console.error("Error fetching bill alerts:", error);
      toast.error("خطأ في تحميل التنبيهات");
    } finally {
      setLoading(false);
    }
  };

  const markBillAsPaid = (bill: BillAlert) => {
    setSelectedBill(bill);
    setIsModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    fetchBillAlerts();
  };

  const getBadgeVariant = (daysUntilDue?: number, daysOverdue?: number) => {
    if (daysOverdue && daysOverdue > 0) return "destructive";
    if (daysUntilDue !== undefined) {
      if (daysUntilDue === 0) return "destructive";
      if (daysUntilDue <= 3) return "secondary";
      return "default";
    }
    return "default";
  };

  const getIcon = (daysUntilDue?: number, daysOverdue?: number) => {
    if (daysOverdue && daysOverdue > 0)
      return <AlertTriangle className="h-4 w-4" />;
    if (daysUntilDue !== undefined) {
      if (daysUntilDue === 0) return <AlertTriangle className="h-4 w-4" />;
      if (daysUntilDue <= 3) return <Clock className="h-4 w-4" />;
      return <Calendar className="h-4 w-4" />;
    }
    return <Calendar className="h-4 w-4" />;
  };

  const getDaysText = (days: number, isOverdue: boolean = false) => {
    if (days === 0) return tr.today;
    if (days === 1) {
      if (isOverdue) return tr.dayOverdue;
      return tr.tomorrow;
    }
    if (isOverdue) return `${days} ${tr.daysOverdue}`;
    return `${days} ${tr.days}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {tr.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {tr.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Overdue Bills */}
          {overdueBills.length > 0 && (
            <div>
              <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {tr.overdue} ({overdueBills.length})
              </h4>
              <div className="space-y-2">
                {overdueBills.map((bill, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-red-200 rounded bg-red-50">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <div>
                        <div className="font-medium">{bill.loft_name}</div>
                        <div className="text-sm text-gray-600">
                          {getUtilityLabel(bill.utility_type, t)} - {tr.due}:{" "}
                          {new Date(bill.due_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">
                        {getDaysText(bill.days_overdue || 0, true)}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markBillAsPaid(bill)}
                      >
                        {tr.markPaid}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Bills */}
          {upcomingBills.length > 0 && (
            <div>
              <h4 className="font-medium text-orange-600 mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {tr.upcoming} ({upcomingBills.length})
              </h4>
              <div className="space-y-2">
                {upcomingBills.map((bill, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      {getIcon(bill.days_until_due)}
                      <div>
                        <div className="font-medium">{bill.loft_name}</div>
                        <div className="text-sm text-gray-600">
                          {getUtilityLabel(bill.utility_type, t)} - {tr.due}:{" "}
                          {new Date(bill.due_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={getBadgeVariant(bill.days_until_due)}
                        className={
                          UTILITY_COLORS[
                            bill.utility_type as keyof typeof UTILITY_COLORS
                          ]
                        }
                      >
                        {getDaysText(bill.days_until_due || 0)}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markBillAsPaid(bill)}
                      >
                        {tr.markPaid}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No alerts */}
          {upcomingBills.length === 0 && overdueBills.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p>{tr.noAlerts}</p>
            </div>
          )}
        </div>

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
      </CardContent>
    </Card>
  );
}