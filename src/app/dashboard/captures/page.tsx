'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { formatDistanceToNow } from 'date-fns';
import {
    Camera,
    ArrowLeft,
    Search,
    Calendar,
    Car,
    MapPin,
    Clock,
    RefreshCw,
    LayoutGrid,
    List as ListIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function CapturesPage() {
    const { data: logs, error, mutate, isLoading } = useSWR('/api/camera-logs', (url) => fetch(url).then(res => res.json()), {
        refreshInterval: 5000
    });

    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const filteredLogs = logs?.filter((log: any) =>
        log.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
        log.spotId.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background selection:bg-primary/30 pb-20">
            {/* Header */}
            <nav className="fixed top-0 w-full z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5">
                            <ArrowLeft className="size-5" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <Camera className="size-5 text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-headline font-bold">Visual Entry Logs</h1>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold leading-none">Complete Camera History</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center bg-white/5 rounded-xl border border-white/10 px-3 h-10 w-64">
                        <Search className="size-4 opacity-30 mr-2" />
                        <input
                            placeholder="Search plate or spot..."
                            className="bg-transparent border-none outline-none text-sm w-full"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => mutate()}
                        className={cn("rounded-xl border-white/10 bg-white/5 h-10 w-10", isLoading && "animate-spin")}
                    >
                        <RefreshCw className="size-4" />
                    </Button>
                </div>
            </nav>

            <main className="pt-32 px-6 lg:px-12 max-w-[1600px] mx-auto space-y-10">

                {/* Controls Mobile */}
                <div className="md:hidden">
                    <Input
                        placeholder="Search log..."
                        className="h-12 bg-white/5 border-white/10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* View Toggle */}
                <div className="flex justify-between items-center bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5 w-fit ml-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className={cn("h-9 rounded-xl px-4 text-xs font-bold", viewMode === 'grid' ? "bg-white/10 text-primary" : "text-muted-foreground")}
                    >
                        <LayoutGrid className="size-3.5 mr-2" /> Grid
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className={cn("h-9 rounded-xl px-4 text-xs font-bold", viewMode === 'list' ? "bg-white/10 text-primary" : "text-muted-foreground")}
                    >
                        <ListIcon className="size-3.5 mr-2" /> List
                    </Button>
                </div>

                {/* Empty State */}
                {!isLoading && filteredLogs?.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-50">
                        <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center">
                            <Camera className="size-8 opacity-20" />
                        </div>
                        <p className="font-bold text-sm uppercase tracking-[0.2em]">No captures found</p>
                    </div>
                )}

                {/* Captures Grid */}
                <div className={cn(
                    "grid gap-6",
                    viewMode === 'grid'
                        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        : "grid-cols-1"
                )}>
                    {filteredLogs?.map((log: any) => (
                        <Card key={log._id} className="glass-card border-white/5 overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                            <div className={cn(
                                "relative",
                                viewMode === 'list' && "flex h-48"
                            )}>
                                <div className={cn(
                                    "relative overflow-hidden bg-black/40",
                                    viewMode === 'list' ? "w-80 h-full border-r border-white/5" : "aspect-video"
                                )}>
                                    <img
                                        src={log.imagePath}
                                        alt={`Capture ${log.licensePlate}`}
                                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute top-4 left-4">
                                        <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-[10px] font-bold py-1 px-3">
                                            SPOT {log.spotId}
                                        </Badge>
                                    </div>
                                </div>

                                <CardContent className={cn(
                                    "p-6 space-y-4",
                                    viewMode === 'list' && "flex-1 flex flex-col justify-center"
                                )}>
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Detected Plate</p>
                                            <h3 className="text-2xl font-mono font-bold tracking-tighter text-emerald-400">{log.licensePlate}</h3>
                                        </div>
                                        <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 bg-emerald-500/5 px-3 py-1 text-[9px] uppercase font-bold">AI Verified</Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                                                <Clock className="size-3" /> Time Ago
                                            </p>
                                            <p className="text-xs font-bold">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                                                <MapPin className="size-3" /> Location
                                            </p>
                                            <p className="text-xs font-bold">Main Entry</p>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <p className="text-[10px] text-muted-foreground/60 italic">User: {log.userDisplayName || 'Guest'}</p>
                                    </div>
                                </CardContent>
                            </div>
                        </Card>
                    ))}
                </div>
            </main>
        </div>
    );
}
