'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import useSWR from 'swr';
import type { ParkingSpot, ParkingZone, ParkingSpotType } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

import { ParkingMap } from '@/components/parking-map';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SpotDetailsSheet } from '@/components/spot-details-sheet';
import { PaymentReceiptDialog } from '@/components/payment-receipt-dialog';
import { useToast } from '@/hooks/use-toast';
import { Accessibility, BatteryCharging, Car, PlusCircle, Trash2, XCircle, BarChart3, Settings, Database, Activity, Map as MapIcon, ShieldAlert, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { AddSpotDialog } from '@/components/add-spot-dialog';
import { BulkAddSpotsDialog } from '@/components/bulk-add-spots-dialog';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const filterOptions: { id: ParkingSpotType; label: string, icon: React.ElementType }[] = [
  { id: 'regular', label: 'Regular', icon: Car },
  { id: 'accessible', label: 'Accessible', icon: Accessibility },
  { id: 'ev', label: 'EV Charging', icon: BatteryCharging },
];

function useRealtimeParkingData() {
  const { data: spots, error, mutate } = useSWR<ParkingSpot[]>(
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
      revalidateOnReconnect: true,
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
    spots: spots || [],
    loading: !error && !spots,
    refresh: mutate,
  };
}

export default function DashboardPage() {
  const { parkingZones, spots, loading, refresh } = useRealtimeParkingData();
  const [activeFilters, setActiveFilters] = useState<ParkingSpotType[]>(['regular', 'accessible', 'ev']);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [isReceiptOpen, setReceiptOpen] = useState(false);
  const [departureData, setDepartureData] = useState<{ durationString: string, totalCost: number } | null>(null);
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const { toast } = useToast();
  const { user: userProfile } = useAuth();

  const stats = useMemo(() => {
    if (!spots.length) return null;
    return {
      total: spots.length,
      available: spots.filter(s => s.status === 'available').length,
      inUse: spots.filter(s => s.status === 'in-use').length,
      booked: spots.filter(s => s.status === 'booked').length,
      unavailable: spots.filter(s => s.status === 'unavailable').length,
    };
  }, [spots]);

  const seedDatabase = async () => {
    try {
      const res = await fetch('/api/parking-spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to seed database.');
      }

      await refresh();
      toast({ title: "Database Seeded!", description: "Initial parking spots created." });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error seeding database',
        description: error instanceof Error ? error.message : 'Unable to seed database.',
      });
    }
  };

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


  const removeSpot = async (spotId: string) => {
    try {
      const res = await fetch(`/api/parking-spots/${spotId}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error(`Could not remove spot ${spotId}.`);
      }
      await refresh();
      toast({
        variant: 'destructive',
        title: 'Spot Removed',
        description: `Spot ${spotId} has been removed.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error removing spot',
        description: error instanceof Error ? error.message : `Could not remove spot ${spotId}.`,
      });
    }
  };

  const handleSpotClick = (spot: ParkingSpot) => {
    if (isRemoveMode) return;
    if (spot.status === 'in-use' || spot.status === 'available' || spot.status === 'booked') {
      setSelectedSpot(spot);
      setSheetOpen(true);
    } else {
      toast({
        variant: 'destructive',
        title: 'Spot Unavailable',
        description: `This spot is currently restricted.`,
      });
    }
  };

  const handleOccupySpot = async (licensePlate: string) => {
    if (!selectedSpot) return;
    try {
      const startTime = new Date().toISOString();
      await updateSpot(selectedSpot.id, {
        status: 'in-use',
        occupiedBy: {
          licensePlate: licensePlate.toUpperCase().trim(),
          startTime: startTime,
        },
        reservedBy: undefined,
      });

      setSheetOpen(false);
      toast({
        title: 'Spot Occupied',
        description: `Spot ${selectedSpot.id} is now in use by ${licensePlate}.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    }
  };

  const handleDepart = async () => {
    if (!selectedSpot || !selectedSpot.occupiedBy) return;

    const startTime = new Date(selectedSpot.occupiedBy.startTime);
    const endTime = new Date();
    const durationInHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const HOURLY_RATE = 5;
    const totalCost = durationInHours * HOURLY_RATE;
    const durationString = formatDistanceToNow(startTime, { addSuffix: false });

    setDepartureData({
      durationString: durationString,
      totalCost: totalCost
    });
    setReceiptOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedSpot) return;
    const departingPlate = selectedSpot.occupiedBy?.licensePlate;

    await updateSpot(selectedSpot.id, {
      status: 'available',
      occupiedBy: undefined,
      reservedBy: undefined,
    });

    setReceiptOpen(false);
    setSheetOpen(false);
    setDepartureData(null);
    toast({
      title: 'Payment Successful',
      description: `Gate opening for ${departingPlate}.`,
      className: 'bg-emerald-500 text-white border-none shadow-lg shadow-emerald-500/20',
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">

      {/* Header Container */}
      <div className="bg-zinc-900/50 border-b border-white/5 backdrop-blur-xl sticky top-0 z-30 mb-8">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <BarChart3 className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-headline font-bold">Management Terminal</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold leading-none">Real-time Facility Analytics</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" className="text-xs font-bold uppercase tracking-widest hover:bg-white/5">
                <MapIcon className="mr-2 h-4 w-4" />
                Live Map
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-8 bg-white/10" />
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold">{userProfile?.displayName}</p>
                <Badge variant="outline" className="text-[9px] uppercase tracking-tighter h-4 px-1 px-1 py-0 border-primary/30 text-primary">Admin</Badge>
              </div>
              <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-primary">
                {userProfile?.displayName?.[0]}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-6 space-y-8">

        {/* Statistics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Capacity', value: stats?.total, icon: Database, color: 'text-foreground' },
            { label: 'Available Now', value: stats?.available, icon: Zap, color: 'text-emerald-400' },
            { label: 'Currently In Use', value: stats?.inUse, icon: Activity, color: 'text-blue-400' },
            { label: 'Advanced Bookings', value: stats?.booked, icon: Clock, color: 'text-amber-400' },
            { label: 'System Restricted', value: stats?.unavailable, icon: ShieldAlert, color: 'text-zinc-500' },
          ].map((stat, i) => (
            <Card key={i} className="glass-card border-white/5 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.02] rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{stat.label}</p>
                  <stat.icon className={cn("size-4 opacity-50", stat.color)} />
                </div>
                <p className={cn("text-3xl font-headline font-bold", stat.color)}>{stat.value ?? '...'}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr,350px] gap-8">

          {/* Main Map View */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-headline font-bold flex items-center gap-2">
                Floor Plan Visualizer
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-none animate-pulse">Live Sync</Badge>
              </h2>

              <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-xl border border-white/5">
                {filterOptions.map(({ id, icon: Icon }) => (
                  <Button
                    key={id}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterChange(id)}
                    className={cn(
                      "h-8 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                      activeFilters.includes(id) ? "bg-white/10 text-primary" : "text-muted-foreground opacity-50"
                    )}
                  >
                    <Icon className="mr-2 h-3.5 w-3.5" />
                    {id}
                  </Button>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-[2.5rem] p-8 lg:p-12 premium-border">
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                  <Activity className="size-10 animate-pulse text-primary" />
                  <p className="text-xs uppercase tracking-widest font-bold">Synchronizing Satellite Data...</p>
                </div>
              )}
              <ParkingMap zones={filteredZones} onSpotClick={handleSpotClick} isRemoveMode={isRemoveMode} onRemoveClick={removeSpot} />
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            <Card className="glass-card border-white/5 overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Settings className="size-4" />
                  Terminal Controls
                </CardTitle>
                <CardDescription className="text-xs mt-1">Global facility management tools.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Provisioning</p>
                  <div className="flex flex-col gap-2">
                    <AddSpotDialog
                      onSpotAdded={() => {
                        refresh();
                        toast({ title: 'System Updated', description: 'New parking spot commissioned.' });
                      }}
                      onError={(msg) => toast({ variant: 'destructive', title: 'Provisioning Error', description: msg })}
                    />
                    <BulkAddSpotsDialog
                      onSpotsAdded={(count) => {
                        refresh();
                        toast({ title: 'Batch Success', description: `Commissioned ${count} new units.` });
                      }}
                      onError={(msg) => toast({ variant: 'destructive', title: 'Batch Error', description: msg })}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Maintenance</p>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => setIsRemoveMode(!isRemoveMode)}
                      variant={isRemoveMode ? 'destructive' : 'outline'}
                      className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-widest"
                    >
                      {isRemoveMode ? <XCircle className="mr-2 size-4" /> : <Trash2 className="mr-2 size-4" />}
                      {isRemoveMode ? 'Exit Decomm Mode' : 'Decommission Mode'}
                    </Button>
                    <Separator className="bg-white/5 my-2" />
                    <Button
                      onClick={seedDatabase}
                      variant="ghost"
                      disabled={spots?.length > 0}
                      className="w-full text-[10px] uppercase font-bold tracking-widest opacity-50 hover:opacity-100"
                    >
                      Factory Reset Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/5 overflow-hidden">
              <CardHeader className="pb-4">
                <Link href="/dashboard/captures" className="hover:opacity-80 transition-opacity">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <Activity className="size-4 text-emerald-400" />
                    Recent Entry Captures
                  </CardTitle>
                </Link>
                <CardDescription className="text-xs mt-1">Live visual verification feed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {spots.filter(s => s.occupiedBy?.entryImage).reverse().length > 0 ? (
                  spots
                    .filter(s => s.occupiedBy?.entryImage)
                    .sort((a, b) => new Date(b.occupiedBy!.startTime).getTime() - new Date(a.occupiedBy!.startTime).getTime())
                    .slice(0, 5)
                    .map((spot) => (
                      <div
                        key={spot.id}
                        className="group relative rounded-2xl overflow-hidden border border-white/5 bg-white/5 cursor-pointer hover:border-primary/30 transition-all"
                        onClick={() => handleSpotClick(spot)}
                      >
                        <div className="aspect-video relative">
                          <img
                            src={spot.occupiedBy!.entryImage}
                            alt={`Capture for ${spot.id}`}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          />
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[9px] font-bold border border-white/10 uppercase tracking-tighter">
                            Spot {spot.id}
                          </div>
                        </div>
                        <div className="p-3 flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-mono font-bold text-primary">{spot.occupiedBy!.licensePlate}</p>
                            <p className="text-[9px] text-muted-foreground uppercase">{formatDistanceToNow(new Date(spot.occupiedBy!.startTime), { addSuffix: true })}</p>
                          </div>
                          <Badge variant="outline" className="text-[8px] h-4 border-emerald-500/20 text-emerald-400 bg-emerald-500/5">Verified</Badge>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="py-10 text-center space-y-2 opacity-50">
                    <Car className="size-8 mx-auto mb-2 opacity-20" />
                    <p className="text-[10px] uppercase font-bold tracking-widest">No active captures</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card border-white/5 bg-primary/5">
              <CardContent className="p-6 text-center space-y-2">
                <ShieldAlert className="size-8 text-primary mx-auto mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest">System Integrity</p>
                <p className="text-[10px] text-muted-foreground">All sensors operational and reporting. Encryption active.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Overlays */}
      <SpotDetailsSheet
        isOpen={isSheetOpen}
        onOpenChange={setSheetOpen}
        spot={selectedSpot}
        onOccupy={handleOccupySpot}
        onDepart={handleDepart}
      />

      {departureData && (
        <PaymentReceiptDialog
          isOpen={isReceiptOpen}
          onOpenChange={setReceiptOpen}
          spot={selectedSpot}
          onConfirm={handleConfirmPayment}
          durationString={departureData.durationString}
          totalCost={departureData.totalCost}
        />
      )}
    </div>
  );
}
