'use client'

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Lock } from 'lucide-react';
import { format, addDays, eachDayOfInterval } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BlockDatesDialogProps {
  lofts: any[];
  onSuccess: () => void;
  rawAvailabilityData: any[];
}

export function BlockDatesDialog({ lofts, onSuccess, rawAvailabilityData }: BlockDatesDialogProps) {
  const t = useTranslations('availability');
  const [isOpen, setIsOpen] = useState(false);
  const [loftId, setLoftId] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: new Date(), to: addDays(new Date(), 7) });
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!loftId || !dateRange?.from || !dateRange?.to || !reason) {
        toast.error(t('fillAllFields'));
        return;
    }

    const datesToBlock = eachDayOfInterval({
      start: dateRange.from,
      end: dateRange.to,
    });

    const loftAvailability = rawAvailabilityData.filter(a => a.loft_id === loftId);

    const alreadyBookedDays = datesToBlock.filter(date => {
      const dayKey = format(date, 'yyyy-MM-dd');
      const availability = loftAvailability.find(a => a.date === dayKey);
      return availability && !availability.is_available;
    });

    if (alreadyBookedDays.length > 0) {
      toast.error(t('datesAlreadyBookedError'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/availability/block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loft_id: loftId,
          start_date: format(dateRange.from, 'yyyy-MM-dd'),
          end_date: format(dateRange.to, 'yyyy-MM-dd'),
          reason: reason,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message);
        setIsOpen(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
        toast.error(t('unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Lock className="mr-2 h-4 w-4" />
          {t('blockDates')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('blockDates')}</DialogTitle>
          <DialogDescription>{t('blockDatesDescription')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="loft" className="text-right">{t('loft')}</Label>
            <select
              id="loft"
              value={loftId}
              onChange={(e) => setLoftId(e.target.value)}
              className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">{t('selectLoft')}</option>
              {lofts.map((loft) => (
                <option key={loft.id} value={loft.id}>
                  {loft.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">{t('dateRange')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className="col-span-3 justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>{t('pickDate')}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reason" className="text-right">{t('reason')}</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="col-span-3"
              placeholder={t('maintenancePlaceholder')}
            />
          </div>
        </div>
        <DialogFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button asChild disabled={isLoading || !loftId || !dateRange?.from || !dateRange?.to || !reason}>
                <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                  {t('block')}
                </span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('confirmBlockTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('confirmBlockDescription')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? t('blocking') : t('confirm')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
