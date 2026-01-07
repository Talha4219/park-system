import { Accessibility, BatteryCharging, Car, Ban, Trash2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ParkingSpot as ParkingSpotType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

interface ParkingSpotProps {
  spot: ParkingSpotType;
  onClick: () => void;
  isRemoveMode?: boolean;
  onRemoveClick?: () => void;
}

const spotIcons = {
  regular: Car,
  accessible: Accessibility,
  ev: BatteryCharging,
};

export function ParkingSpot({ spot, onClick, isRemoveMode = false, onRemoveClick = () => { } }: ParkingSpotProps) {
  const Icon = spotIcons[spot.type];

  const spotStyles = {
    available: 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50',
    'in-use': 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/50',
    booked: 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/50',
    unavailable: 'border-zinc-800 bg-zinc-900/50 text-zinc-600 opacity-50 cursor-not-allowed',
  };

  const statusColors = {
    available: 'text-emerald-500',
    'in-use': 'text-blue-500',
    booked: 'text-amber-500',
    unavailable: 'text-zinc-600',
  };

  const isDisabled = spot.status === 'unavailable' || (spot.status === 'in-use' && !isRemoveMode) || (spot.status === 'booked' && !isRemoveMode);

  return (
    <div className="relative group">
      <Button
        variant="ghost"
        className={cn(
          'h-32 w-full flex-col gap-2 p-4 justify-between items-stretch relative transition-all duration-300 ease-out border backdrop-blur-sm group/btn',
          spotStyles[spot.status],
          !isDisabled && 'hover:scale-[1.02] active:scale-95 shadow-lg shadow-black/20'
        )}
        onClick={onClick}
        disabled={isDisabled}
      >
        <div className="flex w-full justify-between items-start">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Spot</span>
            <span className="text-xl font-headline font-bold leading-none">{spot.id}</span>
          </div>
          <div className={cn("p-2 rounded-lg bg-background/50 border border-white/5 shadow-inner", statusColors[spot.status])}>
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          {spot.status === 'in-use' && spot.occupiedBy ? (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              <p className="font-mono text-xs font-bold tracking-tighter truncate">
                {spot.occupiedBy.licensePlate}
              </p>
            </div>
          ) : spot.status === 'booked' ? (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-tight text-amber-500">Booked</p>
            </div>
          ) : spot.status === 'unavailable' ? (
            <div className="flex items-center gap-2 text-zinc-600">
              <Ban className="h-3 w-3" />
              <p className="text-[10px] font-bold uppercase">Restricted</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <p className="text-[10px] font-bold uppercase tracking-tight text-emerald-500">Available</p>
            </div>
          )}
        </div>

        {/* Progress-like indicator at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 overflow-hidden rounded-b-[inherit]">
          <div className={cn(
            "h-full transition-all duration-1000 ease-in-out",
            spot.status === 'available' ? 'w-full bg-emerald-500/50' :
              spot.status === 'in-use' ? 'w-full bg-blue-500/50' :
                spot.status === 'booked' ? 'w-1/2 bg-amber-500/50' : 'w-0'
          )} />
        </div>
      </Button>

      {isRemoveMode && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon" className="absolute -top-3 -right-3 h-8 w-8 rounded-full z-10 shadow-xl border border-white/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="glass-card">
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Spot?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete spot <strong className="text-foreground">{spot.id}</strong>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white/5 border-white/10">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onRemoveClick} className="bg-destructive hover:bg-destructive/90 text-white">Remove</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
