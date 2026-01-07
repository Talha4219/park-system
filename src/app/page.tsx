'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import useSWR from 'swr';
import type { ParkingSpot, ParkingZone, ParkingSpotType } from '@/lib/types';

import { ParkingMap } from '@/components/parking-map';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Accessibility, BatteryCharging, Car, LogIn, LogOut, ParkingSquare, ShieldCheck, Zap, Clock, MapPin } from 'lucide-react';
import { ReservationSheet } from '@/components/reservation-sheet';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/auth-context';
import { SpotDetailsSheet } from '@/components/spot-details-sheet';
import { AuthPromptSheet } from '@/components/auth-prompt-sheet';
import { cn } from '@/lib/utils';

const filterOptions: { id: ParkingSpotType; label: string, icon: React.ElementType }[] = [
  { id: 'regular', label: 'Regular', icon: Car },
  { id: 'accessible', label: 'Accessible', icon: Accessibility },
  { id: 'ev', label: 'EV Charging', icon: BatteryCharging },
];

function useRealtimeParkingData() {
  const { data: spots, error, mutate, isLoading } = useSWR<ParkingSpot[]>(
    '/api/parking-spots',
    async (url) => {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Failed to fetch parking spots');
      }
      return res.json();
    },
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
    }
  );

  const parkingZones = useMemo(() => {
    if (!spots) return [];
    const zones: { [key: string]: ParkingZone } = {};
    spots.forEach((spot) => {
      const zoneId = spot.id.split('-')[0];
      const zoneName = `Zone ${zoneId}`;
      if (!zones[zoneId]) {
        zones[zoneId] = { id: `zone-${zoneId.toLowerCase()}`, name: zoneName, spots: [] };
      }
      zones[zoneId].spots.push(spot);
    });
    return Object.values(zones);
  }, [spots]);

  return {
    parkingZones,
    loading: isLoading,
    refresh: mutate
  };
}

