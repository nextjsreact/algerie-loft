"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, Clock, CheckCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type UtilityType = "eau" | "energie" | "telephone" | "internet" | "tv" | "gas";

interface BillAlert {
  loft_id: string;
  loft_name: string;
  utility_type: UtilityType;
  due_date: string;
  days_overdue?: number;
}

const utilityColors: Record<UtilityType, string> = {
  eau: "bg-blue-100 text-blue-800",
  energie: "bg-yellow-100 text-yellow-800",
  telephone: "bg-green-100 text-green-800",
  internet: "bg-purple-100 text-purple-800",
  tv: "bg-pink-100 text-pink-800",
  gas: "bg-orange-100 text-orange-800",
};

export function BillAlerts() {
  const [upcomingBills, setUpcomingBills] = useState<BillAlert[]>([]);
  const [overdueBills, setOverdueBills] = useState<BillAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations('bills');

  useEffect(() => {
    loadBillAlerts();
  }, []);

  const loadBillAlerts = async () => {
    try {
      setLoading(true);
      // Mock data for now
      const mockUpcoming: BillAlert[] = [
        {
          loft_id: "1",
          loft_name: "Loft Paradise",
          utility_type: "eau",
          due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const mockOverdue: BillAlert[] = [
        {
          loft_id: "2",
          loft_name: "Loft Central",
          utility_type: "energie",
          due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          days_overdue: 3,
        },
      ];

      setUpcomingBills(mockUpcoming);
      setOverdueBills(mockOverdue);
    } catch (error) {
      console.error("Error loading bill alerts:", error);
      toast.error(t('loadingError'));
    } finally {
      setLoading(false);
    }
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('dueToday');
    if (diffDays === 1) return t('dueTomorrow');
    if (diffDays > 1) return `${diffDays} ${t('days')}`;
    return `${Math.abs(diffDays)} ${t('daysOverdue')}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {overdueBills.length > 0 && (
          <div>
            <h3 className="font-medium text-red-600 mb-2">{t('overdueBillsTitle')}</h3>
            <div className="space-y-2">
              {overdueBills.map((bill, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="font-medium">{bill.loft_name}</p>
                      <Badge className={utilityColors[bill.utility_type]}>
                        {t(`utilities.${bill.utility_type}`)}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-red-600 font-medium">
                      {bill.days_overdue} {t('daysOverdue')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {upcomingBills.length > 0 && (
          <div>
            <h3 className="font-medium text-yellow-600 mb-2">{t('upcomingBillsTitle')}</h3>
            <div className="space-y-2">
              {upcomingBills.map((bill, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="font-medium">{bill.loft_name}</p>
                      <Badge className={utilityColors[bill.utility_type]}>
                        {t(`utilities.${bill.utility_type}`)}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-yellow-600 font-medium">
                      {formatDueDate(bill.due_date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {overdueBills.length === 0 && upcomingBills.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p>{t('noOverdueBillsMessage')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}