'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatDistanceToNow } from 'date-fns';

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
import type { ParkingSpot } from '@/lib/types';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Car, Clock, Hash, Phone, Navigation, Wallet, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpotDetailsSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  spot: ParkingSpot | null;
  onOccupy: (licensePlate: string) => void;
  onDepart: () => void;
}

const occupySchema = z.object({
  licensePlate: z.string().min(3, { message: "License plate must be at least 3 characters." }).max(10),
});

export function SpotDetailsSheet({ isOpen, onOpenChange, spot, onOccupy, onDepart }: SpotDetailsSheetProps) {
  const form = useForm<z.infer<typeof occupySchema>>({
    resolver: zodResolver(occupySchema),
    defaultValues: {
      licensePlate: "",
    },
  });

  const handleSubmit = (values: z.infer<typeof occupySchema>) => {
    onOccupy(values.licensePlate);
    form.reset();
  };

  const handleConfirmArrival = () => {
    if (spot?.reservedBy?.carNumber) {
      onOccupy(spot.reservedBy.carNumber);
    }
  }

  const isAvailable = spot?.status === 'available';
  const isOccupied = spot?.status === 'in-use';
  const isReserved = spot?.status === 'booked';

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="glass-card border-l border-white/5 w-full sm:max-w-md p-0 overflow-hidden flex flex-col">
        {spot && (
          <>
            <SheetHeader className="relative h-40 bg-zinc-900 overflow-hidden text-left space-y-0">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-blue-500/20"></div>
              <div className="absolute top-8 left-8 space-y-2">
                <Badge variant="outline" className="bg-white/5 border-white/10 text-[10px] uppercase tracking-widest font-bold">Terminal ID: {spot.id}</Badge>
                <SheetTitle className="text-4xl font-headline font-bold text-white">Spot Management</SheetTitle>
                <SheetDescription className="sr-only">Manage parking spot {spot.id} details and occupancy.</SheetDescription>
              </div>
              <div className="absolute bottom-4 left-8 flex gap-2">
                <Badge className={cn(
                  "font-bold uppercase tracking-tighter",
                  isAvailable ? "bg-emerald-500/20 text-emerald-400 border-none" :
                    isOccupied ? "bg-blue-500/20 text-blue-400 border-none" :
                      "bg-amber-500/20 text-amber-400 border-none"
                )}>
                  {spot.status}
                </Badge>
                <Badge variant="outline" className="bg-white/5 border-white/10 font-medium">Type: {spot.type}</Badge>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-8 py-10 space-y-10">
              {isAvailable && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Navigation className="size-4 text-primary" />
                      Provision Spot
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      This unit is currently vacant and operational. Assign a vehicle ID to authorize local occupancy.
                    </p>
                  </div>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="licensePlate"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <Label htmlFor="licensePlate" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Vehicle Identity</Label>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  id="licensePlate"
                                  placeholder="ABC-1234"
                                  className="h-14 bg-white/5 border-white/10 rounded-xl font-mono text-lg focus:ring-primary/20 placeholder:opacity-30 pt-0"
                                  {...field}
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                  <Car className="size-5 text-muted-foreground" />
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs font-bold text-destructive" />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full h-14 rounded-xl font-bold dark:text-white shadow-xl shadow-primary/20">
                        Occupy Spot
                      </Button>
                    </form>
                  </Form>
                </div>
              )}

              {isReserved && spot.reservedBy && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-amber-400">
                      <ShieldAlert className="size-4" />
                      Booking Active
                    </h3>
                    <p className="text-sm text-muted-foreground">This unit is currently allocated for an advanced arrival.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                          <Car className="size-3" /> Vehicle
                        </div>
                        <Badge variant="outline" className="border-amber-500/30 text-amber-500 bg-amber-500/5">Reserved</Badge>
                      </div>
                      <p className="font-mono text-2xl font-bold tracking-tight">{spot.reservedBy.carNumber}</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                      <p className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                        <Phone className="size-3" /> Contact
                      </p>
                      <p className="text-lg font-bold">{spot.reservedBy.phoneNumber}</p>
                    </div>
                  </div>

                  <Button onClick={handleConfirmArrival} className="w-full h-14 rounded-xl bg-amber-500 hover:bg-amber-600 dark:text-black font-bold shadow-xl shadow-amber-500/20">
                    Confirm Arrival & Occupy
                  </Button>
                </div>
              )}

              {isOccupied && spot.occupiedBy && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-blue-400">
                      <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                      Unit In-Use
                    </h3>
                    <p className="text-sm text-muted-foreground">Real-time occupancy tracking enabled for this terminal.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                        <Hash className="size-3" /> License Plate
                      </div>
                      <p className="font-mono text-3xl font-bold tracking-tight text-blue-400">{spot.occupiedBy.licensePlate}</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                        <Clock className="size-3" /> Session Time
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold">
                          {formatDistanceToNow(new Date(spot.occupiedBy.startTime), { addSuffix: false })}
                        </p>
                        <Badge className="bg-blue-500/10 text-blue-400 border-none font-medium">Tracking Active</Badge>
                      </div>
                    </div>

                    {spot.occupiedBy.entryImage && (
                      <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                          <ShieldAlert className="size-3" /> Entry Capture
                        </div>
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/40">
                          <img
                            src={spot.occupiedBy.entryImage}
                            alt="Entry Camera Capture"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[9px] font-bold text-white border border-white/10">
                            LIVE LOG
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}
            </div>

            {isOccupied && (
              <div className="p-8 bg-zinc-950/50 border-t border-white/5 space-y-4">
                <div className="flex justify-between items-center text-sm mb-4">
                  <span className="text-muted-foreground font-medium">Estimated Billing</span>
                  <span className="font-headline font-bold text-lg text-primary">$12.50</span>
                </div>
                <Button onClick={onDepart} className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xl shadow-blue-600/20">
                  <Wallet className="mr-2 size-4" />
                  Finalize Session & Pay
                </Button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