export default function Home() {
  const router = useRouter();
  const { parkingZones, loading, refresh } = useRealtimeParkingData();
  const [activeFilters, setActiveFilters] = useState<ParkingSpotType[]>(['regular', 'accessible', 'ev']);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [isDetailSheetOpen, setDetailSheetOpen] = useState(false);
  const { toast } = useToast();
  const { user, loading: authLoading, logout } = useAuth();
  const isLoggedIn = !!user;
  const userProfile = user;

  const handleFilterChange = (filter: ParkingSpotType) => {
    setActiveFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  const filteredZones = parkingZones.map(zone => ({
    ...zone,
    spots: zone.spots.filter(spot => activeFilters.includes(spot.type)),
  })).filter(zone => zone.spots.length > 0);

  const updateSpot = async (spotId: string, updates: Partial<ParkingSpot>) => {
    await fetch(`/api/parking-spots/${spotId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    await refresh();
  };

  const [isAuthPromptOpen, setAuthPromptOpen] = useState(false);

  const handleSpotClick = (spot: ParkingSpot) => {
    if (spot.status === 'available') {
      if (isLoggedIn) {
        setSelectedSpot(spot);
        setSheetOpen(true);
      } else {
        setAuthPromptOpen(true);
      }
    } else {
      setSelectedSpot(spot);
      setDetailSheetOpen(true);
    }
  };

  const handleReserveSpot = async (details: { carNumber: string; phoneNumber: string, reservationTime?: Date }) => {
    if (!selectedSpot || !user || authLoading) return;

    await updateSpot(selectedSpot.id, {
      status: 'booked',
      reservedBy: {
        userId: user.uid,
        carNumber: details.carNumber,
        phoneNumber: details.phoneNumber,
        reservedAt: new Date().toISOString(),
      }
    });

    setSheetOpen(false);

    toast({
      title: 'Advance Booking Successful!',
      description: `You have booked spot ${selectedSpot.id}.`,
      className: 'bg-emerald-500 text-white border-none shadow-lg shadow-emerald-500/20',
    });
  };

  const handleOccupySpot = async (licensePlate: string) => {
    if (!selectedSpot) return;
    await updateSpot(selectedSpot.id, {
      status: 'in-use',
      occupiedBy: {
        licensePlate,
        startTime: new Date().toISOString(),
      },
      reservedBy: undefined,
    });
    setDetailSheetOpen(false);
    toast({
      title: 'Spot Occupied',
      description: `Spot ${selectedSpot.id} is now in use by ${licensePlate}.`,
    });
  };

  const handleDepartSpot = async () => {
    if (!selectedSpot) return;
    await updateSpot(selectedSpot.id, {
      status: 'available',
      occupiedBy: undefined,
      reservedBy: undefined,
    });
    setDetailSheetOpen(false);
    toast({
      title: 'Spot Vacated',
      description: `Spot ${selectedSpot.id} is now available.`,
    });
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-50"></div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 group-hover:scale-110 transition-transform duration-300">
            <ParkingSquare className="size-6 text-primary" />
          </div>
          <span className="text-2xl font-headline font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">ParkSmart</span>
        </div>

        <div className="flex items-center gap-6">
          {isLoggedIn && userProfile ? (
            <div className="flex items-center gap-4">
              <Link href={userProfile.role === 'manager' ? '/dashboard' : '/user/dashboard'}>
                <Button variant="ghost" className="hidden md:flex hover:bg-white/5">
                  Dashboard
                </Button>
              </Link>
              <div className="h-8 w-px bg-white/10 hidden md:block"></div>
              <div className="flex items-center gap-3 bg-white/5 py-1.5 pl-1.5 pr-3 rounded-full border border-white/5">
                <Avatar className="h-8 w-8 border border-white/10">
                  <AvatarFallback className="bg-primary/20 text-primary">{userProfile.displayName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="text-left hidden lg:block mr-2">
                  <p className="font-bold text-[13px] leading-tight">{userProfile.displayName}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{userProfile.carNumber}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <Link href="/login">
              <Button className="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 px-8">
                <LogIn className="mr-2 h-4 w-4" />
                Get Started
              </Button>
            </Link>
          )}
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6 lg:px-12 max-w-[1400px] mx-auto space-y-20">

        {/* Hero Section */}
        <section className="relative rounded-[2.5rem] overflow-hidden border border-white/5 bg-zinc-900/50 backdrop-blur-sm p-12 lg:p-20 shadow-2xl">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 blur-[120px] -mr-40 -mt-40 rounded-full animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 blur-[100px] -ml-20 -mb-20 rounded-full animate-pulse delay-700"></div>

          <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                <span className="text-xs font-bold uppercase tracking-widest text-primary">Live Availability</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-headline font-bold leading-[1.1] tracking-tight">
                Parking <br />
                <span className="text-primary italic">Redefined.</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                Experience the next generation of parking management. Seamless, secure, and smart. Book your premium spot in seconds.
              </p>
              <div className="grid grid-cols-3 gap-6 pt-4">
                <div className="space-y-2">
                  <div className="p-2 w-fit rounded-lg bg-white/5 border border-white/10"><ShieldCheck className="size-5 text-emerald-400" /></div>
                  <p className="text-xs font-bold uppercase tracking-tighter text-muted-foreground whitespace-nowrap">Secure Access</p>
                </div>
                <div className="space-y-2">
                  <div className="p-2 w-fit rounded-lg bg-white/5 border border-white/10"><Zap className="size-5 text-amber-400" /></div>
                  <p className="text-xs font-bold uppercase tracking-tighter text-muted-foreground whitespace-nowrap">Instant Booking</p>
                </div>
                <div className="space-y-2">
                  <div className="p-2 w-fit rounded-lg bg-white/5 border border-white/10"><Clock className="size-5 text-blue-400" /></div>
                  <p className="text-xs font-bold uppercase tracking-tighter text-muted-foreground whitespace-nowrap">24/7 Monitoring</p>
                </div>
              </div>
            </div>

            <div className="hidden lg:block relative">
              <div className="aspect-[4/3] rounded-3xl bg-zinc-800/50 border border-white/10 premium-border p-8 backdrop-blur-3xl shadow-2xl shadow-black/50">
                <div className="h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Total Spots</p>
                      <p className="text-4xl font-headline font-bold">{parkingZones.reduce((acc, z) => acc + z.spots.length, 0)}</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <Car className="text-primary" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[65%]" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Facility currently at <span className="text-foreground font-bold">65% capacity</span></p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">In Use</p>
                      <p className="text-2xl font-headline font-bold text-blue-400">
                        {parkingZones.reduce((acc, z) => acc + z.spots.filter(s => s.status === 'in-use').length, 0)}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Available</p>
                      <p className="text-2xl font-headline font-bold text-emerald-400">
                        {parkingZones.reduce((acc, z) => acc + z.spots.filter(s => s.status === 'available').length, 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Map & Filters Section */}
        <section className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-headline font-bold">Live Floor Plan</h2>
              <p className="text-muted-foreground flex items-center gap-2">
                <MapPin className="size-4" />
                Select a zone and click on available spots to book.
              </p>
            </div>

            <div className="p-2 rounded-2xl bg-zinc-900/50 border border-white/10 flex flex-wrap items-center gap-2 backdrop-blur-sm">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-4">Filter:</span>
              {filterOptions.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleFilterChange(id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 border",
                    activeFilters.includes(id)
                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105"
                      : "bg-white/5 text-muted-foreground border-white/5 hover:bg-white/10"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            {loading && (
              <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-3xl">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  <p className="text-sm font-bold uppercase tracking-widest text-primary animate-pulse">Syncing Map...</p>
                </div>
              </div>
            )}
            <div className="glass-card rounded-[2.5rem] p-8 lg:p-12 premium-border">
              <ParkingMap zones={filteredZones} onSpotClick={handleSpotClick} />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-12 px-6 bg-zinc-950/50">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-muted-foreground text-sm">
          <div className="flex items-center gap-2">
            <ParkingSquare className="size-5 text-primary" />
            <span className="font-headline font-bold text-foreground">ParkSmart</span>
          </div>
          <p>© 2026 ParkSmart Premium Systems. All rights reserved.</p>
          <div className="flex gap-8 font-medium">
            <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Support</a>
          </div>
        </div>
      </footer>

      {/* Overlays */}
      <ReservationSheet
        isOpen={isSheetOpen}
        onOpenChange={setSheetOpen}
        spot={selectedSpot}
        onReserve={handleReserveSpot}
        userProfile={userProfile}
      />

      <SpotDetailsSheet
        isOpen={isDetailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        spot={selectedSpot}
        onOccupy={handleOccupySpot}
        onDepart={handleDepartSpot}
      />

      <AuthPromptSheet
        open={isAuthPromptOpen}
        onOpenChange={setAuthPromptOpen}
      />
    </div>
  );
}
