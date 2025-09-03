"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, Clock, CheckCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { BillPaymentModal } from "@/components/modals/bill-payment-modal";

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

const getUtilityLabel = (utilityType: UtilityType) => {
  switch (utilityType) {
    case "eau":
      return "💧 Water";
    case "energie":
      return "⚡ Energy";
    case "telephone":
      return "📞 Phone";
    case "internet":
      return "🌐 Internet";
    case "tv":
      return "📺 TV";
    case "gas":
      return "🔥 Gas";
    default:
      return utilityType;
  }
};

const UTILITY_COLORS: Record<UtilityType, string> = {
  eau: "bg-blue-100 text-blue-800",
  energie: "bg-yellow-100 text-yellow-800",
  telephone: "bg-green-100 text-green-800",
  internet: "bg-purple-100 text-purple-800",
  tv: "bg-red-100 text-red-800",
  gas: "bg-orange-100 text-orange-800",
};

export function BillAlertsNew() {
  const [upcomingBills, setUpcomingBills] = useState<BillAlert[]>([]);
  const [overdueBills, setOverdueBills] = useState<BillAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<BillAlert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchBillAlerts();
  }, []);

  const fetchBillAlerts = async () => {
    try {
      setLoading(true);

      // Fetch all lofts with their billing information
      const { data: lofts, error } = await supabase
        .from('lofts')
        .select(`
          id,
          nom,
          frequence_paiement_eau,
          prochaine_echeance_eau,
          frequence_paiement_energie,
          prochaine_echeance_energie,
          frequence_paiement_telephone,
          prochaine_echeance_telephone,
          frequence_paiement_internet,
          prochaine_echeance_internet,
          frequence_paiement_tv,
          prochaine_echeance_tv,
          frequence_paiement_gas,
          prochaine_echeance_gas
        `);

      if (error) {
        console.error("Error fetching lofts:", error);
        toast.error("Failed to load bill alerts");
        return;
      }

      const today = new Date();
      const upcoming: BillAlert[] = [];
      const overdue: BillAlert[] = [];

      // Process each loft's billing data
      lofts?.forEach((loft) => {
        const utilities: UtilityType[] = ["eau", "energie", "telephone", "internet", "tv", "gas"];
        
        utilities.forEach((utility) => {
          const frequency = loft[`frequence_paiement_${utility}`];
          const dueDate = loft[`prochaine_echeance_${utility}`];
          
          if (dueDate && frequency) {
            const dueDateObj = new Date(dueDate);
            const timeDiff = dueDateObj.getTime() - today.getTime();
            const daysUntilDue = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            const billAlert: BillAlert = {
              loft_id: loft.id,
              loft_name: loft.nom,
              utility_type: utility,
              due_date: dueDate,
              frequency: frequency,
              days_until_due: daysUntilDue >= 0 ? daysUntilDue : undefined,
              days_overdue: daysUntilDue < 0 ? Math.abs(daysUntilDue) : undefined,
            };

            // Categorize bills
            if (daysUntilDue < 0) {
              overdue.push(billAlert);
            } else if (daysUntilDue <= 30) {
              upcoming.push(billAlert);
            }
          }
        });
      });

      // Sort by urgency
      upcoming.sort((a, b) => (a.days_until_due || 0) - (b.days_until_due || 0));
      overdue.sort((a, b) => (b.days_overdue || 0) - (a.days_overdue || 0));

      setUpcomingBills(upcoming);
      setOverdueBills(overdue);
    } catch (error) {
      console.error("Error fetching bill alerts:", error);
      toast.error("Failed to load bill alerts");
    } finally {
      setLoading(false);
    }
  };

  const markBillAsPaid = (bill: BillAlert) => {
    setSelectedBill(bill);
    setIsModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    fetchBillAlerts(); // Refresh the alerts after successful payment
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
    if (days === 0) return isOverdue ? "Due today" : "Due today";
    if (days === 1) {
      if (isOverdue) return "1 day overdue";
      return "Due tomorrow";
    }
    if (isOverdue) return `${days} days overdue`;
    return `${days} days`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Clock className="h-5 w-5" />
              Upcoming Bills
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <AlertTriangle className="h-5 w-5" />
              Overdue Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upcoming Bills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <Clock className="h-5 w-5" />
            Upcoming Bills ({upcomingBills.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingBills.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p>No upcoming bills in the next 30 days</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBills.map((bill, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getIcon(bill.days_until_due)}
                    <div>
                      <div className="font-medium">{bill.loft_name}</div>
                      <div className="text-sm text-gray-600">
                        {getUtilityLabel(bill.utility_type)} - Due:{" "}
                        {new Date(bill.due_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={getBadgeVariant(bill.days_until_due)}
                      className={UTILITY_COLORS[bill.utility_type]}
                    >
                      {getDaysText(bill.days_until_due || 0)}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markBillAsPaid(bill)}
                    >
                      Mark Paid
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overdue Bills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Overdue Bills ({overdueBills.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overdueBills.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p>No overdue bills - great job!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {overdueBills.map((bill, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg border-red-200 bg-red-50"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <div>
                      <div className="font-medium">{bill.loft_name}</div>
                      <div className="text-sm text-gray-600">
                        {getUtilityLabel(bill.utility_type)} - Due:{" "}
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
                      Mark Paid
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
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