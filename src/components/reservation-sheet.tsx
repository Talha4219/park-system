'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar as CalendarIcon, Car, Phone, Clock, ShieldCheck, Info, Sparkles } from "lucide-react"
import { format } from "date-fns"
import { useEffect } from 'react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ParkingSpot, UserProfile } from '@/lib/types';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

interface ReservationSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  spot: ParkingSpot | null;
  onReserve: (details: { carNumber: string; phoneNumber: string; reservationTime?: Date }) => void;
  userProfile: UserProfile | null;
}

const advanceReservationSchema = z.object({
  carNumber: z.string().min(3, { message: "Car number must be at least 3 characters." }).max(10),
  phoneNumber: z.string().min(10, { message: "Please enter a valid phone number." }),
  reservationDate: z.date({
    required_error: "A date is required for advance booking.",
  }),
  reservationTime: z.string({ required_error: 'A time is required.' }),
});

const timeSlots = Array.from({ length: 24 * 2 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = (i % 2) * 30;
  const time = new Date(0, 0, 0, hour, minute);
  return format(time, 'HH:mm');
});

export function ReservationSheet({ isOpen, onOpenChange, spot, onReserve, userProfile }: ReservationSheetProps) {
  const advanceForm = useForm<z.infer<typeof advanceReservationSchema>>({
    resolver: zodResolver(advanceReservationSchema),
    defaultValues: {
      carNumber: "",
      phoneNumber: "",
      reservationDate: new Date(),
      reservationTime: "12:00"
    },
  });

  useEffect(() => {
    if (userProfile && isOpen) {
      advanceForm.setValue('carNumber', userProfile.carNumber);
    }
  }, [userProfile, isOpen, advanceForm]);

  const handleAdvanceSubmit = (values: z.infer<typeof advanceReservationSchema>) => {
    const [hours, minutes] = values.reservationTime.split(':').map(Number);
    const reservationDateTime = new Date(values.reservationDate);
    reservationDateTime.setHours(hours);
    reservationDateTime.setMinutes(minutes);

    onReserve({
      carNumber: values.carNumber,
      phoneNumber: values.phoneNumber,
      reservationTime: reservationDateTime,
    });
    advanceForm.reset();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      if (!open) {
        advanceForm.reset();
      }
      onOpenChange(open);
    }}>
      <SheetContent className="glass-card border-l border-white/5 w-full sm:max-w-[500px] p-0 overflow-hidden flex flex-col">
        {spot && (
          <>
            <SheetHeader className="relative h-48 bg-zinc-950 overflow-hidden text-left space-y-0">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-amber-500/20"></div>
              <div className="absolute top-10 left-10 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary animate-pulse" />
                  <Badge variant="outline" className="bg-white/5 border-white/10 text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Priority Booking</Badge>
                </div>
                <SheetTitle className="text-4xl font-headline font-bold text-white">Secure Zone {spot.id}</SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground font-medium uppercase tracking-widest leading-none">Global Reservation System</SheetDescription>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-10 py-12 space-y-10">
              <div className="space-y-2">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <ShieldCheck className="size-5 text-primary" />
                  Reservation Details
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Provide your vehicle identification and contact data to initialize the secure lock on this terminal.
                </p>
              </div>

              <Form {...advanceForm}>
                <form onSubmit={advanceForm.handleSubmit(handleAdvanceSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={advanceForm.control}
                      name="carNumber"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <Label htmlFor="advance-carNumber" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Vehicle ID</Label>
                          <FormControl>
                            <div className="relative">
                              <Input
                                id="advance-carNumber"
                                placeholder="ABC-123"
                                className="h-12 bg-white/5 border-white/10 rounded-xl font-mono focus:ring-primary/20"
                                {...field}
                              />
                              <Car className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground opacity-50" />
                            </div>
                          </FormControl>
                          <FormMessage className="text-[10px] font-bold" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={advanceForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <Label htmlFor="advance-phoneNumber" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Contact</Label>
                          <FormControl>
                            <div className="relative">
                              <Input
                                id="advance-phoneNumber"
                                type="tel"
                                placeholder="555-0123"
                                className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20"
                                {...field}
                              />
                              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground opacity-50" />
                            </div>
                          </FormControl>
                          <FormMessage className="text-[10px] font-bold" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={advanceForm.control}
                      name="reservationDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Allocation Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "h-12 bg-white/5 border-white/10 rounded-xl text-left font-normal hover:bg-white/10 transition-all",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Select Date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 glass-card border-white/10 shadow-2xl" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage className="text-[10px] font-bold" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={advanceForm.control}
                      name="reservationTime"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Arrival Window</Label>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20">
                                <SelectValue placeholder="Select Time" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="glass-card border-white/10">
                              {timeSlots.map(time => (
                                <SelectItem key={time} value={time} className="focus:bg-primary/20">
                                  <div className="flex items-center gap-2">
                                    <Clock className="size-3" />
                                    {time}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px] font-bold" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex gap-4">
                    <Info className="size-5 text-primary shrink-0" />
                    <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                      Unit {spot.id} will be locked and reserved for your arrival. An automatic $10 pre-authorization will be initiated.
                    </p>
                  </div>

                  <Button type="submit" className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 dark:text-black font-bold text-lg shadow-2xl shadow-primary/20 transition-all active:scale-95 mt-4">
                    Confirm Advance Booking
                  </Button>
                </form>
              </Form>
            </div>

            <SheetFooter className="p-8 bg-zinc-950/50 border-t border-white/5">
              <p className="text-[10px] text-muted-foreground text-center w-full uppercase tracking-widest font-bold opacity-50">
                End-to-End Encrypted Transaction
              </p>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
