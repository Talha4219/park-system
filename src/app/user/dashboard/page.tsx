'use client';

import { useMemo, useEffect } from 'react';
import useSWR from 'swr';
import { useAuth } from '@/contexts/auth-context';
import type { ParkingSpot, ParkingHistory } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, Clock, MapPin, Calendar, LogOut, LayoutDashboard, User, ShieldCheck, CreditCard, ChevronRight, Navigation, BatteryCharging } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function UserDashboard() {
    const { user, logout } = useAuth();
    const { toast } = useToast();
    const { data: spots, error, mutate } = useSWR<ParkingSpot[]>(
        '/api/parking-spots',
        async (url) => {
            const res = await fetch(url);
            return res.json();
        },
        { refreshInterval: 5000 }
    );

    const { data: history } = useSWR<ParkingHistory[]>(
        '/api/parking/history',
        fetcher,
        { refreshInterval: 10000 }
    );

    const handlePayment = async (spotId: string) => {
        try {
            const res = await fetch('/api/parking/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ spotId }),
            });

            if (!res.ok) throw new Error('Payment failed');

            mutate();
            toast({
                title: 'Payment Successful',
                description: 'The gate will now open automatically when you reach the exit.',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to settle payment.',
            });
        }
    };

    const myReservations = useMemo(() => {
        if (!spots || !user) return [];
        return spots.filter(s => s.reservedBy?.userId === user.uid);
    }, [spots, user]);

    const myOccupiedSpot = useMemo(() => {
        if (!spots || !user) return null;
        return spots.find(s => s.status === 'in-use' && s.occupiedBy?.licensePlate === user.carNumber);
    }, [spots, user]);

    const isPaid = myOccupiedSpot?.occupiedBy?.isPaid;
    const isAtExit = myOccupiedSpot?.occupiedBy?.isAtExit;
    const currentBill = myOccupiedSpot?.occupiedBy?.totalBill || 0;

    // Auto-alert when at exit
    useEffect(() => {
        if (isAtExit && !isPaid) {
            toast({
                title: "Action Required: At Exit Gate",
                description: "Please settle your parking bill to open the exit gate.",
                className: "bg-amber-500 text-white border-none shadow-lg shadow-amber-500/20"
            });
        }
    }, [isAtExit, isPaid, toast]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background">
            {/* Header / Profile Summary */}
            <div className="bg-zinc-900 shadow-2xl border-b border-white/5 pt-12 pb-8">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="absolute -inset-1.5 bg-gradient-to-tr from-primary to-blue-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                <div className="relative h-24 w-24 rounded-2xl bg-zinc-800 border-2 border-white/10 flex items-center justify-center overflow-hidden">
                                    <span className="text-4xl font-headline font-bold text-primary">{user.displayName?.[0]}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-3xl font-headline font-bold">{user.displayName}</h1>
                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] uppercase font-bold tracking-widest px-2 py-0">Platinum Member</Badge>
                                </div>
                                <div className="flex items-center gap-4 text-muted-foreground text-sm font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <Car className="size-3.5" />
                                        {user.carNumber}
                                    </span>
                                    <Separator orientation="vertical" className="h-4 bg-white/10" />
                                    <span className="flex items-center gap-1.5 ">
                                        <User className="size-3.5" />
                                        {user.email}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button onClick={logout} variant="outline" size="sm" className="h-10 rounded-xl border-white/5 bg-white/5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all">
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid lg:grid-cols-3 gap-8">

                    {/* Active Sessions - Sidebar */}
                    <div className="lg:col-span-1 space-y-8">
                        <div>
                            <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-4">Active Session</h2>
                            {myOccupiedSpot ? (
                                <Card className={cn(
                                    "glass-card premium-border overflow-hidden relative group transition-all duration-500",
                                    isAtExit && !isPaid ? "ring-2 ring-amber-500/50 shadow-2xl shadow-amber-500/20" : ""
                                )}>
                                    <div className="absolute top-0 right-0 p-4">
                                        <div className={cn(
                                            "h-2 w-2 rounded-full animate-pulse",
                                            isPaid ? "bg-emerald-500" : isAtExit ? "bg-amber-500" : "bg-blue-500"
                                        )}></div>
                                    </div>
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-xl font-headline font-bold">
                                            {isAtExit ? "Action Required" : "In-Use Now"}
                                        </CardTitle>
                                        <CardDescription className={cn(
                                            "text-xs font-bold uppercase tracking-tighter",
                                            isPaid ? "text-emerald-400" : isAtExit ? "text-amber-400" : "text-blue-400"
                                        )}>
                                            {isPaid ? "Gate Access Authorized" : isAtExit ? "Please Settle Bill to Exit" : "Gate Access Active"}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {isAtExit && !isPaid && (
                                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-widest text-center animate-pulse">
                                                Vehicle Detected at Exit Gate
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                                            <div className="space-y-1">
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Spot ID</p>
                                                <p className="text-4xl font-headline font-bold">{myOccupiedSpot.id}</p>
                                            </div>
                                            <div className={cn(
                                                "h-12 w-12 rounded-xl border flex items-center justify-center",
                                                isPaid ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                                                    isAtExit ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                                                        "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                            )}>
                                                <MapPin />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground font-medium flex items-center gap-2"><Clock className="size-4" /> Duration</span>
                                                <span className="font-bold font-mono">
                                                    {myOccupiedSpot.occupiedBy && formatDistanceToNow(new Date(myOccupiedSpot.occupiedBy.startTime))}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground font-medium flex items-center gap-2"><CreditCard className="size-4" /> {isPaid ? "Total Paid" : "Current Bill"}</span>
                                                <span className={cn("font-bold font-headline text-lg", isPaid ? "text-emerald-400" : "text-primary")}>
                                                    ${isPaid ? currentBill.toFixed(2) : currentBill > 0 ? currentBill.toFixed(2) : "5.40"}
                                                </span>
                                            </div>
                                        </div>

                                        {isPaid ? (
                                            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold text-center">
                                                Ready for Departure
                                            </div>
                                        ) : (
                                            <Button
                                                onClick={() => handlePayment(myOccupiedSpot.id)}
                                                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20"
                                            >
                                                <CreditCard className="mr-2 size-4" />
                                                Settle Bill & Exit
                                            </Button>
                                        )}

                                        <Button variant="ghost" className="w-full h-12 rounded-xl text-muted-foreground font-bold hover:bg-white/5">
                                            <Navigation className="mr-2 size-4" />
                                            Navigate to Spot
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="glass-card border-dashed border-white/10 bg-transparent">
                                    <CardContent className="py-20 text-center space-y-3 opacity-50">
                                        <div className="h-12 w-12 rounded-2xl border border-white/10 flex items-center justify-center mx-auto mb-2">
                                            <Car className="text-muted-foreground" />
                                        </div>
                                        <p className="text-sm font-bold uppercase tracking-widest">No active session</p>
                                        <Link href="/">
                                            <Button variant="link" className="text-xs font-bold text-primary uppercase tracking-tighter">Locate Spot <ChevronRight className="ml-1 size-3" /></Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                    <ShieldCheck className="size-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold leading-none">Identity Verified</p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Level 2 Security</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Clock className="size-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold leading-none">Premium Pass</p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Expires Oct 2026</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content - History / Bookings */}
                    <div className="lg:col-span-2 space-y-12">

                        {/* Bookings */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-headline font-bold">Confirmed Bookings</h2>
                                <Badge variant="outline" className="border-white/5 bg-white/5">{myReservations.length}</Badge>
                            </div>

                            {myReservations.length > 0 ? (
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {myReservations.map(spot => (
                                        <Card key={spot.id} className="glass-card border-white/5 hover:border-primary/50 transition-all duration-300 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-500"></div>
                                            <CardContent className="p-6 space-y-6">
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Zone Allocated</p>
                                                        <p className="text-3xl font-headline font-bold">{spot.id}</p>
                                                    </div>
                                                    <Badge className="bg-amber-500/10 text-amber-500 border-none font-bold uppercase text-[9px]">Booked</Badge>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground whitespace-nowrap overflow-hidden">
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/50 border border-white/5">
                                                        <Car className="size-3.5" />
                                                        <span className="font-mono">{spot.occupiedBy?.licensePlate || user.carNumber}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/50 border border-white/5">
                                                        <Calendar className="size-3.5" />
                                                        <span>Booked {spot.reservedBy && formatDistanceToNow(new Date(spot.reservedBy.reservedAt))} ago</span>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="ghost" className="w-full justify-between h-10 hover:bg-white/5 rounded-xl border border-white/5 text-[10px] font-bold uppercase tracking-widest">
                                                    Manage Access
                                                    <ChevronRight className="size-4" />
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <Card className="glass-card border-white/5 py-12 text-center">
                                    <div className="space-y-4 max-w-xs mx-auto">
                                        <p className="text-muted-foreground text-sm font-medium">No advance bookings found. Secure your favorite spot before arrival.</p>
                                        <Link href="/">
                                            <Button className="rounded-xl px-8 shadow-lg shadow-primary/20">Find a Spot</Button>
                                        </Link>
                                    </div>
                                </Card>
                            )}
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-headline font-bold">Recent History</h2>
                                <Button variant="link" className="text-primary text-[10px] font-bold uppercase tracking-widest px-0 h-auto">View All Activity</Button>
                            </div>
                            <div className="rounded-[2rem] border border-white/5 bg-zinc-900/40 backdrop-blur-sm divide-y divide-white/5 overflow-hidden shadow-2xl">
                                {history && history.length > 0 ? (
                                    history.map((item) => (
                                        <div key={item._id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform">
                                                    <HistoryItemIcon type={item.spotType === 'ev' ? 'ev' : 'regular'} />
                                                </div>
                                                <div>
                                                    <p className="font-bold">Parking Session {item.spotId}</p>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                        {new Date(item.endTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • {item.duration}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold underline italic text-primary cursor-pointer hover:text-primary/80 transition-colors">View Receipt</p>
                                                <p className="text-[10px] font-headline font-bold uppercase text-muted-foreground">${Number(item.totalCost).toFixed(2)} Paid</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center opacity-50 space-y-2">
                                        <div className="h-12 w-12 rounded-2xl border border-white/10 flex items-center justify-center mx-auto mb-4">
                                            <Clock className="text-muted-foreground" />
                                        </div>
                                        <p className="text-sm font-bold uppercase tracking-widest">No Recent Activity</p>
                                        <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">Your parking history will appear here once you complete your first session.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}

function HistoryItemIcon({ type }: { type: 'ev' | 'regular' }) {
    if (type === 'ev') return <BatteryCharging className="size-5 text-amber-400" />
    return <Car className="size-5 text-primary" />
}
